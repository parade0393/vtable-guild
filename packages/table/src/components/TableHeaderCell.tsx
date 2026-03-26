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
import { getCellSpan, omitCellProps } from '../utils/cell'
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

function resolvePopupContainer(
  tableContext: TableContext,
  triggerNode: HTMLElement | null,
): HTMLElement | string {
  if (!triggerNode || typeof document === 'undefined') {
    return 'body'
  }

  return tableContext.getPopupContainer?.(triggerNode) ?? document.body
}

function getPopupPositionStyle(
  anchorRect: { top: number; left: number; right: number; bottom: number },
  container: HTMLElement | string,
  minimumWidth: number,
): Record<string, string> {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth

  if (
    typeof container === 'string' ||
    (typeof document !== 'undefined' && container === document.body)
  ) {
    const overflowRight = anchorRect.left + minimumWidth > viewportWidth
    const style: Record<string, string> = {
      position: 'fixed',
      top: `${anchorRect.bottom + 4}px`,
      zIndex: '1050',
    }

    if (overflowRight) {
      style.right = `${viewportWidth - anchorRect.right}px`
    } else {
      style.left = `${anchorRect.left}px`
    }

    return style
  }

  const containerRect = container.getBoundingClientRect()
  const overflowRight = anchorRect.left - containerRect.left + minimumWidth > container.clientWidth
  const style: Record<string, string> = {
    position: 'absolute',
    top: `${anchorRect.bottom - containerRect.top + container.scrollTop + 4}px`,
    zIndex: '1050',
  }

  if (overflowRight) {
    style.right = `${containerRect.right - anchorRect.right + container.scrollLeft}px`
  } else {
    style.left = `${anchorRect.left - containerRect.left + container.scrollLeft}px`
  }

  return style
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
      const showFixedDivider = !(tableContext.bordered?.value ?? false)

      if (info.isLastLeft && !atStart) {
        classes.push(sub.fixedShadowLeft)
      }

      if (info.isFirstRight) {
        if (showFixedDivider && atEnd) classes.push(sub.fixedDividerRight)
        if (!atEnd) classes.push(sub.fixedShadowRight)
      }

      return classes.join(' ')
    })

    const groupedHeaderClass = computed(() => {
      const isAntdv = tableContext.themePreset?.value === 'antdv'
      const isBordered = tableContext.bordered?.value ?? false

      if (!isAntdv || isBordered || props.cell.isLeaf) {
        return ''
      }

      return 'before:hidden border-b-0'
    })

    const resolvedHeaderTitle = computed(() => {
      return tableContext.getColumnTitle?.(props.cell.column) ?? props.cell.column.title ?? ''
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
      const sortableClass = isSortable.value ? tableContext.subThemeSlots?.value.thSortable : ''
      return cn(
        props.thClass,
        alignClass,
        sortableClass,
        groupedHeaderClass.value,
        props.cell.column.className,
        headerCellProps.value?.class,
        headerCellProps.value?.className,
        fixedClass.value,
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

        const cellSelClass = cn(
          props.thClass,
          'text-center before:hidden',
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
              onClick={handleCellClick}
            >
              {columnTitle}
            </th>
          )
        }

        const state = tableContext.allCheckedState?.() ?? 'none'
        const titleNode = columnTitle ? <span class="ml-2">{columnTitle}</span> : null

        return (
          <th
            {...headerDomProps.value}
            class={cellSelClass}
            style={cellSelStyle}
            colspan={colSpan}
            rowspan={rowSpan}
            onClick={handleCellClick}
          >
            {!hideSelectAll ? (
              <span class="inline-flex items-center justify-center">
                <SelectionCheckbox
                  checked={state === 'all'}
                  indeterminate={state === 'partial'}
                  onChange={(checked: boolean) => tableContext.toggleAll?.(checked)}
                />
                {titleNode}
                {hasSelections && (
                  <span
                    ref={selectionAnchorRef}
                    class={tableContext.subThemeSlots?.value.selectionExtra}
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

      const filterIconContent =
        column &&
        (() => {
          if (column.filterIcon) {
            return (
              <span
                class={tableContext.subThemeSlots?.value.filterIconWrapper}
                ref={filterAnchorRef}
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
                class={tableContext.subThemeSlots?.value.filterIconWrapper}
                ref={filterAnchorRef}
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
              class={tableContext.subThemeSlots?.value.filterIconWrapper}
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
                <div
                  ref={customDropdownRef}
                  class={tableContext.subThemeSlots?.value.filterDropdown}
                  style={getPopupPositionStyle(getAnchorRect(), popupContainer, 150)}
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
          onClick={handleCellClick}
          aria-sort={leafColumn.value ? getAriaSortValue(sortOrder.value) : undefined}
        >
          <span class={cn('flex items-center', props.headerCellInnerClass)}>
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
