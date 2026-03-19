import {
  defineComponent,
  computed,
  inject,
  ref,
  watch,
  onBeforeUnmount,
  nextTick,
  Teleport,
  type PropType,
} from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { ColumnType, SortOrder } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import SortButton from './SortButton'
import FilterIcon from './FilterIcon'
import FilterDropdown from './FilterDropdown'
import SelectionCheckbox from './SelectionCheckbox'
import SelectionDropdown from './SelectionDropdown'
import ResizeHandle from './ResizeHandle'
import { DownOutlinedIcon } from '@vtable-guild/icons'
import type { SelectionItem } from '../types'

import { getColumnKey } from '../composables/useSorter'

function getAriaSortValue(order: SortOrder): 'ascending' | 'descending' | undefined {
  if (order === 'ascend') return 'ascending'
  if (order === 'descend') return 'descending'
  return undefined
}

export default defineComponent({
  name: 'TableHeaderCell',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    index: { type: Number, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    // ---- 排序 ----
    const sortOrder = computed(() => {
      if (!props.column.sorter) return null
      return tableContext.getSortOrder?.(props.column) ?? null
    })

    const isSortable = computed(() => !!props.column.sorter)

    const showTooltip = computed(() => {
      if (!isSortable.value) return false
      return props.column.showSorterTooltip ?? tableContext.showSorterTooltip?.value ?? true
    })

    // ---- 筛选 ----
    const hasFilters = computed(
      () =>
        (props.column.filters?.length ?? 0) > 0 ||
        !!props.column.customFilterDropdown ||
        !!props.column.filterDropdown,
    )

    const filteredValue = computed(() => {
      if (!hasFilters.value) return []
      return tableContext.getFilteredValue?.(props.column) ?? []
    })

    // C1: filtered prop override
    const isFiltered = computed(() => {
      if (props.column.filtered !== undefined) return props.column.filtered
      return filteredValue.value.length > 0
    })

    // C2: Controlled dropdown (filterDropdownOpen / onFilterDropdownOpenChange)
    const isDropdownControlled = computed(() => props.column.filterDropdownOpen !== undefined)
    const internalVisible = ref(false)
    const filterDropdownVisible = computed(() =>
      isDropdownControlled.value ? props.column.filterDropdownOpen! : internalVisible.value,
    )

    function setDropdownVisible(visible: boolean) {
      if (!isDropdownControlled.value) internalVisible.value = visible
      props.column.onFilterDropdownOpenChange?.(visible)
    }

    const filterAnchorRef = ref<HTMLElement | null>(null)
    const customDropdownRef = ref<HTMLElement | null>(null)

    function toggleFilterDropdown(_e: MouseEvent) {
      setDropdownVisible(!filterDropdownVisible.value)
    }

    // 自定义下拉菜单的外部点击关闭
    function handleCustomDropdownMouseDown(e: MouseEvent) {
      if (
        customDropdownRef.value &&
        !customDropdownRef.value.contains(e.target as Node) &&
        !filterAnchorRef.value?.contains(e.target as Node)
      ) {
        setDropdownVisible(false)
      }
    }

    // 判断是否使用自定义下拉（column.filterDropdown 或 customFilterDropdown slot）
    const isCustomDropdown = computed(
      () =>
        !!props.column.filterDropdown ||
        (!!props.column.customFilterDropdown && !!tableContext.customFilterDropdown),
    )

    watch(filterDropdownVisible, (visible) => {
      if (visible && isCustomDropdown.value) {
        nextTick(() => {
          document.addEventListener('mousedown', handleCustomDropdownMouseDown)
        })
      } else {
        document.removeEventListener('mousedown', handleCustomDropdownMouseDown)
      }
    })

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleCustomDropdownMouseDown)
    })

    function getAnchorRect() {
      if (!filterAnchorRef.value) return { top: 0, left: 0, right: 0, bottom: 0 }
      return filterAnchorRef.value.getBoundingClientRect()
    }

    // C3: Pending selected keys for slot props
    const pendingSelectedKeys = ref<(string | number | boolean)[]>([])

    // 树形筛选展开/折叠持久化（跨 dropdown open/close）
    const treeExpandedKeys = ref<Set<string | number | boolean> | null>(null)
    watch(
      () => filteredValue.value,
      (keys) => {
        pendingSelectedKeys.value = [...keys]
      },
      { immediate: true },
    )

    function handleFilterConfirm(keys: (string | number | boolean)[]) {
      tableContext.confirmFilter?.(props.column, keys)
      setDropdownVisible(false)
    }

    function handleFilterReset() {
      tableContext.resetFilter?.(props.column)
      setDropdownVisible(false)
    }

    function handleFilterClose() {
      setDropdownVisible(false)
    }

    // ---- 固定列 ----
    const fixedInfo = computed(() => {
      if (!props.column.fixed) return null
      const key = getColumnKey(props.column) ?? props.index
      return tableContext.fixedOffsets?.value?.get(key) ?? null
    })

    const fixedStyle = computed(() => {
      const info = fixedInfo.value
      if (!info) return undefined
      const style: Record<string, string> = { position: 'sticky', zIndex: '2' }
      if (info.left !== undefined) style.left = `${info.left}px`
      if (info.right !== undefined) style.right = `${info.right}px`
      return style
    })

    const fixedClass = computed(() => {
      const info = fixedInfo.value
      if (!info) return ''
      const sub = tableContext.subThemeSlots?.value
      if (!sub) return ''
      const classes: string[] = []
      const atStart = tableContext.scrollState?.value?.atStart ?? true
      const atEnd = tableContext.scrollState?.value?.atEnd ?? true
      if (info.isLastLeft) {
        classes.push(atStart ? sub.fixedShadowHidden : sub.fixedShadowLeft)
      }
      if (info.isFirstRight) {
        classes.push(atEnd ? sub.fixedShadowHidden : sub.fixedShadowRight)
      }
      return classes.join(' ')
    })

    // ---- 公共 ----
    const headerContent = computed(() => {
      if (tableContext.headerCell) {
        return tableContext.headerCell({
          title: props.column.title,
          column: props.column,
          index: props.index,
        })
      }
      return props.column.title ?? ''
    })

    const cellClass = computed(() => {
      const alignClass = props.column.align ? TABLE_ALIGN_CLASSES[props.column.align] : ''
      const sortableClass = isSortable.value ? tableContext.subThemeSlots?.value.thSortable : ''
      return cn(props.thClass, alignClass, sortableClass, props.column.className, fixedClass.value)
    })

    const cellStyle = computed(() => {
      const base: Record<string, string> = {}
      // Use resized width if available, otherwise original width
      const resizedWidth =
        tableContext.columnWidths?.[String(getColumnKey(props.column) ?? props.index)]
      const w = resizedWidth ?? props.column.width
      if (w) {
        base.width = typeof w === 'number' ? `${w}px` : w
      }
      const fixed = fixedStyle.value
      return fixed ? { ...base, ...fixed } : Object.keys(base).length ? base : undefined
    })

    // ---- 选择下拉 ----
    const selectionDropdownVisible = ref(false)
    const selectionAnchorRef = ref<HTMLElement | null>(null)

    function getSelectionAnchorRect() {
      if (!selectionAnchorRef.value) return { top: 0, left: 0, right: 0, bottom: 0 }
      return selectionAnchorRef.value.getBoundingClientRect()
    }

    function toggleSelectionDropdown(e: MouseEvent) {
      e.stopPropagation()
      selectionDropdownVisible.value = !selectionDropdownVisible.value
    }

    function closeSelectionDropdown() {
      selectionDropdownVisible.value = false
    }

    const sortAreaHovered = ref(false)

    function handleClick() {
      if (isSortable.value) {
        tableContext.toggleSortOrder?.(props.column)
      }
    }

    return () => {
      // ---- 选择列表头 ----
      if (props.column.key === '__vtg_selection__') {
        const sel = tableContext.rowSelection?.()
        const isRadio = sel?.type === 'radio'

        const cellSelClass = cn(props.thClass, 'text-center', props.column.className)
        const cellSelStyle = props.column.width
          ? {
              width:
                typeof props.column.width === 'number'
                  ? `${props.column.width}px`
                  : props.column.width,
            }
          : undefined

        if (isRadio) {
          return <th class={cellSelClass} style={cellSelStyle} />
        }

        const hideSelectAll = sel?.hideSelectAll === true
        const hasSelections = sel?.selections !== undefined && sel.selections !== false

        if (hideSelectAll) {
          return <th class={cellSelClass} style={cellSelStyle} />
        }

        const state = tableContext.allCheckedState?.() ?? 'none'

        // Build selection items for dropdown
        let selectionItems: SelectionItem[] = []
        if (hasSelections) {
          const tableLocale = tableContext.locale?.value
          if (sel?.selections === true) {
            selectionItems = [
              {
                key: '__vtg_select_all__',
                text: tableLocale?.selection?.selectAll ?? '全选当页',
                onSelect: () => tableContext.toggleAll?.(true),
              },
              {
                key: '__vtg_select_invert__',
                text: tableLocale?.selection?.selectInvert ?? '反选当页',
                onSelect: () => tableContext.invertSelection?.(),
              },
              {
                key: '__vtg_select_none__',
                text: tableLocale?.selection?.selectNone ?? '清空所有',
                onSelect: () => tableContext.clearSelection?.(),
              },
            ]
          } else if (Array.isArray(sel?.selections)) {
            selectionItems = sel.selections as SelectionItem[]
          }
        }

        return (
          <th class={cellSelClass} style={cellSelStyle}>
            <span class="inline-flex items-center justify-center">
              <SelectionCheckbox
                checked={state === 'all'}
                indeterminate={state === 'partial'}
                onChange={(checked: boolean) => tableContext.toggleAll?.(checked)}
              />
              {hasSelections && (
                <span
                  ref={selectionAnchorRef}
                  class={tableContext.subThemeSlots?.value.selectionExtra}
                  onClick={toggleSelectionDropdown}
                  role="button"
                  aria-label="Selection options"
                >
                  <DownOutlinedIcon />
                </span>
              )}
            </span>
            {hasSelections && (
              <SelectionDropdown
                items={selectionItems}
                anchorRect={getSelectionAnchorRect()}
                visible={selectionDropdownVisible.value}
                onClose={closeSelectionDropdown}
              />
            )}
          </th>
        )
      }

      const tableLocale = tableContext.locale?.value
      const tooltipTitle =
        sortOrder.value === null
          ? (tableLocale?.header.sortTriggerAsc ?? '点击升序')
          : sortOrder.value === 'ascend'
            ? (tableLocale?.header.sortTriggerDesc ?? '点击降序')
            : (tableLocale?.header.cancelSort ?? '取消排序')
      const { column } = props

      // 排序区域（标题 + 排序图标）
      const sortAreaWrapperClass = tableContext.subThemeSlots?.value.sortAreaWrapper
      const sortAreaTitleClass = tableContext.subThemeSlots?.value.sortAreaTitle

      const sorterContent = (
        <span class={sortAreaWrapperClass}>
          <span class={sortAreaTitleClass}>{headerContent.value}</span>
          {isSortable.value && <SortButton sortOrder={sortOrder.value} />}
        </span>
      )

      const sortAreaOuterClass = tableContext.subThemeSlots?.value.sortAreaOuter

      const sortArea = showTooltip.value ? (
        <span
          class={sortAreaOuterClass}
          onMouseenter={() => {
            sortAreaHovered.value = true
          }}
          onMouseleave={() => {
            sortAreaHovered.value = false
          }}
        >
          <Tooltip block title={tooltipTitle} placement="top" open={sortAreaHovered.value}>
            {sorterContent}
          </Tooltip>
        </span>
      ) : (
        <span class={sortAreaOuterClass}>{sorterContent}</span>
      )

      // C4: Filter icon rendering priority
      // column.filterIcon > tableContext.customFilterIcon slot > default FilterIcon
      const filterIconContent = (() => {
        if (column.filterIcon) {
          return (
            <span
              class={tableContext.subThemeSlots?.value.filterIconWrapper}
              ref={filterAnchorRef}
              onMousedown={(e: MouseEvent) => e.stopPropagation()}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                toggleFilterDropdown(e)
              }}
              role="button"
              aria-label={tableLocale?.header.filterTriggerAriaLabel ?? '筛选'}
            >
              {column.filterIcon({ filtered: isFiltered.value })}
            </span>
          )
        }
        if (tableContext.customFilterIcon) {
          return (
            <span
              class={tableContext.subThemeSlots?.value.filterIconWrapper}
              ref={filterAnchorRef}
              onMousedown={(e: MouseEvent) => e.stopPropagation()}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                toggleFilterDropdown(e)
              }}
              role="button"
              aria-label={tableLocale?.header.filterTriggerAriaLabel ?? '筛选'}
            >
              {tableContext.customFilterIcon({ column, filtered: isFiltered.value })}
            </span>
          )
        }
        return (
          <span
            ref={filterAnchorRef}
            class={tableContext.subThemeSlots?.value.filterIconWrapper}
            onMousedown={(e: MouseEvent) => e.stopPropagation()}
          >
            <FilterIcon active={isFiltered.value} onClick={toggleFilterDropdown} />
          </span>
        )
      })()

      // C5: Shared dropdownSlotProps for custom filter dropdown
      const dropdownSlotProps = {
        column,
        selectedKeys: pendingSelectedKeys.value,
        setSelectedKeys: (keys: (string | number | boolean)[]) => {
          pendingSelectedKeys.value = [...keys]
        },
        confirm: (opts?: { closeDropdown?: boolean }) => {
          handleFilterConfirm(pendingSelectedKeys.value)
          if (opts?.closeDropdown === false) {
            // Re-open since handleFilterConfirm closes
            setDropdownVisible(true)
          }
        },
        clearFilters: (opts?: { confirm?: boolean; closeDropdown?: boolean }) => {
          tableContext.resetFilter?.(column)
          pendingSelectedKeys.value = []
          if (opts?.confirm) {
            handleFilterConfirm([])
          }
          if (opts?.closeDropdown !== false) {
            setDropdownVisible(false)
          }
        },
        filters: column.filters ?? [],
        visible: filterDropdownVisible.value,
        close: () => setDropdownVisible(false),
      }

      // C5: Rendering priority: column.filterDropdown > customFilterDropdown slot > default
      const customFilterDropdownSlot = column.customFilterDropdown
        ? tableContext.customFilterDropdown
        : undefined

      const filterDropdownContent = (() => {
        const customContent = column.filterDropdown
          ? column.filterDropdown(dropdownSlotProps)
          : customFilterDropdownSlot
            ? customFilterDropdownSlot(dropdownSlotProps)
            : null

        if (customContent) {
          const anchorRect = getAnchorRect()
          const viewportWidth = window.innerWidth
          const dropdownMinWidth = 150
          const overflowRight = anchorRect.left + dropdownMinWidth > viewportWidth
          const posStyle: Record<string, string> = {
            position: 'fixed',
            top: `${anchorRect.bottom + 4}px`,
            zIndex: '1050',
          }
          if (overflowRight) {
            posStyle.right = `${viewportWidth - anchorRect.right}px`
          } else {
            posStyle.left = `${anchorRect.left}px`
          }
          return (
            <Teleport to="body">
              <div
                ref={customDropdownRef}
                class={tableContext.subThemeSlots?.value.filterDropdown}
                style={posStyle}
              >
                {customContent}
              </div>
            </Teleport>
          )
        }

        return (
          <FilterDropdown
            filters={column.filters ?? []}
            selectedKeys={filteredValue.value}
            multiple={column.filterMultiple !== false}
            anchorRect={getAnchorRect()}
            filterSearch={column.filterSearch ?? false}
            filterMode={column.filterMode ?? 'menu'}
            expandedKeys={treeExpandedKeys.value}
            visible={filterDropdownVisible.value}
            onConfirm={handleFilterConfirm}
            onReset={handleFilterReset}
            onClose={handleFilterClose}
            onUpdate:expandedKeys={(keys: Set<string | number | boolean>) => {
              treeExpandedKeys.value = keys
            }}
          />
        )
      })()

      return (
        <th
          class={cellClass.value}
          style={cellStyle.value}
          onClick={handleClick}
          aria-sort={getAriaSortValue(sortOrder.value)}
        >
          <span class={cn('flex items-center', props.headerCellInnerClass)}>
            {sortArea}
            {hasFilters.value && filterIconContent}
          </span>

          {/* Filter dropdown */}
          {hasFilters.value && filterDropdownContent}

          {/* Resize handle */}
          {props.column.resizable && <ResizeHandle column={props.column} colIndex={props.index} />}
        </th>
      )
    }
  },
})
