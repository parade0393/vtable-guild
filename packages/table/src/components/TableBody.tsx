import { computed, defineComponent, inject, type PropType } from 'vue'
import { cn } from '@vtable-guild/core'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getByDataIndex } from '../composables'
import type { ColumnType, Key } from '../types'
import { resolveBodyCell, type ResolvedBodyCell } from '../utils/cell'

interface BodyRowCell {
  column: ColumnType<Record<string, unknown>>
  colIndex: number
  resolvedCell: ResolvedBodyCell
}

function normalizeSpan(span: number): number {
  if (!Number.isFinite(span)) return 1
  if (span <= 0) return 0
  return Math.floor(span)
}

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

    const bodyRows = computed<BodyRowCell[][]>(() => {
      const coveredCells = new Set<string>()

      return props.dataSource.map((record, rowIndex) => {
        const rowCells: BodyRowCell[] = []

        props.columns.forEach((column, colIndex) => {
          const coverageKey = `${rowIndex}:${colIndex}`
          if (coveredCells.has(coverageKey)) return

          const resolvedCell = resolveBodyCell({
            text: getByDataIndex(record, column.dataIndex),
            record,
            rowIndex,
            column,
            bodyCell: tableContext.bodyCell,
            transformCellText: tableContext.transformCellText,
          })

          const colSpan = normalizeSpan(resolvedCell.colSpan)
          const rowSpan = normalizeSpan(resolvedCell.rowSpan)

          if (colSpan === 0 || rowSpan === 0) return

          const maxRow = Math.min(props.dataSource.length, rowIndex + rowSpan)
          const maxCol = Math.min(props.columns.length, colIndex + colSpan)

          for (let nextRow = rowIndex; nextRow < maxRow; nextRow += 1) {
            for (let nextCol = colIndex; nextCol < maxCol; nextCol += 1) {
              if (nextRow === rowIndex && nextCol === colIndex) continue
              coveredCells.add(`${nextRow}:${nextCol}`)
            }
          }

          rowCells.push({
            column,
            colIndex,
            resolvedCell: {
              ...resolvedCell,
              colSpan,
              rowSpan,
            },
          })
        })

        return rowCells
      })
    })

    return () => (
      <tbody class={props.tbodyClass}>
        {props.dataSource.length > 0 ? (
          props.dataSource.map((record, rowIndex) => {
            const key = getRowKey(record, rowIndex)
            const exp = tableContext.expandable?.()
            const isExpanded = tableContext.isExpanded?.(key) ?? false
            const expandRowByClick = exp?.expandRowByClick ?? false
            const canExpand = tableContext.isRowExpandable?.(record) ?? false
            const treeRow = tableContext.treeFlattenData?.value?.find(
              (row) => row.record === record,
            )
            const rowIndent = treeRow?.level ?? 0
            const rowClassName = tableContext.getRowClassName?.(record, rowIndex)
            const rowProps = tableContext.getRowProps?.(record, rowIndex)
            const expandedRowClassName =
              typeof exp?.expandedRowClassName === 'function'
                ? exp.expandedRowClassName(record, rowIndex, rowIndent)
                : exp?.expandedRowClassName

            const handleRowClick = expandRowByClick
              ? () => {
                  if (!canExpand) return
                  tableContext.toggleExpand?.(record, rowIndex)
                }
              : undefined

            return [
              <TableRow
                key={key}
                rowClass={cn(props.rowClass, rowClassName) ?? ''}
                rowProps={rowProps}
                onClick={handleRowClick}
              >
                {bodyRows.value[rowIndex]?.map((cell) => (
                  <TableCell
                    key={cell.column.key ?? String(cell.column.dataIndex ?? cell.colIndex)}
                    record={record}
                    rowIndex={rowIndex}
                    column={cell.column}
                    colIndex={cell.colIndex}
                    resolvedCell={cell.resolvedCell}
                    tdClass={props.tdClass}
                    bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                  />
                ))}
              </TableRow>,
              isExpanded && exp?.expandedRowRender && (
                <tr
                  key={`${key}-expanded`}
                  class={cn(
                    props.rowClass,
                    rowClassName,
                    tableContext.subThemeSlots?.value.expandedRow,
                    expandedRowClassName,
                  )}
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
