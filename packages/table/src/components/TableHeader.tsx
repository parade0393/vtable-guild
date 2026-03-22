import { defineComponent, type PropType } from 'vue'
import TableHeaderCell from './TableHeaderCell'
import type { HeaderRowMeta } from '../composables/useColumns'

export default defineComponent({
  name: 'TableHeader',
  props: {
    rows: {
      type: Array as PropType<HeaderRowMeta<Record<string, unknown>>[]>,
      required: true,
    },
    theadClass: { type: String, required: true },
    rowClass: { type: String, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    return () => (
      <thead class={props.theadClass}>
        {props.rows.map((row, rowIndex) => (
          <tr key={`header-row-${rowIndex}`} class={props.rowClass}>
            {row.map((cell, cellIndex) => (
              <TableHeaderCell
                key={`${String(cell.column.key ?? cell.column.title ?? cellIndex)}-${rowIndex}-${cellIndex}`}
                cell={cell}
                index={cellIndex}
                thClass={props.thClass}
                headerCellInnerClass={props.headerCellInnerClass}
              />
            ))}
          </tr>
        ))}
      </thead>
    )
  },
})
