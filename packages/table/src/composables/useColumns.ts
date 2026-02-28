import { computed } from 'vue'
import type { ColumnGroupType, ColumnType, ColumnsType, DataIndex } from '../types'

function isColumnGroup<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>,
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
 * @returns { leafColumns } — 拍平后的叶子列
 */
export function useColumns<TRecord extends Record<string, unknown>>(
  columns: () => ColumnsType<TRecord>,
) {
  const leafColumns = computed(() => flattenColumns(columns()))

  return {
    leafColumns,
  }
}
