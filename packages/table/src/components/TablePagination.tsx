import {
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  inject,
  isVNode,
  ref,
  Text,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
  type VNodeChild,
} from 'vue'
import {
  cnByCssMode,
  devWarn,
  useTheme,
  VTABLE_GUILD_INJECTION_KEY,
  type VTableGuildPaginationLocale,
} from '@vtable-guild/core'
import {
  paginationZhCN,
  resolveBuiltInLocale,
  resolvePaginationThemePreset,
} from '@vtable-guild/theme'
import type {
  PaginationItemType,
  TablePaginationBuiltinLayoutItem,
  TablePaginationConfig,
  TablePaginationLayoutItem,
  TablePaginationSlotProps,
  TablePaginationState,
} from '../types/pagination'
import { resolvePaginationLayout } from '../utils/paginationLayout'
import { ensureValidVNode } from '../utils/vnode'
import PaginationSizeSelect from './PaginationSizeSelect'

function hasPaginationContent(content: VNodeChild): boolean {
  if (Array.isArray(content)) return content.some(hasPaginationContent)
  if (typeof content === 'string') return content.trim().length > 0
  if (isVNode(content) && (content.type === Fragment || content.type === Text))
    return hasPaginationContent(content.children as VNodeChild)
  return ensureValidVNode(content) !== null
}

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

/** Element Plus keeps pagerCount numeric pages at the edges, and pagerCount - 2 in the middle. */
export function elementPlusPaginationItems(current: number, pages: number, count = 7) {
  const half = (count - 1) / 2
  const prev = pages > count && current > count - half
  const next = pages > count && current < pages - half
  const start = prev ? (next ? current - half + 1 : pages - count + 2) : 2
  const end = next ? (prev ? current + half - 1 : count - 1) : pages - 1
  const result: Array<{ page: number; type: PaginationItemType }> = [{ page: 1, type: 'page' }]
  if (prev) result.push({ page: Math.max(1, current - count + 2), type: 'jump-prev' })
  for (let page = start; page <= end; page++) result.push({ page, type: 'page' })
  if (next) result.push({ page: Math.min(pages, current + count - 2), type: 'jump-next' })
  if (pages > 1) result.push({ page: pages, type: 'page' })
  return result
}

