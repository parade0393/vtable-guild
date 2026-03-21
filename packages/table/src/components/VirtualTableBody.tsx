import { defineComponent, inject, ref, watch } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import { cn, VirtualList } from '@vtable-guild/core'
import type { ListRef, VirtualScrollInfo } from '@vtable-guild/core'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
import ColGroup from './ColGroup'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { ColumnType, Key } from '../types'

type VirtualTableScrollInfo = VirtualScrollInfo & {
  maxX: number
}

export default defineComponent({
  name: 'VirtualTableBody',
  props: {
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
    tbodyClass: { type: String, required: true },
    rowClass: { type: String, required: true },
    tdClass: { type: String, required: true },
    emptyClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
    tableClass: { type: String, required: true },
    tableStyle: { type: Object as PropType<Record<string, string>>, default: undefined },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: Record<string, unknown>) => Key)>,
      default: undefined,
    },
    height: { type: Number, required: true },
    itemHeight: { type: Number, required: true },
    /** Sync header scroll when virtual body scrolls horizontally */
    onVirtualScroll: {
      type: Function as PropType<(info: VirtualTableScrollInfo) => void>,
      default: undefined,
    },
    showScrollBar: {
      type: [Boolean, String] as PropType<boolean | 'optional' | 'hover'>,
      default: 'hover',
    },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const virtualListRef = ref<ListRef>()

    function emitVirtualScroll(info: VirtualScrollInfo) {
      props.onVirtualScroll?.({
        ...info,
        maxX: virtualListRef.value?.getHorizontalRange() ?? 0,
      })
    }

    function getRowKey(record: Record<string, unknown>, index: number): Key {
      if (typeof props.rowKey === 'function') return props.rowKey(record)
      if (typeof props.rowKey === 'string' && props.rowKey in record) {
        return record[props.rowKey] as Key
      }
      return index
    }

    function itemKey(item: Record<string, unknown>): Key {
      const idx = props.dataSource.indexOf(item)
      return getRowKey(item, idx >= 0 ? idx : 0)
    }

    // Update scroll state (for fixed column shadows) when VirtualList scrolls
    watch(
      () => virtualListRef.value,
      (ref) => {
        if (ref) {
          // Trigger initial scroll state update
          const info = ref.getScrollInfo()
          emitVirtualScroll(info)
        }
      },
    )

    return () => {
      if (props.dataSource.length === 0) {
        return (
          <table class={props.tableClass} style={props.tableStyle}>
            <ColGroup columns={props.columns} />
            <tbody class={props.tbodyClass}>
              <TableEmpty
                colSpan={props.columns.length || 1}
                emptyClass={props.emptyClass}
                tdClass={props.tdClass}
              />
            </tbody>
          </table>
        )
      }

      // Calculate total scroll width from columns
      let scrollWidth = 0
      for (const col of props.columns) {
        const w = typeof col.width === 'number' ? col.width : parseInt(String(col.width || '0'), 10)
        scrollWidth += w || 0
      }

      return (
        <VirtualList
          ref={virtualListRef}
          data={props.dataSource}
          height={props.height}
          itemHeight={props.itemHeight}
          itemKey={itemKey}
          scrollWidth={scrollWidth || undefined}
          fullHeight={false}
          onVirtualScroll={emitVirtualScroll}
          showScrollBar={props.showScrollBar}
          style={{ overflow: 'hidden' } as CSSProperties}
        >
          {{
            default: ({
              item,
              index: _absoluteIndex,
            }: {
              item: Record<string, unknown>
              index: number
              style: CSSProperties
              offsetX: number
            }) => {
              const rowIndex = props.dataSource.indexOf(item)
              const rIndex = rowIndex >= 0 ? rowIndex : _absoluteIndex
              const key = getRowKey(item, rIndex)
              const exp = tableContext.expandable?.()
              const isExpanded = tableContext.isExpanded?.(key) ?? false
              const expandRowByClick = exp?.expandRowByClick ?? false

              const handleRowClick = expandRowByClick
                ? () => tableContext.toggleExpand?.(item, rIndex)
                : undefined

              return (
                <table
                  class={props.tableClass}
                  style={{
                    ...props.tableStyle,
                    tableLayout: 'fixed',
                  }}
                >
                  <ColGroup columns={props.columns} />
                  <tbody class={props.tbodyClass}>
                    <TableRow key={key} rowClass={props.rowClass} onClick={handleRowClick}>
                      {props.columns.map((column, colIndex) => (
                        <TableCell
                          key={column.key ?? String(column.dataIndex ?? colIndex)}
                          record={item}
                          rowIndex={rIndex}
                          column={column}
                          colIndex={colIndex}
                          tdClass={props.tdClass}
                          bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                        />
                      ))}
                    </TableRow>
                    {isExpanded && exp?.expandedRowRender && (
                      <tr
                        key={`${key}-expanded`}
                        class={cn(props.rowClass, tableContext.subThemeSlots?.value.expandedRow)}
                      >
                        <td
                          colspan={props.columns.length}
                          class={cn(
                            props.tdClass,
                            tableContext.subThemeSlots?.value.expandedRowCell,
                          )}
                        >
                          {exp.expandedRowRender(item, rIndex, 0, true)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )
            },
          }}
        </VirtualList>
      )
    }
  },
})
