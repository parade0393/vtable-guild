import {
  cloneVNode,
  computed,
  defineComponent,
  inject,
  isVNode,
  ref,
  watch,
  type PropType,
  type VNodeChild,
} from 'vue'
import {
  cnByCssMode,
  useTheme,
  VTABLE_GUILD_INJECTION_KEY,
  type VTableGuildPaginationLocale,
} from '@vtable-guild/core'
import { resolvePaginationThemePreset } from '@vtable-guild/theme'
import type {
  PaginationItemType,
  TablePaginationConfig,
  TablePaginationState,
} from '../types/pagination'
import PaginationSizeSelect from './PaginationSizeSelect'

/** Bounded page window, even for millions of pages. */
export function paginationItems(
  current: number,
  pages: number,
  less: boolean,
): Array<{ page: number; type: PaginationItemType }> {
  const radius = less ? 1 : 2
  const result: Array<{ page: number; type: PaginationItemType }> = []
  if (pages <= radius * 2 + 3)
    return Array.from({ length: pages }, (_, index) => ({ page: index + 1, type: 'page' }))
  const start = pages - current <= radius ? pages - radius * 2 : Math.max(1, current - radius)
  const end = current - 1 <= radius ? radius * 2 + 1 : Math.min(pages, current + radius)
  if (start !== 1) result.push({ page: 1, type: 'page' })
  if (current - 1 >= radius * 2 && current !== 3)
    result.push({ page: Math.max(1, current - (less ? 3 : 5)), type: 'jump-prev' })
  for (let page = start; page <= end; page++) result.push({ page, type: 'page' })
  if (pages - current >= radius * 2 && current !== pages - 2)
    result.push({ page: Math.min(pages, current + (less ? 3 : 5)), type: 'jump-next' })
  if (end !== pages) result.push({ page: pages, type: 'page' })
  return result
}

