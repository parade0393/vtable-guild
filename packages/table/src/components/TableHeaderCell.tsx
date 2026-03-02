import { defineComponent, computed, inject, ref, type PropType } from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { ColumnType, SortOrder } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'
import SortButton from './SortButton'

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

    const sortOrder = computed(() => {
      if (!props.column.sorter) return null
      return tableContext.getSortOrder?.(props.column) ?? null
    })

    const isSortable = computed(() => !!props.column.sorter)

    const showTooltip = computed(() => {
      if (!isSortable.value) return false
      return props.column.showSorterTooltip ?? tableContext.showSorterTooltip ?? true
    })

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
        ? 'cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]'
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

    const hovered = ref(false)

    function handleClick() {
      if (isSortable.value) {
        tableContext.toggleSortOrder?.(props.column)
      }
    }

    return () => {
      const headerCellInner = isSortable.value ? (
        <span class="flex items-center justify-between">
          <span>{headerContent.value}</span>
          <SortButton sortOrder={sortOrder.value} />
        </span>
      ) : (
        <span class={props.headerCellInnerClass}>{headerContent.value}</span>
      )

      const tooltipTitle = SORT_TOOLTIP_MAP[String(sortOrder.value)]

      return (
        <th
          class={cellClass.value}
          style={cellStyle.value}
          onClick={handleClick}
          onMouseenter={() => {
            hovered.value = true
          }}
          onMouseleave={() => {
            hovered.value = false
          }}
          aria-sort={getAriaSortValue(sortOrder.value)}
        >
          {showTooltip.value ? (
            <Tooltip title={tooltipTitle} placement="top" open={hovered.value}>
              {headerCellInner}
            </Tooltip>
          ) : (
            headerCellInner
          )}
        </th>
      )
    }
  },
})
