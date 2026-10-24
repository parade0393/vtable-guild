import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  Teleport,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import { Tooltip, useTheme, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import { ColumnHeightOutlinedIcon, SettingOutlinedIcon } from '@vtable-guild/icons'
import {
  columnSettingsZhCN,
  resolveBuiltInLocale,
  resolveColumnSettingsThemePreset,
  resolveTableThemePreset,
} from '@vtable-guild/theme'
import type { ColumnsType } from '../types'
import type {
  TableColumnSettingsProps,
  TableColumnSettingsSize,
  TableColumnSettingsSlots,
} from '../types/column-settings'
import {
  canSetColumnFixed,
  columnFixedRegion,
  configurableEntries,
  isColumnSettingDisabled,
  isVisibilityLocked,
  moveSettingColumn,
  setColumnFixed,
  setColumnVisibility,
  type ColumnFixed,
  type SettingsEntry,
} from '../utils/columnSettings'
import { getPopupPositionStyle } from '../utils/popupPosition'

type Row = Record<string, unknown>
type Panel = 'columns' | 'density'

export default defineComponent({
  name: 'TableColumnSettings',
  props: {
    columns: { type: Array as PropType<ColumnsType<Row>>, required: true },
    size: String as PropType<TableColumnSettingsSize>,
    disabled: Boolean,
    options: Object as PropType<TableColumnSettingsProps['options']>,
    locale: Object as PropType<TableColumnSettingsProps['locale']>,
    ui: Object as PropType<TableColumnSettingsProps['ui']>,
    class: String,
    getPopupContainer: Function as PropType<TableColumnSettingsProps['getPopupContainer']>,
  },
  emits: {
    'update:columns': (_columns: ColumnsType<Row>) => true,
    'update:size': (_size: TableColumnSettingsSize) => true,
    reset: () => true,
  },
  slots: Object as SlotsType<TableColumnSettingsSlots>,
  setup(props, { emit, slots }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const preset = computed(() => context?.themePreset ?? 'antdv')
    const theme = computed(() => resolveColumnSettingsThemePreset(preset.value))
    const { slots: styles } = useTheme('columnSettings', theme, props)
    const size = computed<TableColumnSettingsSize>(() => {
      if (props.size) return props.size
      const configured = context?.theme.table?.defaultVariants?.size
      if (configured === 'large' || configured === 'middle' || configured === 'small')
        return configured
      return resolveTableThemePreset(preset.value).defaultVariants.size
    })
    const locale = computed(() => ({
      ...columnSettingsZhCN,
      ...resolveBuiltInLocale(preset.value, context?.locale)?.columnSettings,
      ...context?.locales[context.locale]?.columnSettings,
      ...context?.localeOverrides.columnSettings,
      ...props.locale,
    }))
    const id = useId()
    const trigger = ref<HTMLButtonElement | null>(null)
    const densityTrigger = ref<HTMLButtonElement | null>(null)
    const popup = ref<HTMLElement | null>(null)
    const open = ref<Panel | null>(null)
    const position = ref<Record<string, string>>({})
    const container = ref<HTMLElement | string>('body')
    const entries = computed(() => configurableEntries(props.columns))
    const dragging = ref<string | null>(null)
    const defaults = new Map<string, boolean | undefined>()
    const selection = computed(() => {
      const visible: boolean[] = []
      function visit(items: SettingsEntry<Row>[], parentVisible = true) {
        for (const item of items) {
          if (isColumnSettingDisabled(item.column, 'checkbox')) continue
          const shown = parentVisible && item.column.visible !== false
          if (!isVisibilityLocked(item)) visible.push(shown)
          visit(item.children, shown)
        }
      }
      visit(entries.value)
      return {
        all: visible.length > 0 && visible.every(Boolean),
        partial: visible.some(Boolean) && !visible.every(Boolean),
      }
    })
    // Newly introduced columns acquire a baseline when first seen. Existing defaults stay stable.
    function remember(items: SettingsEntry<Row>[]) {
      for (const item of items) {
        if (!defaults.has(item.id)) defaults.set(item.id, item.column.visible)
        remember(item.children)
      }
    }
    watch(entries, remember, { immediate: true, flush: 'sync' })
    function changeVisibility(entry: SettingsEntry<Row>, event: Event) {
      if (props.disabled || isVisibilityLocked(entry)) return
      const input = event.target as HTMLInputElement
      emit(
        'update:columns',
        setColumnVisibility(props.columns, new Map([[entry.id, input.checked]])),
      )
      // A native input must also honor a parent that declines the controlled update.
      input.checked = entry.column.visible !== false
    }
    function reset() {
      if (props.disabled) return
      emit('update:columns', setColumnVisibility(props.columns, defaults))
      emit('reset')
    }
    function changeAll(event: Event) {
      if (props.disabled || !entries.value.length) return
      const input = event.target as HTMLInputElement
      const values = new Map<string, boolean>()
      function visit(items: SettingsEntry<Row>[]) {
        for (const item of items) {
          if (isColumnSettingDisabled(item.column, 'checkbox')) continue
          if (!isVisibilityLocked(item)) values.set(item.id, input.checked)
          visit(item.children)
        }
      }
      visit(entries.value)
      emit('update:columns', setColumnVisibility(props.columns, values))
      input.checked = selection.value.all
      input.indeterminate = selection.value.partial
    }
    function activeTrigger(panel = open.value) {
      return panel === 'density' ? densityTrigger.value : trigger.value
    }
    let observer: ResizeObserver | undefined
    function close(restoreFocus = false) {
      const anchor = activeTrigger()
      open.value = null
      if (restoreFocus) anchor?.focus()
    }
    function reposition() {
      const anchor = activeTrigger()
      if (!open.value || !anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = popup.value?.getBoundingClientRect().width ?? 0
      // ProTable aligns both overlays to the right edge of their toolbar icon.
      const aligned = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.right - width,
      }
      position.value = {
        ...getPopupPositionStyle(aligned, container.value, width, popup.value?.scrollHeight),
        zIndex: 'var(--vtg-column-settings-z)',
      }
      if (container.value === document.body) {
        position.value.left = `${Math.max(8, Math.min(aligned.left, window.innerWidth - width - 8))}px`
        delete position.value.right
      }
    }
    function outside(event: Event) {
      const node = event.target as Node
      if (
        !trigger.value?.contains(node) &&
        !densityTrigger.value?.contains(node) &&
        !popup.value?.contains(node)
      )
        close()
    }
    async function show(panel: Panel) {
      const anchor = activeTrigger(panel)
      if (props.disabled || !anchor) return
      if (open.value === panel) return close()
      cleanup()
      container.value = props.getPopupContainer?.(anchor) ?? document.body
      open.value = panel
      reposition()
      await nextTick()
      if (open.value !== panel) return
      reposition()
      const first =
        panel === 'density'
          ? '[aria-checked="true"]'
          : 'input:not(:disabled), button:not(:disabled)'
      const focusTarget =
        popup.value?.querySelector<HTMLElement>(first) ??
        popup.value?.querySelector<HTMLElement>('button:not(:disabled)')
      focusTarget?.focus()
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(reposition)
        observer.observe(anchor)
        if (popup.value) observer.observe(popup.value)
      }
    }
    function keydown(event: KeyboardEvent) {
      if (open.value === 'density' && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const items = Array.from(
          popup.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
        )
        if (!items.length) return
        event.preventDefault()
        const current = items.indexOf(event.target as HTMLButtonElement)
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
        items[next]?.focus()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close(true)
      } else if (event.key === 'Tab') {
        if (open.value === 'density') {
          close(true)
          if (event.shiftKey) event.preventDefault()
          return
        }
        const controls = popup.value?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
        )
        if (!controls?.length) return
        if (
          (event.shiftKey && event.target === controls[0]) ||
          (!event.shiftKey && event.target === controls[controls.length - 1])
        ) {
          close(true)
          // Forward Tab proceeds from the trigger to the next control in the table.
          if (event.shiftKey) event.preventDefault()
        }
      }
    }
    function cleanup() {
      observer?.disconnect()
      observer = undefined
      if (typeof document === 'undefined') return
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
    watch(open, (active) => {
      if (!active) return cleanup()
      document.addEventListener('pointerdown', outside)
      document.addEventListener('focusin', outside)
      window.addEventListener('resize', reposition)
      window.addEventListener('scroll', reposition, true)
    })
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) close()
      },
    )
    watch(
      () => props.getPopupContainer,
      () => close(),
    )
    watch(
      () => [props.options?.density, props.options?.setting],
      () => {
        if (
          (open.value === 'density' && props.options?.density === false) ||
          (open.value === 'columns' && props.options?.setting === false)
        )
          close()
      },
    )
    onBeforeUnmount(cleanup)

    function changeFixed(entry: SettingsEntry<Row>, value: ColumnFixed) {
      if (props.disabled || !canSetColumnFixed(entry)) return
      if (columnFixedRegion(entry.column) === value) return
      const next = setColumnFixed(props.columns, entry.id, value)
      if (next !== props.columns) emit('update:columns', next)
    }
    function drop(entry: SettingsEntry<Row>, event: DragEvent) {
      event.preventDefault()
      event.stopPropagation()
      const from = dragging.value
      dragging.value = null
      if (!from || props.disabled || props.options?.draggable === false) return
      const next = moveSettingColumn(props.columns, from, entry.id)
      if (next !== props.columns) emit('update:columns', next)
    }
    function renderColumns(
      items: SettingsEntry<Row>[],
      parentHidden = false,
      nested = false,
    ): VNodeChild {
      return items.map((entry) => {
        const column = entry.column
        const label =
          slots.columnLabel?.({ column }) ??
          (typeof column.title === 'function' ? undefined : column.title) ??
          String(column.key ?? ('dataIndex' in column ? (column.dataIndex ?? '') : ''))
        return (
          <li
            key={entry.id}
            class={styles.item()}
            data-column-setting={entry.id}
            onDragover={(event: DragEvent) => {
              if (dragging.value && !nested) event.preventDefault()
            }}
            onDrop={!nested ? (event: DragEvent) => drop(entry, event) : undefined}
          >
            <div class={styles.row()}>
              {!nested && props.options?.draggable !== false && (
                <span
                  class={styles.dragHandle()}
                  draggable={
                    !props.disabled &&
                    !isColumnSettingDisabled(column, 'order') &&
                    columnFixedRegion(column) !== 'mixed'
                  }
                  title={locale.value.move}
                  aria-hidden="true"
                  onDragstart={(event: DragEvent) => {
                    if (props.disabled || isColumnSettingDisabled(column, 'order'))
                      return event.preventDefault()
                    dragging.value = entry.id
                    event.dataTransfer?.setData('text/plain', entry.id)
                    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragend={() => {
                    dragging.value = null
                  }}
                >
                  ⋮⋮
                </span>
              )}
              <label class={styles.label()}>
                <span class={styles.checkboxControl()}>
                  <input
                    type="checkbox"
                    class={styles.checkbox()}
                    checked={column.visible !== false}
                    disabled={props.disabled || parentHidden || isVisibilityLocked(entry)}
                    onChange={(event) => changeVisibility(entry, event)}
                  />
                  {column.visible !== false && (
                    <span class={styles.checkMark()} aria-hidden="true" />
                  )}
                </span>
                <span class={styles.labelText()}>{label}</span>
              </label>
              {!nested && props.options?.fixed !== false && (
                <span class={styles.pinActions()}>
                  {(['left', undefined, 'right'] as const).map((fixed) => {
                    const text =
                      fixed === 'left'
                        ? locale.value.fixedLeft
                        : fixed === 'right'
                          ? locale.value.fixedRight
                          : locale.value.unfixed
                    return (
                      <Tooltip title={text}>
                        <button
                          type="button"
                          class={styles.pinAction()}
                          disabled={props.disabled || !canSetColumnFixed(entry)}
                          aria-label={`${String(typeof label === 'string' || typeof label === 'number' ? label : (column.key ?? ''))}: ${text}`}
                          aria-pressed={columnFixedRegion(column) === fixed}
                          data-column-pin={fixed ?? 'none'}
                          onClick={() => changeFixed(entry, fixed)}
                        >
                          <svg
                            class={styles.pinIcon()}
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" />
                            {fixed ? (
                              <>
                                <path
                                  d={fixed === 'left' ? 'M6 3v10' : 'M10 3v10'}
                                  stroke="currentColor"
                                />
                                <rect
                                  x={fixed === 'left' ? '2' : '10'}
                                  y="3"
                                  width="4"
                                  height="10"
                                  fill="currentColor"
                                  opacity=".25"
                                />
                              </>
                            ) : (
                              <path d="M6 3v10M10 3v10" stroke="currentColor" />
                            )}
                          </svg>
                        </button>
                      </Tooltip>
                    )
                  })}
                </span>
              )}
            </div>
            {entry.children.length > 0 && (
              <ul class={styles.children()}>
                {renderColumns(
                  entry.children,
                  parentHidden ||
                    column.visible === false ||
                    isColumnSettingDisabled(column, 'checkbox'),
                  true,
                )}
              </ul>
            )}
          </li>
        )
      })
    }
    function renderColumnGroups() {
      const hasPinned = entries.value.some((entry) => columnFixedRegion(entry.column) !== undefined)
      if (!hasPinned) return renderColumns(entries.value)
      return (['left', undefined, 'right', 'mixed'] as const).map((region) => {
        const group = entries.value.filter((entry) => columnFixedRegion(entry.column) === region)
        if (!group.length) return null
        const title =
          region === 'left'
            ? locale.value.fixedLeft
            : region === 'right'
              ? locale.value.fixedRight
              : region === 'mixed'
                ? locale.value.mixed
                : locale.value.unfixed
        return (
          <li key={region ?? 'none'} class={styles.group()}>
            <div class={styles.groupTitle()}>{title}</div>
            <ul class={styles.groupColumns()}>{renderColumns(group)}</ul>
          </li>
        )
      })
    }
    return () => (
      <span class={styles.root()}>
        {props.options?.density !== false && (
          <Tooltip title={locale.value.density} open={open.value ? false : undefined}>
            <button
              ref={densityTrigger}
              type="button"
              class={styles.densityTrigger()}
              disabled={props.disabled}
              aria-label={locale.value.density}
              aria-haspopup="menu"
              aria-expanded={open.value === 'density'}
              aria-controls={open.value === 'density' ? `${id}-density` : undefined}
              onClick={() => void show('density')}
            >
              <ColumnHeightOutlinedIcon />
            </button>
          </Tooltip>
        )}
        {props.options?.setting !== false && (
          <Tooltip title={locale.value.title} open={open.value ? false : undefined}>
            <button
              ref={trigger}
              type="button"
              class={styles.trigger()}
              disabled={props.disabled}
              aria-label={locale.value.title}
              aria-haspopup="dialog"
              aria-expanded={open.value === 'columns'}
              aria-controls={open.value === 'columns' ? `${id}-columns` : undefined}
              onClick={() => void show('columns')}
            >
              <SettingOutlinedIcon />
            </button>
          </Tooltip>
        )}
        {open.value && (
          <Teleport to={container.value}>
            <div
              ref={popup}
              key={open.value}
              id={`${id}-${open.value}`}
              role={open.value === 'density' ? 'menu' : 'dialog'}
              aria-label={open.value === 'density' ? locale.value.density : locale.value.title}
              data-vtg-preset={preset.value}
              class={open.value === 'density' ? styles.densityPopup() : styles.popup()}
              style={position.value}
              onKeydown={keydown}
            >
              {open.value === 'density' ? (
                (['large', 'middle', 'small'] as const).map((density) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    tabindex={size.value === density ? 0 : -1}
                    class={styles.density()}
                    aria-checked={size.value === density}
                    onClick={() => {
                      if (props.disabled) return
                      if (size.value !== density) emit('update:size', density)
                      close(true)
                    }}
                  >
                    {locale.value[density]}
                  </button>
                ))
              ) : (
                <>
                  <div class={styles.header()}>
                    <label class={styles.heading()}>
                      <span class={styles.checkboxControl()}>
                        <input
                          type="checkbox"
                          class={styles.checkbox()}
                          checked={selection.value.all}
                          indeterminate={selection.value.partial}
                          disabled={props.disabled || !entries.value.length}
                          onChange={changeAll}
                        />
                        {selection.value.all && (
                          <span class={styles.checkMark()} aria-hidden="true" />
                        )}
                        {selection.value.partial && (
                          <span class={styles.indeterminateMark()} aria-hidden="true" />
                        )}
                      </span>
                      {locale.value.columns}
                    </label>
                    <button type="button" class={styles.reset()} onClick={reset}>
                      {locale.value.reset}
                    </button>
                  </div>
                  {entries.value.length ? (
                    <ul class={styles.columns()} aria-label={locale.value.columns}>
                      {renderColumnGroups()}
                    </ul>
                  ) : (
                    <div class={styles.empty()}>{locale.value.empty}</div>
                  )}
                </>
              )}
            </div>
          </Teleport>
        )}
      </span>
    )
  },
})
