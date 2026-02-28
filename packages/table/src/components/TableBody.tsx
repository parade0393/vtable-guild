import { defineComponent, type PropType } from 'vue'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
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
          props.dataSource.map((record, rowIndex) => (
            <TableRow key={getRowKey(record, rowIndex)} rowClass={props.rowClass}>
              {props.columns.map((column, colIndex) => (
                <TableCell
                  key={column.key ?? String(column.dataIndex ?? colIndex)}
                  record={record}
                  rowIndex={rowIndex}
                  column={column}
                  tdClass={props.tdClass}
                  bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                />
              ))}
            </TableRow>
          ))
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