export default defineComponent({
  name: 'TablePagination',
  props: {
    config: { type: Object as PropType<TablePaginationConfig>, required: true },
    state: { type: Object as PropType<TablePaginationState>, required: true },
    locale: { type: Object as PropType<VTableGuildPaginationLocale>, required: true },
    align: { type: String as PropType<'left' | 'center' | 'right'>, default: 'right' },
    tableSize: String as PropType<'large' | 'middle' | 'small'>,
    narrow: Boolean,
    getPopupContainer: Function as PropType<(trigger: HTMLElement) => HTMLElement>,
  },
  emits: { change: (_page: number, _pageSize?: number) => true },
  setup(props, { emit }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const theme = computed(() => resolvePaginationThemePreset(context?.themePreset))
    const { slots: styles } = useTheme('pagination', theme, {
      get size() {
        return (
          props.config.size ??
          (props.tableSize === 'small' ||
          props.tableSize === 'middle' ||
          (props.config.responsive && props.narrow)
            ? 'small'
            : 'default')
        )
      },
      get align() {
        return props.align
      },
      get simple() {
        return !!props.config.simple
      },
      get disabled() {
        return !!props.config.disabled
      },
      get class() {
        return props.config.class
      },
    })
    const pages = computed(() => Math.max(1, Math.ceil(props.state.total / props.state.pageSize)))
    const input = ref('')
    const simpleInput = ref(String(props.state.current))
    watch(
      () => props.state.current,
      (current) => {
        simpleInput.value = String(current)
        input.value = ''
      },
    )
    function jump(simple = false, offset = 0) {
      const raw = simple ? simpleInput.value : input.value
      const value = Number(raw) + offset
      if (!props.config.disabled && raw.trim() !== '' && Number.isSafeInteger(value)) {
        const page = Math.max(1, Math.min(pages.value, value))
        if (page !== props.state.current) emit('change', page)
      }
      input.value = ''
      simpleInput.value = String(props.state.current)
    }
    function item(page: number, type: PaginationItemType) {
      const p = props.config
      const isPage = type === 'page'
      const disabled =
        !!p.disabled ||
        (type === 'prev' && props.state.current <= 1) ||
        (type === 'next' && props.state.current >= pages.value)
      const labels = props.locale
      const label = isPage
        ? `${labels.page} ${page}`
        : type === 'prev'
          ? labels.prev_page
          : type === 'next'
            ? labels.next_page
            : type === 'jump-prev'
              ? p.showLessItems
                ? labels.prev_3
                : labels.prev_5
              : p.showLessItems
                ? labels.next_3
                : labels.next_5
      const content: VNodeChild = isPage ? (
        page
      ) : type.startsWith('jump') ? (
        <>
          <span aria-hidden="true" class={styles.jumpEllipsis()}>
            •••
          </span>
          <svg
            aria-hidden="true"
            class={styles.jumpIcon()}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
          >
            <path
              d={type === 'jump-prev' ? 'm8 3-5 5 5 5m5-10-5 5 5 5' : 'm3 3 5 5-5 5m5-10 5 5-5 5'}
            />
          </svg>
        </>
      ) : (
        <svg
          aria-hidden="true"
          class={styles.icon()}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
        >
          <path d={type === 'prev' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} />
        </svg>
      )
      const itemClass = cnByCssMode(
        context?.cssMode ?? 'prebuilt',
        context?.classPrefix ?? 'vtg',
        styles.item(),
        type.startsWith('jump') && styles.jump(),
        isPage && page === props.state.current && styles.active(),
      )
      const original = (
        <button
          type="button"
          disabled={disabled}
          title={isPage ? String(page) : label}
          aria-label={label}
          aria-current={isPage && page === props.state.current ? 'page' : undefined}
          class={itemClass}
        >
          {content}
        </button>
      )
      const rendered = p.itemRender
        ? p.itemRender({ page, type, originalElement: original })
        : original
      const node = isVNode(rendered) ? rendered : <span>{rendered}</span>
      const nativeButton = node.type === 'button'
      return cloneVNode(node, {
        key: type + page,
        class: itemClass,
        role: nativeButton ? undefined : 'button',
        tabindex: disabled ? -1 : 0,
        'aria-label': label,
        title: isPage ? String(page) : label,
        'aria-disabled': disabled,
        'aria-current': isPage && page === props.state.current ? 'page' : undefined,
        onClickCapture: (event: MouseEvent) => {
          if (disabled) {
            event.preventDefault()
            event.stopImmediatePropagation()
          }
        },
        onClick: (event: MouseEvent) => {
          event.preventDefault()
          if (!disabled) emit('change', page)
        },
        onKeydown: (event: KeyboardEvent) => {
          if (!nativeButton && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            if (!disabled) emit('change', page)
          }
        },
      })
    }
    return () => {
      const p = props.config
      const { current, pageSize, total } = props.state
      if (p.hideOnSinglePage && pages.value <= 1) return null
      const go = typeof p.showQuickJumper === 'object' ? p.showQuickJumper.goButton : undefined
      const withGo = go !== undefined && go !== false && go !== null
      return (
        <nav aria-label={props.locale.navigation} class={styles.root()} style={p.style}>
          {p.showTotal && !p.simple && (
            <span class={styles.total()}>
              {p.showTotal(
                total,
                total === 0
                  ? [0, 0]
                  : [(current - 1) * pageSize + 1, Math.min(current * pageSize, total)],
              )}
            </span>
          )}
          <span class={styles.pages()}>
            {item(current - 1, 'prev')}
            {p.simple ? (
              <span class={styles.simpleControls()} title={`${current}/${pages.value}`}>
                <input
                  class={cnByCssMode(
                    context?.cssMode ?? 'prebuilt',
                    context?.classPrefix ?? 'vtg',
                    styles.input(),
                    styles.simpleInput(),
                  )}
                  aria-label={props.locale.page}
                  inputmode="numeric"
                  disabled={p.disabled}
                  value={simpleInput.value}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement
                    const value = target.value
                    if (value === '' || Number.isFinite(Number(value)))
                      simpleInput.value =
                        value === '' ? '' : String(Math.min(pages.value, Number(value)))
                    target.value = simpleInput.value
                  }}
                  onKeydown={(e) => {
                    if (['Enter', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      e.preventDefault()
                      jump(true, e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0)
                    }
                  }}
                />
                <span class={styles.slash()}>／</span>
                <span>{pages.value}</span>
              </span>
            ) : (
              paginationItems(current, pages.value, !!p.showLessItems).map(({ page, type }) =>
                item(page, type),
              )
            )}
            {item(current + 1, 'next')}
          </span>
          {!p.simple && (p.showSizeChanger ?? total > (p.totalBoundaryShowSizeChanger ?? 50)) && (
            <PaginationSizeSelect
              value={pageSize}
              options={p.pageSizeOptions ?? ['10', '20', '50', '100']}
              disabled={p.disabled}
              label={props.locale.page_size}
              theme={styles}
              getPopupContainer={props.getPopupContainer}
              renderText={(value) =>
                p.buildOptionText
                  ? p.buildOptionText({ value })
                  : `${value} ${props.locale.items_per_page}`
              }
              onChange={(size) => emit('change', current, size)}
            />
          )}
          {p.showQuickJumper && (!p.simple || withGo) && (
            <span class={styles.controls()}>
              {!p.simple && (
                <>
                  <span>{props.locale.jump_to}</span>
                  <input
                    class={styles.input()}
                    aria-label={props.locale.jump_to}
                    inputmode="numeric"
                    disabled={p.disabled}
                    value={input.value}
                    onInput={(e) => {
                      input.value = (e.target as HTMLInputElement).value
                    }}
                    onBlur={() => {
                      if (!withGo) jump()
                    }}
                    onKeydown={(e) => {
                      if (e.key === 'Enter') jump()
                    }}
                  />
                  <span>{props.locale.page}</span>
                </>
              )}
              {withGo &&
                (isVNode(go) ? (
                  cloneVNode(go, {
                    class: styles.item(),
                    role: 'button',
                    tabindex: p.disabled ? -1 : 0,
                    'aria-disabled': p.disabled,
                    onClickCapture: (event: MouseEvent) => {
                      if (p.disabled) {
                        event.preventDefault()
                        event.stopImmediatePropagation()
                      }
                    },
                    onClick: () => jump(!!p.simple),
                    onKeydown: (event: KeyboardEvent) => {
                      if (go.type !== 'button' && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        jump(!!p.simple)
                      }
                    },
                  })
                ) : (
                  <button
                    type="button"
                    class={styles.go()}
                    disabled={p.disabled}
                    onClick={() => jump(!!p.simple)}
                  >
                    {go === true ? props.locale.jump_to_confirm : go}
                  </button>
                ))}
            </span>
          )}
        </nav>
      )
    }
  },
})
