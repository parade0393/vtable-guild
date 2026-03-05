import { defineComponent, computed, inject, ref, type PropType } from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { ColumnType, SortOrder } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'
import SortButton from './SortButton'
import FilterIcon from './FilterIcon'
import FilterDropdown from './FilterDropdown'

const SORT_TOOLTIP_MAP: Record<string, string> = {
  null: '点击升序',
  ascend: '点击降序',
  descend: '取消排序',
}

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
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

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
      () => (props.column.filters?.length ?? 0) > 0 || !!props.column.customFilterDropdown,
    )

    const filteredValue = computed(() => {
      if (!hasFilters.value) return []
      return tableContext.getFilteredValue?.(props.column) ?? []
    })

    const isFiltered = computed(() => filteredValue.value.length > 0)

    const filterDropdownVisible = ref(false)
    const filterAnchorRef = ref<HTMLElement | null>(null)

    function toggleFilterDropdown(_e: MouseEvent) {
      filterDropdownVisible.value = !filterDropdownVisible.value
    }

    function getAnchorRect() {
      if (!filterAnchorRef.value) return { top: 0, left: 0, right: 0, bottom: 0 }
      return filterAnchorRef.value.getBoundingClientRect()
    }

    function handleFilterConfirm(keys: (string | number | boolean)[]) {
      tableContext.confirmFilter?.(props.column, keys)
      filterDropdownVisible.value = false
    }

    function handleFilterReset() {
      tableContext.resetFilter?.(props.column)
      filterDropdownVisible.value = false
    }

    function handleFilterClose() {
      filterDropdownVisible.value = false
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
      const tooltipTitle = SORT_TOOLTIP_MAP[String(sortOrder.value)]

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

      // 排序区域容器（带 hover 事件用于 tooltip）
      const sortArea = showTooltip.value ? (
        <span
          class="flex flex-auto min-w-0"
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
        <span class="flex flex-auto min-w-0">{sorterContent}</span>
      )

      // customFilterDropdown slot
      const customFilterDropdownSlot = props.column.customFilterDropdown
        ? tableContext.customFilterDropdown
        : undefined

      return (
        <th
          class={cellClass.value}
          style={cellStyle.value}
          onClick={handleClick}
          aria-sort={getAriaSortValue(sortOrder.value)}
        >
          <span class={cn('flex items-center', props.headerCellInnerClass)}>
            {sortArea}
            {hasFilters.value && (
              <span
                ref={filterAnchorRef}
                class={
                  tableContext.subThemeSlots?.value.filterIconWrapper ??
                  'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center'
                }
              >
                <FilterIcon active={isFiltered.value} onClick={toggleFilterDropdown} />
              </span>
            )}
          </span>

          {/* Filter dropdown */}
          {filterDropdownVisible.value &&
            hasFilters.value &&
            (customFilterDropdownSlot ? (
              customFilterDropdownSlot({
                column: props.column,
                selectedKeys: filteredValue.value,
                setSelectedKeys: (keys: (string | number | boolean)[]) => {
                  handleFilterConfirm(keys)
                },
                confirm: () => {
                  handleFilterConfirm(filteredValue.value)
                  filterDropdownVisible.value = false
                },
                clearFilters: () => {
                  handleFilterReset()
                },
              })
            ) : (
              <FilterDropdown
                filters={props.column.filters ?? []}
                selectedKeys={filteredValue.value}
                multiple={props.column.filterMultiple !== false}
                anchorRect={getAnchorRect()}
                onConfirm={handleFilterConfirm}
                onReset={handleFilterReset}
                onClose={handleFilterClose}
              />
            ))}
        </th>
      )
    }
  },
})
