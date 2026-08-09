import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  Teleport,
  watch,
  type PropType,
} from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import { DownOutlinedIcon } from '@vtable-guild/icons'
import type { ColumnType, SelectionItem, SortOrder } from '../types'
import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from '../constants'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { HeaderCellMeta } from '../composables/useColumns'
import { getColumnKey } from '../composables/useSorter'
import { useFixedColumnStyle } from '../composables/useFixedColumnStyle'
import { getCellSpan, getEllipsisConfig, omitCellProps } from '../utils/cell'
import { getPopupPositionStyle, resolvePopupContainer } from '../utils/popupPosition'
import { ensureValidVNode } from '../utils/vnode'
import SortButton from './SortButton'
import FilterIcon from './FilterIcon'
import FilterDropdown from './FilterDropdown'
import SelectionCheckbox from './SelectionCheckbox'
import SelectionDropdown from './SelectionDropdown'
import ResizeHandle from './ResizeHandle'

function getAriaSortValue(order: SortOrder): 'ascending' | 'descending' | undefined {
  if (order === 'ascend') return 'ascending'
  if (order === 'descend') return 'descending'
  return undefined
}

export default defineComponent({
  name: 'TableHeaderCell',
  props: {
    cell: {
      type: Object as PropType<HeaderCellMeta<Record<string, unknown>>>,
      required: true,
    },
    index: { type: Number, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    const leafColumn = computed(() =>
      props.cell.isLeaf ? (props.cell.column as ColumnType<Record<string, unknown>>) : null,
    )

    /**
     * 叶子列下标，写成 DOM 属性供 `useColumnMetrics` 实测列宽时定位。
     *
     * 横向虚拟化把表头当作「浏览器已经算好的列宽参照」来读，因此必须能从
     * 一个 `<th>` 精确回到它对应的叶子列。不能靠遍历顺序：分组表头里顶层叶子列
     * 带 rowSpan 落在第 0 行而不是末行，`customHeaderCell` 返回 colSpan 0 时
     * 整个 `<th>` 还会被跳过。列组不带这个属性。
     */
    const leafColAttr = computed(() =>
      props.cell.leafIndex >= 0 ? String(props.cell.leafIndex) : undefined,
    )

    const headerCellProps = computed(() =>
      props.cell.column.customHeaderCell?.(
        props.cell.column,
        props.index,
        leafColumn.value ?? undefined,
      ),
    )

    const mergedColSpan = computed(
      () => getCellSpan(headerCellProps.value, 'colSpan') ?? props.cell.colSpan,
    )
    const mergedRowSpan = computed(() => props.cell.rowSpan)

    const headerDomProps = computed(() => {
      const { onClick: _onClick, ...rest } = omitCellProps(headerCellProps.value)
      return rest
    })

    const sortOrder = computed(() => {
      if (!leafColumn.value?.sorter) return null
      return tableContext.getSortOrder?.(leafColumn.value) ?? null
    })

    const isSortable = computed(() => !!leafColumn.value?.sorter)

    const showTooltip = computed(() => {
      if (!leafColumn.value || !isSortable.value) return false
      return leafColumn.value.showSorterTooltip ?? tableContext.showSorterTooltip?.value ?? true
    })

    const hasFilters = computed(() => {
      const column = leafColumn.value
      if (!column) return false
      return (
        (column.filters?.length ?? 0) > 0 ||
        !!column.customFilterDropdown ||
        !!column.filterDropdown
      )
    })

    const filteredValue = computed(() => {
      if (!leafColumn.value || !hasFilters.value) return []
      return tableContext.getFilteredValue?.(leafColumn.value) ?? []
    })

    const isFiltered = computed(() => {
      const column = leafColumn.value
      if (!column) return false
      if (column.filtered !== undefined) return column.filtered
      return filteredValue.value.length > 0
    })

    const isDropdownControlled = computed(() => leafColumn.value?.filterDropdownOpen !== undefined)
    const internalVisible = ref(false)
    const filterDropdownVisible = computed(() =>
      isDropdownControlled.value
        ? (leafColumn.value?.filterDropdownOpen ?? false)
        : internalVisible.value,
    )

    function setDropdownVisible(visible: boolean) {
      if (!isDropdownControlled.value) internalVisible.value = visible
      leafColumn.value?.onFilterDropdownOpenChange?.(visible)
    }

    const filterAnchorRef = ref<HTMLElement | null>(null)
    const customDropdownRef = ref<HTMLElement | null>(null)

    function toggleFilterDropdown() {
      setDropdownVisible(!filterDropdownVisible.value)
    }

    function handleCustomDropdownMouseDown(e: MouseEvent) {
      if (
        customDropdownRef.value &&
        !customDropdownRef.value.contains(e.target as Node) &&
        !filterAnchorRef.value?.contains(e.target as Node)
      ) {
        setDropdownVisible(false)
      }
    }

    const isCustomDropdown = computed(() => {
      const column = leafColumn.value
      if (!column) return false
      return (
        !!column.filterDropdown ||
        (!!column.customFilterDropdown && !!tableContext.customFilterDropdown)
      )
    })

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

    const pendingSelectedKeys = ref<(string | number | boolean)[]>([])
    const treeExpandedKeys = ref<Set<string | number | boolean> | null>(null)

    watch(
      () => filteredValue.value,
      (keys) => {
        pendingSelectedKeys.value = [...keys]
      },
      { immediate: true },
    )

    function handleFilterConfirm(keys: (string | number | boolean)[]) {
      if (!leafColumn.value) return
      tableContext.confirmFilter?.(leafColumn.value, keys)
      setDropdownVisible(false)
    }

    function handleFilterReset() {
      if (!leafColumn.value) return
      tableContext.resetFilter?.(leafColumn.value)
      setDropdownVisible(false)
    }

    function handleFilterClose() {
      setDropdownVisible(false)
    }

    const fixedInfo = computed(() => {
      const leafColumns = props.cell.leafColumns
      if (!leafColumns.length) return null

      const firstLeaf = leafColumns[0]
      const lastLeaf = leafColumns[leafColumns.length - 1]
      const firstKey = getColumnKey(firstLeaf) ?? props.cell.colStart
      const lastKey = getColumnKey(lastLeaf) ?? props.cell.colEnd
      const firstInfo = tableContext.fixedOffsets?.value?.get(firstKey)
      const lastInfo = tableContext.fixedOffsets?.value?.get(lastKey)

      if (leafColumns.every((column) => column.fixed === 'left') && firstInfo?.left !== undefined) {
        return {
          left: firstInfo.left,
          isLastLeft: lastInfo?.isLastLeft,
        }
      }

      if (
        leafColumns.every((column) => column.fixed === 'right') &&
        lastInfo?.right !== undefined
      ) {
        return {
          right: lastInfo.right,
          isFirstRight: firstInfo?.isFirstRight,
        }
      }

      return null
    })

    const { fixedStyle, fixedClass } = useFixedColumnStyle({ fixedInfo: () => fixedInfo.value })

    const groupedHeaderClass = computed(() => {
      const isAntdv = tableContext.themePreset?.value === 'antdv'
      const isBordered = tableContext.bordered?.value ?? false

      if (!isAntdv || isBordered || props.cell.isLeaf) {
        return ''
      }

      return tableContext.vtgClass?.('before:hidden border-b-0') ?? ''
    })

    // 修复分组表头中「非真正最后一列」被 last: 选择器错误匹配的问题。
    // 场景：某行的最后一个 <th> 可能因 rowSpan 缺位，而不是整张表的最后叶子列。
    // bordered 模式：覆盖 last:border-r-0；非 bordered 模式：覆盖 last:before:bg-transparent。
    const lastColumnDividerFix = computed(() => {
      const total = tableContext.leafColumnCount?.value ?? 0
      if (total > 0 && props.cell.colEnd < total - 1) {
        const isBordered = tableContext.bordered?.value ?? false
        if (isBordered) {
          return (
            tableContext.vtgClass?.(
              'last:border-r last:border-[color:var(--vtg-table-border-color)]',
            ) ?? ''
          )
        }
        return (
          tableContext.vtgClass?.('last:before:bg-[color:var(--vtg-table-header-split-color)]') ??
          ''
        )
      }
      return ''
    })

    const resolvedHeaderTitle = computed(() => {
      return tableContext.getColumnTitle?.(props.cell.column) ?? props.cell.column.title ?? ''
    })

    const shouldApplyHeaderEllipsis = computed(() => {
      if (!props.cell.isLeaf) return false
      const lc = leafColumn.value
      if (!lc) return false
      const cfg = getEllipsisConfig(lc)
      if (!cfg.enabled) return false
      return tableContext.headerEllipsis?.value === true
    })

    const headerContent = computed(() => {
      if (tableContext.headerCell) {
        const slotContent = tableContext.headerCell({
          title: resolvedHeaderTitle.value,
          column: props.cell.column,
          index: props.index,
        })
        if (ensureValidVNode(slotContent) !== null) {
          return slotContent
        }
      }

      return resolvedHeaderTitle.value
    })

    const cellClass = computed(() => {
      const alignClass = props.cell.column.align ? TABLE_ALIGN_CLASSES[props.cell.column.align] : ''
      const sortableClass = isSortable.value ? tableContext.subThemeSlots?.thSortable() : ''
      const sortedClass = sortOrder.value ? tableContext.subThemeSlots?.thSorted() : ''
      const isExpandHeader = leafColumn.value?.key === '__vtg_expand__'
      return cn(
        props.thClass,
        alignClass,
        sortableClass,
        sortedClass,
        groupedHeaderClass.value,
        props.cell.column.className,
        isExpandHeader ? tableContext.vtgClass?.('before:hidden') : '',
        headerCellProps.value?.class,
        headerCellProps.value?.className,
        fixedClass.value,
        lastColumnDividerFix.value,
      )
    })

    const cellStyle = computed(() => {
      const base: Record<string, string> = {}

      if (leafColumn.value) {
        const resizedWidth =
          tableContext.columnWidths?.[String(getColumnKey(leafColumn.value) ?? props.cell.colStart)]
        const width = resizedWidth ?? leafColumn.value.width
        if (width) {
          base.width = typeof width === 'number' ? `${width}px` : width
        }
      }

      const style = headerCellProps.value?.style as Record<string, string> | undefined
      const fixed = fixedStyle.value

      return {
        ...base,
        ...(fixed ?? {}),
        ...(style ?? {}),
      }
    })

    const selectionDropdownVisible = ref(false)
    const selectionAnchorRef = ref<HTMLElement | null>(null)

    function getSelectionAnchorRect() {
      if (!selectionAnchorRef.value) return { top: 0, left: 0, right: 0, bottom: 0 }
      return selectionAnchorRef.value.getBoundingClientRect()
    }

    let selectionHoverTimer: ReturnType<typeof setTimeout> | null = null

    function openSelectionDropdown() {
      if (selectionHoverTimer) clearTimeout(selectionHoverTimer)
      selectionDropdownVisible.value = true
    }

    function scheduleCloseSelectionDropdown() {
      if (selectionHoverTimer) clearTimeout(selectionHoverTimer)
      selectionHoverTimer = setTimeout(() => {
        selectionDropdownVisible.value = false
      }, 100)
    }

    function cancelCloseSelectionDropdown() {
      if (selectionHoverTimer) clearTimeout(selectionHoverTimer)
    }

    function closeSelectionDropdown() {
      if (selectionHoverTimer) clearTimeout(selectionHoverTimer)
      selectionDropdownVisible.value = false
    }

    const sortAreaHovered = ref(false)
    const filterIconHovered = ref(false)
    const sorterTooltipOpen = computed(
      () => showTooltip.value && sortAreaHovered.value && !filterIconHovered.value,
    )

    function handleHeaderMouseEnter(event: MouseEvent) {
      const onMouseenter = headerDomProps.value.onMouseenter
      if (typeof onMouseenter === 'function') {
        onMouseenter(event)
      }

      if (showTooltip.value) {
        sortAreaHovered.value = true
      }
    }

    function handleHeaderMouseLeave(event: MouseEvent) {
      const onMouseleave = headerDomProps.value.onMouseleave
      if (typeof onMouseleave === 'function') {
        onMouseleave(event)
      }

      if (showTooltip.value) {
        sortAreaHovered.value = false
      }
    }

    function handleFilterIconMouseEnter() {
      filterIconHovered.value = true
    }

    function handleFilterIconMouseLeave() {
      filterIconHovered.value = false
    }

    function handleCellClick(event: MouseEvent) {
      const onClick = headerCellProps.value?.onClick
      if (typeof onClick === 'function') {
        onClick(event)
      }

      if (leafColumn.value && isSortable.value) {
        tableContext.toggleSortOrder?.(leafColumn.value)
      }
    }

    return () => {
      if (mergedColSpan.value === 0 || mergedRowSpan.value === 0) {
        return null
      }

      const colSpan = mergedColSpan.value !== 1 ? mergedColSpan.value : undefined
      const rowSpan = mergedRowSpan.value !== 1 ? mergedRowSpan.value : undefined

      if (leafColumn.value?.key === '__vtg_selection__') {
        const sel = tableContext.rowSelection?.()
        const isRadio = sel?.type === 'radio'
        const hideSelectAll = sel?.hideSelectAll === true
        const hasSelections = sel?.selections !== undefined && sel.selections !== false
        const tableLocale = tableContext.locale?.value
        const columnTitle = sel?.columnTitle

        const hasColumnTitle = columnTitle !== undefined

        const cellSelClass = cn(
          props.thClass,
          tableContext.vtgClass?.(
            hasColumnTitle ? 'text-center before:hidden' : 'text-center before:hidden leading-[0]',
          ),
          leafColumn.value.className,
          headerCellProps.value?.class,
          headerCellProps.value?.className,
          fixedClass.value,
        )
        const cellSelStyle = cellStyle.value

        let selectionItems: SelectionItem[] = []
        if (hasSelections) {
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
            selectionItems = sel.selections.map((item) => {
              if (item === SELECTION_ALL) {
                return {
                  key: '__vtg_select_all__',
                  text: tableLocale?.selection?.selectAll ?? '全选当页',
                  onSelect: () => tableContext.toggleAll?.(true),
                }
              }
              if (item === SELECTION_INVERT) {
                return {
                  key: '__vtg_select_invert__',
                  text: tableLocale?.selection?.selectInvert ?? '反选当页',
                  onSelect: () => tableContext.invertSelection?.(),
                }
              }
              if (item === SELECTION_NONE) {
                return {
                  key: '__vtg_select_none__',
                  text: tableLocale?.selection?.selectNone ?? '清空所有',
                  onSelect: () => tableContext.clearSelection?.(),
                }
              }
              return item as SelectionItem
            })
          }
        }

        if (isRadio) {
          return (
            <th
              {...headerDomProps.value}
              class={cellSelClass}
              style={cellSelStyle}
              colspan={colSpan}
              rowspan={rowSpan}
              data-vtg-leaf-col={leafColAttr.value}
              onClick={handleCellClick}
            >
              {columnTitle}
            </th>
          )
        }

        const state = tableContext.allCheckedState?.() ?? 'none'
        const titleNode = columnTitle ? (
          <span class={tableContext.vtgClass?.('ml-2')}>{columnTitle}</span>
        ) : null

        return (
          <th
            {...headerDomProps.value}
            class={cellSelClass}
            style={cellSelStyle}
            colspan={colSpan}
            rowspan={rowSpan}
            data-vtg-leaf-col={leafColAttr.value}
            onClick={handleCellClick}
          >
            {!hideSelectAll ? (
              <span
                class={tableContext.vtgClass?.('inline-flex items-center justify-center relative')}
              >
                <SelectionCheckbox
                  checked={state === 'all'}
                  indeterminate={state === 'partial'}
                  onChange={(checked: boolean) => tableContext.toggleAll?.(checked)}
                />
                {titleNode}
                {hasSelections && (
                  <span
                    ref={selectionAnchorRef}
                    class={cn(
                      tableContext.subThemeSlots?.selectionExtra(),
                      tableContext.vtgClass?.('absolute left-full top-1/2 -translate-y-1/2'),
                    )}
                    onMouseenter={openSelectionDropdown}
                    onMouseleave={scheduleCloseSelectionDropdown}
                    role="button"
                    aria-label="Selection options"
                  >
                    <DownOutlinedIcon />
                  </span>
                )}
              </span>
            ) : (
              columnTitle
            )}

            {!hideSelectAll && hasSelections && (
              <SelectionDropdown
                items={selectionItems}
                anchorRect={getSelectionAnchorRect()}
                popupContainer={resolvePopupContainer(tableContext, selectionAnchorRef.value)}
                visible={selectionDropdownVisible.value}
                onClose={closeSelectionDropdown}
                onMouseenter={cancelCloseSelectionDropdown}
                onMouseleave={scheduleCloseSelectionDropdown}
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

      const column = leafColumn.value
      const sortAreaWrapperClass = tableContext.subThemeSlots?.sortAreaWrapper()
      const sortAreaTitleClass = tableContext.subThemeSlots?.sortAreaTitle()

      const sorterContent = (
        <span class={sortAreaWrapperClass}>
          <span
            class={cn(
              sortAreaTitleClass,
              shouldApplyHeaderEllipsis.value &&
                tableContext.vtgClass?.(
                  'block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap',
                ),
            )}
          >
            {headerContent.value}
          </span>
          {isSortable.value && <SortButton sortOrder={sortOrder.value} />}
        </span>
      )

      const sortAreaOuterClass = tableContext.subThemeSlots?.sortAreaOuter()
      const sortArea = showTooltip.value ? (
        <span class={sortAreaOuterClass}>
          <Tooltip block title={tooltipTitle} placement="top" open={sorterTooltipOpen.value}>
            {sorterContent}
          </Tooltip>
        </span>
      ) : (
        <span class={sortAreaOuterClass}>{sorterContent}</span>
      )

      const filterIconContent =
        column &&
        (() => {
          if (column.filterIcon) {
            return (
              <span
                class={cn(
                  tableContext.subThemeSlots?.filterIconWrapper(),
                  tableContext.subThemeSlots?.filterIcon(),
                )}
                ref={filterAnchorRef}
                onMouseenter={handleFilterIconMouseEnter}
                onMouseleave={handleFilterIconMouseLeave}
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  toggleFilterDropdown()
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
                class={cn(
                  tableContext.subThemeSlots?.filterIconWrapper(),
                  tableContext.subThemeSlots?.filterIcon(),
                )}
                ref={filterAnchorRef}
                onMouseenter={handleFilterIconMouseEnter}
                onMouseleave={handleFilterIconMouseLeave}
                onMousedown={(e: MouseEvent) => e.stopPropagation()}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  toggleFilterDropdown()
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
              class={tableContext.subThemeSlots?.filterIconWrapper()}
              onMouseenter={handleFilterIconMouseEnter}
              onMouseleave={handleFilterIconMouseLeave}
              onMousedown={(e: MouseEvent) => e.stopPropagation()}
            >
              <FilterIcon active={isFiltered.value} onClick={() => toggleFilterDropdown()} />
            </span>
          )
        })()

      const dropdownSlotProps = column && {
        column,
        selectedKeys: pendingSelectedKeys.value,
        setSelectedKeys: (keys: (string | number | boolean)[]) => {
          pendingSelectedKeys.value = [...keys]
        },
        confirm: (opts?: { closeDropdown?: boolean }) => {
          handleFilterConfirm(pendingSelectedKeys.value)
          if (opts?.closeDropdown === false) {
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

      const customFilterDropdownSlot = column?.customFilterDropdown
        ? tableContext.customFilterDropdown
        : undefined

      const filterDropdownContent =
        column &&
        dropdownSlotProps &&
        (() => {
          const customContent =
            typeof column.filterDropdown === 'function'
              ? column.filterDropdown(dropdownSlotProps)
              : (column.filterDropdown ??
                (customFilterDropdownSlot ? customFilterDropdownSlot(dropdownSlotProps) : null))

          if (customContent) {
            const popupContainer = resolvePopupContainer(tableContext, filterAnchorRef.value)

            return (
              <Teleport to={popupContainer}>
                {filterDropdownVisible.value && (
                  <div
                    ref={customDropdownRef}
                    class={tableContext.subThemeSlots?.filterDropdown()}
                    style={getPopupPositionStyle(getAnchorRect(), popupContainer, 150)}
                  >
                    {customContent}
                  </div>
                )}
              </Teleport>
            )
          }

          return (
            <FilterDropdown
              filters={column.filters ?? []}
              selectedKeys={filteredValue.value}
              multiple={column.filterMultiple !== false}
              anchorRect={getAnchorRect()}
              popupContainer={resolvePopupContainer(tableContext, filterAnchorRef.value)}
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
          {...headerDomProps.value}
          class={cellClass.value}
          style={cellStyle.value}
          colspan={colSpan}
          rowspan={rowSpan}
          data-vtg-leaf-col={leafColAttr.value}
          onClick={handleCellClick}
          onMouseenter={handleHeaderMouseEnter}
          onMouseleave={handleHeaderMouseLeave}
          aria-sort={leafColumn.value ? getAriaSortValue(sortOrder.value) : undefined}
        >
          <span
            class={cn(tableContext.vtgClass?.('flex items-center'), props.headerCellInnerClass)}
          >
            {sortArea}
            {hasFilters.value && filterIconContent}
          </span>

          {hasFilters.value && filterDropdownContent}

          {leafColumn.value?.resizable && (
            <ResizeHandle column={leafColumn.value} colIndex={props.cell.colStart} />
          )}
        </th>
      )
    }
  },
})
