import { defineComponent, computed, inject, ref, watch, type PropType } from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { ColumnType, SortOrder } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import SortButton from './SortButton'
import FilterIcon from './FilterIcon'
import FilterDropdown from './FilterDropdown'

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
      return props.column.showSorterTooltip ?? tableContext.showSorterTooltip ?? true
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

    function toggleFilterDropdown(_e: MouseEvent) {
      setDropdownVisible(!filterDropdownVisible.value)
    }

    function getAnchorRect() {
      if (!filterAnchorRef.value) return { top: 0, left: 0, right: 0, bottom: 0 }
      return filterAnchorRef.value.getBoundingClientRect()
    }

    // C3: Pending selected keys for slot props
    const pendingSelectedKeys = ref<(string | number | boolean)[]>([])
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
      const sortableClass = isSortable.value
        ? (tableContext.subThemeSlots?.value.thSortable ??
          'cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]')
        : ''
      return cn(props.thClass, alignClass, sortableClass, props.column.className)
    })

    const cellStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    const sortAreaHovered = ref(false)

    function handleClick() {
      if (isSortable.value) {
        tableContext.toggleSortOrder?.(props.column)
      }
    }

    return () => {
      const tableLocale = tableContext.locale?.value
      const tooltipTitle =
        sortOrder.value === null
          ? (tableLocale?.header.sortTriggerAsc ?? '点击升序')
          : sortOrder.value === 'ascend'
            ? (tableLocale?.header.sortTriggerDesc ?? '点击降序')
            : (tableLocale?.header.cancelSort ?? '取消排序')
      const { column } = props

      // 排序区域（标题 + 排序图标）
      const sortAreaWrapperClass =
        tableContext.subThemeSlots?.value.sortAreaWrapper ??
        'flex flex-auto items-center justify-between min-w-0'
      const sortAreaTitleClass = tableContext.subThemeSlots?.value.sortAreaTitle ?? 'flex-1 min-w-0'

      const sorterContent = (
        <span class={sortAreaWrapperClass}>
          <span class={sortAreaTitleClass}>{headerContent.value}</span>
          {isSortable.value && <SortButton sortOrder={sortOrder.value} />}
        </span>
      )

      const sortAreaOuterClass =
        tableContext.subThemeSlots?.value.sortAreaOuter ?? 'flex flex-auto min-w-0'

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
              class={
                tableContext.subThemeSlots?.value.filterIconWrapper ??
                'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center'
              }
              ref={filterAnchorRef}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                toggleFilterDropdown(e)
              }}
              role="button"
              aria-label={tableLocale?.header.filterTriggerAriaLabel ?? 'Filter'}
            >
              {column.filterIcon({ filtered: isFiltered.value })}
            </span>
          )
        }
        if (tableContext.customFilterIcon) {
          return (
            <span
              class={
                tableContext.subThemeSlots?.value.filterIconWrapper ??
                'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center'
              }
              ref={filterAnchorRef}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                toggleFilterDropdown(e)
              }}
              role="button"
              aria-label={tableLocale?.header.filterTriggerAriaLabel ?? 'Filter'}
            >
              {tableContext.customFilterIcon({ column, filtered: isFiltered.value })}
            </span>
          )
        }
        return (
          <span
            ref={filterAnchorRef}
            class={
              tableContext.subThemeSlots?.value.filterIconWrapper ??
              'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center'
            }
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
        if (column.filterDropdown) {
          return column.filterDropdown(dropdownSlotProps)
        }
        if (customFilterDropdownSlot) {
          return customFilterDropdownSlot(dropdownSlotProps)
        }
        return (
          <FilterDropdown
            filters={column.filters ?? []}
            selectedKeys={filteredValue.value}
            multiple={column.filterMultiple !== false}
            anchorRect={getAnchorRect()}
            filterSearch={column.filterSearch ?? false}
            filterMode={column.filterMode ?? 'menu'}
            onConfirm={handleFilterConfirm}
            onReset={handleFilterReset}
            onClose={handleFilterClose}
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
          {filterDropdownVisible.value && hasFilters.value && filterDropdownContent}
        </th>
      )
    }
  },
})
