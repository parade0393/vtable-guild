import { defineComponent, inject, type PropType } from 'vue'
import { cn } from '@vtable-guild/core'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { ColumnType, Key } from '../types'

export default defineComponent({
  name: 'TableBody',
  props: {
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
    tbodyClass: { type: String, required: true },
    rowClass: { type: String, required: true },
    tdClass: { type: String, required: true },
    emptyClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: Record<string, unknown>) => Key)>,
      default: undefined,
    },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    function getRowKey(record: Record<string, unknown>, index: number): Key {
      if (typeof props.rowKey === 'function') return props.rowKey(record)
      if (typeof props.rowKey === 'string' && props.rowKey in record) {
        return record[props.rowKey] as Key
      }
      return index
    }

    return () => (
      <tbody class={props.tbodyClass}>
        {props.dataSource.length > 0 ? (
          props.dataSource.map((record, rowIndex) => {
            const key = getRowKey(record, rowIndex)
            const exp = tableContext.expandable?.()
            const isExpanded = tableContext.isExpanded?.(key) ?? false
            const expandRowByClick = exp?.expandRowByClick ?? false

            const handleRowClick = expandRowByClick
              ? () => tableContext.toggleExpand?.(record, rowIndex)
              : undefined

            return [
              <TableRow key={key} rowClass={props.rowClass} onClick={handleRowClick}>
                {props.columns.map((column, colIndex) => (
                  <TableCell
                    key={column.key ?? String(column.dataIndex ?? colIndex)}
                    record={record}
                    rowIndex={rowIndex}
                    column={column}
                    colIndex={colIndex}
                    tdClass={props.tdClass}
                    bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                  />
                ))}
              </TableRow>,
              isExpanded && exp?.expandedRowRender && (
                <tr
                  key={`${key}-expanded`}
                  class={cn(props.rowClass, tableContext.subThemeSlots?.value.expandedRow)}
                >
                  <td
                    colspan={props.columns.length}
                    class={cn(props.tdClass, tableContext.subThemeSlots?.value.expandedRowCell)}
                  >
                    {exp.expandedRowRender(record, rowIndex, 0, true)}
                  </td>
                </tr>
              ),
            ]
          })
        ) : (
          <TableEmpty
            colSpan={props.columns.length || 1}
            emptyClass={props.emptyClass}
            tdClass={props.tdClass}
          />
        )}
      </tbody>
    )
  },
})
