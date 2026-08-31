import type { ColumnGroupType, ColumnsType, Key } from '../types'
import { getColumnKey } from './useColumns'

/**
 * 过滤不可见列（`column.visible === false`）。
 *
 * 与 filterResponsiveColumns 同构：哨兵（EXPAND_COLUMN / SELECTION_COLUMN）
 * 原样穿过；叶子列 visible 为 false 时丢弃；分组列自身隐藏或子列全部被
 * 过滤掉时整组丢弃。叶子列保持原引用稳定；分组列因需替换 children 数组
 * 会被克隆。
 *
 * 只在显示层（displayColumnTree）调用：数据列（排序/筛选输入）保持全量，
 * 隐藏列的 sorter / filter 内部状态不会被清理，取消隐藏后状态保留。
 */
export function filterVisibleColumns<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
): ColumnsType<TRecord> {
  return columns.reduce<ColumnsType<TRecord>>((result, column) => {
    if (typeof column === 'symbol') {
      result.push(column)
      return result
    }
    if (column.visible === false) {
      return result
    }

    if ('children' in column && Array.isArray(column.children)) {
      const children = filterVisibleColumns(column.children)
      if (children.length === 0) {
        return result
      }
      result.push({ ...column, children } as ColumnGroupType<TRecord>)
      return result
    }

    result.push(column)
    return result
  }, [])
}

/**
 * 按表级 `columnOrder` 重排顶层列。
 *
 * 规则：
 * - key 在 order 中出现的列，按 order 中的先后排前（重复 key 取首次下标）；
 * - 未出现的列（含无 key 列）保持原相对顺序，排在已匹配列之后；
 * - `pinnedKeys`（选择列 / 展开列）不参与顺序匹配，恒提取到最前（保持原相对顺序）；
 * - order 为空时原样返回，不做任何重排。
 *
 * 仅重排传入的这一层数组；分组列作为整体移动。
 */
export function applyColumnOrder<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
  order: Key[] | undefined,
  pinnedKeys: readonly string[] = [],
): ColumnsType<TRecord> {
  if (!order || order.length === 0) return columns

  const orderIndex = new Map<string, number>()
  order.forEach((key, index) => {
    const normalized = String(key)
    if (!orderIndex.has(normalized)) {
      orderIndex.set(normalized, index)
    }
  })
  const pinnedSet = new Set(pinnedKeys)

  type Entry = { column: ColumnsType<TRecord>[number]; order: number; index: number }
  const pinned: ColumnsType<TRecord> = []
  const matched: Entry[] = []
  const unmatched: Entry[] = []

  columns.forEach((column, index) => {
    if (typeof column !== 'symbol') {
      const key = getColumnKey(column)
      if (key !== undefined && pinnedSet.has(String(key))) {
        pinned.push(column)
        return
      }
      const position = key !== undefined ? orderIndex.get(String(key)) : undefined
      if (position !== undefined) {
        matched.push({ column, order: position, index })
        return
      }
    }
    unmatched.push({ column, order: Number.POSITIVE_INFINITY, index })
  })

  matched.sort((a, b) => a.order - b.order || a.index - b.index)
  unmatched.sort((a, b) => a.index - b.index)

  return [
    ...pinned,
    ...matched.map((entry) => entry.column),
    ...unmatched.map((entry) => entry.column),
  ]
}