export default defineComponent({
  name: 'TablePagination',
  props: {
    config: { type: Object as PropType<TablePaginationConfig>, required: true },
    state: { type: Object as PropType<TablePaginationState>, required: true },
    locale: { type: Object as PropType<VTableGuildPaginationLocale>, required: true },
    align: { type: String as PropType<'left' | 'center' | 'right'>, default: 'right' },
    position: {
      type: String as PropType<TablePaginationSlotProps['position']>,
      default: 'bottomRight',
    },
    tableSize: String as PropType<'large' | 'middle' | 'small'>,
    narrow: Boolean,
    getPopupContainer: Function as PropType<(trigger: HTMLElement) => HTMLElement>,
  },
  emits: { change: (_page: number, _pageSize?: number) => true },
  slots: Object as SlotsType<{
    paginationItem?: (props: TablePaginationSlotProps) => VNodeChild
  }>,
  setup(props, { emit, slots }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const elementPlus = computed(() => context?.themePreset === 'element-plus')
    const layout = computed(() => {
      const resolved = resolvePaginationLayout(props.config.layout, context?.themePreset ?? 'antdv')
      for (const message of resolved.warnings)
        devWarn(`vtable-pagination-layout:${message}`, `[VTable] ${message}`)
      return resolved
    })
    const configuredPagerCount = computed(() => {
      const count = props.config.pagerCount
      if (count === undefined) return undefined
      if (
        typeof count === 'number' &&
        Number.isInteger(count) &&
        count >= 5 &&
        count <= 21 &&
        count % 2 === 1
      )
        return count
      devWarn(
        'vtable-pagination-pager-count',
        '[VTable] pagination.pagerCount must be an odd integer from 5 to 21. Falling back to showLessItems.',
      )
      return undefined
    })
    const pagerCount = computed(
      () => configuredPagerCount.value ?? (props.config.showLessItems ? 5 : 7),
    )
    const useElementWindow = computed(
      () => elementPlus.value || configuredPagerCount.value !== undefined,
    )
    const theme = computed(() => resolvePaginationThemePreset(context?.themePreset))
    const { slots: styles } = useTheme('pagination', theme, {
      get size() {
        return (
          props.config.size ??
          (elementPlus.value && !(props.config.responsive && props.narrow)
            ? props.tableSize === 'small'
              ? 'small'
              : 'default'
            : props.tableSize === 'small' ||
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
    const inputTouched = ref(false)
    const simpleInput = ref(String(props.state.current))
    watch(
      () => props.state.current,
      (current) => {
        simpleInput.value = String(current)
        input.value = ''
        inputTouched.value = false
      },
    )
    function jump(simple = false, offset = 0) {
      const raw = simple
        ? simpleInput.value
        : elementPlus.value && !inputTouched.value
          ? String(props.state.current)
          : input.value
      const value = (elementPlus.value && !simple ? Math.trunc(Number(raw)) : Number(raw)) + offset
      if (
        !props.config.disabled &&
        (raw.trim() !== '' || (elementPlus.value && !simple)) &&
        Number.isSafeInteger(value)
      ) {
        const page = Math.max(1, Math.min(pages.value, value))
        if (page !== props.state.current) emit('change', page)
      }
      input.value = ''
      inputTouched.value = false
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
      const jumpDistance = pagerCount.value - 2
      const jumpLabel = (direction: 'prev' | 'next') => {
        if (jumpDistance === 3) return direction === 'prev' ? labels.prev_3 : labels.next_3
        if (jumpDistance === 5) return direction === 'prev' ? labels.prev_5 : labels.next_5
        const key = direction === 'prev' ? 'prev_pages' : 'next_pages'
        const fallback =
          resolveBuiltInLocale(context?.themePreset, context?.locale)?.pagination ?? paginationZhCN
        return (labels[key] ?? fallback[key]!).replace(/\{count\}/g, String(jumpDistance))
      }
      const label = isPage
        ? `${labels.page} ${page}`
        : type === 'prev'
          ? labels.prev_page
          : type === 'next'
            ? labels.next_page
            : type === 'jump-prev'
              ? jumpLabel('prev')
              : jumpLabel('next')
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
          if (!disabled && (!elementPlus.value || page !== props.state.current))
            emit('change', page)
        },
        onKeydown: (event: KeyboardEvent) => {
          if (!nativeButton && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            if (!disabled && (!elementPlus.value || page !== props.state.current))
              emit('change', page)
          }
        },
      })
    }
    return () => {
      const p = props.config
      const { current, pageSize, total } = props.state
      if (p.hideOnSinglePage && pages.value <= 1) return null
      const resolvedLayout = layout.value
      const hasPager = resolvedLayout.regions.some((region) => region.items.includes('pager'))
      const range: [number, number] =
        total === 0 ? [0, 0] : [(current - 1) * pageSize + 1, Math.min(current * pageSize, total)]
      const go = typeof p.showQuickJumper === 'object' ? p.showQuickJumper.goButton : undefined
      const withGo = go !== undefined && go !== false && go !== null
      const renderTotal = () => {
        if (p.simple || !p.showTotal) return null
        const content = p.showTotal(total, [...range])
        return hasPaginationContent(content) ? <span class={styles.total()}>{content}</span> : null
      }
      const renderPager = () => (
        <>
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
            (useElementWindow.value
              ? elementPlusPaginationItems(current, pages.value, pagerCount.value)
              : paginationItems(current, pages.value, !!p.showLessItems)
            ).map(({ page, type }) => item(page, type))
          )}
        </>
      )
      const renderSizes = () =>
        !p.simple && (p.showSizeChanger ?? total > (p.totalBoundaryShowSizeChanger ?? 50)) ? (
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
                : `${value}${elementPlus.value ? '' : ' '}${props.locale.items_per_page}`
            }
            onChange={(size) => emit('change', current, size)}
          />
        ) : null
      const renderJumper = () => {
        if (!p.showQuickJumper || (p.simple && !withGo)) return null
        if (p.simple && !hasPager) {
          devWarn(
            'vtable-pagination-layout-simple-jumper',
            '[VTable] pagination.layout must include "pager" to use the simple mode Go button. Skipping "jumper".',
          )
          return null
        }
        return (
          <span class={styles.controls()}>
            {!p.simple && (
              <>
                <span>{props.locale.jump_to}</span>
                <input
                  class={styles.input()}
                  aria-label={props.locale.jump_to}
                  type={elementPlus.value ? 'number' : 'text'}
                  min={elementPlus.value ? 1 : undefined}
                  max={elementPlus.value ? pages.value : undefined}
                  inputmode="numeric"
                  disabled={p.disabled}
                  value={elementPlus.value && !inputTouched.value ? current : input.value}
                  onInput={(e) => {
                    input.value = (e.target as HTMLInputElement).value
                    inputTouched.value = true
                  }}
                  onBlur={() => {
                    if (!withGo) jump()
                  }}
                  onKeydown={(e) => {
                    if (e.key === 'Enter') jump()
                  }}
                />
                {!(elementPlus.value && props.locale.page === 'Page') && (
                  <span>{props.locale.page}</span>
                )}
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
        )
      }
      const renderers: Record<TablePaginationBuiltinLayoutItem, () => VNode | null> = {
        total: renderTotal,
        sizes: renderSizes,
        prev: () => item(current - 1, 'prev'),
        pager: renderPager,
        next: () => item(current + 1, 'next'),
        jumper: renderJumper,
      }
      function renderRegion(
        name: TablePaginationSlotProps['region'],
        items: TablePaginationLayoutItem[],
      ): VNode[] {
        const content: VNode[] = []
        let navigation: VNode[] = []
        let navigationKey = ''
        const flushNavigation = () => {
          if (!navigation.length) return
          content.push(
            <span key={`pages:${navigationKey}`} class={styles.pages()}>
              {navigation}
            </span>,
          )
          navigation = []
        }
        for (const entry of items) {
          if (typeof entry !== 'string') {
            if (!slots.paginationItem) {
              devWarn(
                'vtable-pagination-layout-missing-slot',
                '[VTable] pagination.layout uses a custom item but #paginationItem is not provided. Skipping custom items.',
              )
              continue
            }
            const customContent = slots.paginationItem({
              name: entry.slot,
              current,
              pageSize,
              total,
              pageCount: pages.value,
              range: [...range],
              disabled: !!p.disabled,
              position: props.position,
              region: name,
            })
            if (!hasPaginationContent(customContent)) continue
            flushNavigation()
            content.push(
              <div key={`slot:${entry.slot}`} class={styles.extension()}>
                {customContent}
              </div>,
            )
            continue
          }
          const rendered = renderers[entry]()
          if (!rendered) continue
          const node = cloneVNode(rendered, { key: entry })
          // Keep each contiguous navigation group on the preset's page gap.
          if (entry === 'prev' || entry === 'pager' || entry === 'next') {
            if (!navigation.length) navigationKey = entry
            navigation.push(node)
          } else {
            flushNavigation()
            content.push(node)
          }
        }
        flushNavigation()
        return content
      }
      const content = resolvedLayout.regions.flatMap(({ name, items }) => {
        const children = renderRegion(name, items)
        if (!children.length || name === 'inline') return children
        return (
          <div key={name} class={name === 'left' ? styles.left() : styles.right()}>
            {children}
          </div>
        )
      })
      if (!content.length) return null
      return (
        <nav aria-label={props.locale.navigation} class={styles.root()} style={p.style}>
          {resolvedLayout.mode === 'split' ? <div class={styles.layout()}>{content}</div> : content}
        </nav>
      )
    }
  },
})
