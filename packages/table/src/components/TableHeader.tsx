import { defineComponent, inject, type PropType } from 'vue'
import TableHeaderCell from './TableHeaderCell'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
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
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <thead class={props.theadClass}>
        {props.rows.map((row, rowIndex) => {
          const rowColumns = row.map((cell) => cell.column)
          const rowProps = tableContext.getHeaderRowProps?.(rowColumns, rowIndex)

          return (
            <tr
              key={`header-row-${rowIndex}`}
              {...rowProps}
              class={[props.rowClass, rowProps?.class, rowProps?.className]}
              style={rowProps?.style as Record<string, string> | undefined}
            >
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
          )
        })}
      </thead>
    )
  },
})
