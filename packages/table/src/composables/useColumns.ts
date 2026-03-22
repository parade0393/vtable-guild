import { computed } from 'vue'
import type { ColumnGroupType, ColumnType, ColumnsType, DataIndex } from '../types'

export type ColumnNode<TRecord extends Record<string, unknown>> =
  | ColumnType<TRecord>
  | ColumnGroupType<TRecord>

export interface HeaderCellMeta<TRecord extends Record<string, unknown>> {
  column: ColumnNode<TRecord>
  colSpan: number
  rowSpan: number
  colStart: number
  colEnd: number
  depth: number
  isLeaf: boolean
  leafColumns: ColumnType<TRecord>[]
}

export type HeaderRowMeta<TRecord extends Record<string, unknown>> = HeaderCellMeta<TRecord>[]

export function isColumnGroup<TRecord extends Record<string, unknown>>(
  column: ColumnNode<TRecord>,
): column is ColumnGroupType<TRecord> {
  return (
    !!column &&
    typeof column === 'object' &&
    'children' in column &&
    Array.isArray((column as { children?: unknown }).children)
  )
}

/**
 * 递归拍平列组，返回所有叶子列。
 */
function flattenColumns<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
): ColumnType<TRecord>[] {
  const result: ColumnType<TRecord>[] = []

  for (const column of columns) {
    if (isColumnGroup(column)) {
      result.push(...flattenColumns(column.children))
      continue
    }

    result.push(column)
  }

  return result
}

function buildHeaderRows<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
): HeaderRowMeta<TRecord>[] {
  const rows: HeaderRowMeta<TRecord>[] = []

  function fillRowCells(
    rowColumns: ColumnsType<TRecord>,
    colStart: number,
    depth: number = 0,
  ): { colSpan: number; leafColumns: ColumnType<TRecord>[] }[] {
    rows[depth] = rows[depth] || []

    let currentColStart = colStart

    return rowColumns.filter(Boolean).map((column) => {
      const isLeaf = !isColumnGroup(column) || column.children.length === 0
      let leafColumns: ColumnType<TRecord>[] = isLeaf ? [column as ColumnType<TRecord>] : []
      let colSpan = 1

      if (!isLeaf) {
        const childStats = fillRowCells(column.children, currentColStart, depth + 1)
        leafColumns = childStats.flatMap((item) => item.leafColumns)
        colSpan = childStats.reduce((total, item) => total + item.colSpan, 0)
      }

      if ('colSpan' in column && typeof column.colSpan === 'number') {
        colSpan = column.colSpan
      }

      rows[depth].push({
        column,
        colSpan,
        rowSpan: 1,
        colStart: currentColStart,
        colEnd: currentColStart + Math.max(colSpan, 1) - 1,
        depth,
        isLeaf,
        leafColumns,
      })

      currentColStart += colSpan

      return {
        colSpan,
        leafColumns,
      }
    })
  }

  fillRowCells(columns, 0)

  const rowCount = rows.length
  rows.forEach((row, rowIndex) => {
    row.forEach((cell) => {
      if (cell.isLeaf) {
        cell.rowSpan = rowCount - rowIndex
      }
    })
  })

  return rows
}

/**
 * 根据 dataIndex 路径从 record 中取值。
 *
 * @example
 * ```ts
 * getByDataIndex({ address: { city: 'NYC' } }, ['address', 'city'])
 * // => 'NYC'
 *
 * getByDataIndex({ name: 'Alice' }, 'name')
 * // => 'Alice'
 * ```
 */
export function getByDataIndex(record: Record<string, unknown>, dataIndex?: DataIndex): unknown {
  if (dataIndex === undefined || dataIndex === null || dataIndex === '') return undefined

  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex]

  let current: unknown = record
  for (const segment of path) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[String(segment)]
  }

  return current
}

/**
 * 列解析 composable。
 *
 * @param columns - 响应式列配置 getter
 * @returns { leafColumns, headerRows }
 */
export function useColumns<TRecord extends Record<string, unknown>>(
  columns: () => ColumnsType<TRecord>,
) {
  const leafColumns = computed(() => flattenColumns(columns()))
  const headerRows = computed(() => buildHeaderRows(columns()))

  return {
    leafColumns,
    headerRows,
  }
}
