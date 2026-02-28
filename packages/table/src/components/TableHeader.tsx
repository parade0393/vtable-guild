import { defineComponent, type PropType } from 'vue'
import TableHeaderCell from './TableHeaderCell'
import type { ColumnType } from '../types'

export default defineComponent({
  name: 'TableHeader',
  props: {
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
    theadClass: { type: String, required: true },
    rowClass: { type: String, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    return () => (
      <thead class={props.theadClass}>
        <tr class={props.rowClass}>
          {props.columns.map((column, index) => (
            <TableHeaderCell
              key={column.key ?? String(column.dataIndex ?? index)}
              column={column}
              index={index}
              thClass={props.thClass}
              headerCellInnerClass={props.headerCellInnerClass}
            />
          ))}
        </tr>
      </thead>
    )
  },
})
