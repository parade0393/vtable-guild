// packages/table/src/composables/useSorter.ts

import { computed, ref, type Ref } from 'vue'
import type { ColumnType, Key, SortOrder, SorterFn } from '../types'
import { getByDataIndex } from './useColumns'

/** 排序状态 */
export interface SorterState {
  /** 排序列的 key */
  columnKey: Key | undefined
  /** 排序方向 */
  order: SortOrder
  /** 排序列配置 */
  column: ColumnType<Record<string, unknown>> | undefined
}

/** change 事件中的 sorter 参数 */
export interface SorterResult {
  column: ColumnType<Record<string, unknown>> | undefined
  columnKey: Key | undefined
  order: SortOrder
  field: ColumnType<Record<string, unknown>>['dataIndex']
}

/**
 * 获取列的唯一标识。
 * 优先使用 key，其次 dataIndex 转字符串。
 */
function getColumnKey(column: ColumnType<Record<string, unknown>>): Key | undefined {
  if (column.key !== undefined) return column.key
  if (column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex)
  }
  return undefined
}

/**
 * 默认比较函数。
 * 数字按大小排，字符串按 localeCompare，其余转字符串比较。
 */
function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

/**
 * 获取列的可用排序方向列表。
 * 默认 ['ascend', 'descend']，用户可通过 sortDirections 自定义。
 */
function getSortDirections(column: ColumnType<Record<string, unknown>>): SortOrder[] {
  return column.sortDirections ?? ['ascend', 'descend']
}

/**
 * 计算下一个排序方向。
 * 在 sortDirections 数组中循环，超出末尾回到 null（无排序）。
 */
function getNextSortOrder(current: SortOrder, directions: SortOrder[]): SortOrder {
  const index = directions.indexOf(current)
  // 当前方向不在列表中（如 null） → 从第一个方向开始
  if (index === -1) return directions[0] ?? null
  // 已是最后一个 → 回到 null（无排序）
  if (index >= directions.length - 1) return null
  return directions[index + 1]
}

export interface UseSorterOptions {
  /** 响应式列配置 getter */
  columns: () => ColumnType<Record<string, unknown>>[]
  /** 排序变化回调（用于触发 change 事件） */
  onSorterChange?: (sorterResult: SorterResult) => void
}

/**
 * 排序状态管理 composable。
 *
 * 支持受控（column.sortOrder）和非受控（内部 ref）两种模式：
 * - 受控：column.sortOrder 不为 undefined 时，组件不管理排序状态
 * - 非受控：首次使用 column.defaultSortOrder，后续内部维护
 *
 * 返回值：
 * - sortedData：排序后的数据（computed）
 * - sorterState：当前排序状态（computed）
 * - toggleSortOrder：切换排序方向（表头点击时调用）
 * - getSortOrder：获取某列的当前排序方向
 */
export function useSorter(options: UseSorterOptions) {
  const { columns, onSorterChange } = options

  // ---- 非受控模式的内部状态 ----
  const innerSortColumnKey = ref<Key | undefined>(undefined) as Ref<Key | undefined>
  const innerSortOrder = ref<SortOrder>(null) as Ref<SortOrder>

  // 初始化：查找第一个有 defaultSortOrder 的列
  const initColumn = columns().find((col) => col.defaultSortOrder && col.sorter)
  if (initColumn) {
    innerSortColumnKey.value = getColumnKey(initColumn)
    innerSortOrder.value = initColumn.defaultSortOrder!
  }

  /**
   * 判断某列是否处于受控模式。
   * column.sortOrder 不为 undefined 即视为受控。
   */
  function isControlled(column: ColumnType<Record<string, unknown>>): boolean {
    return column.sortOrder !== undefined
  }

  /**
   * 获取某列的当前排序方向。
   */
  function getSortOrder(column: ColumnType<Record<string, unknown>>): SortOrder {
    const key = getColumnKey(column)
    // 受控模式直接返回 column.sortOrder
    if (isControlled(column)) return column.sortOrder!
    // 非受控模式：只有当前活跃排序列才有方向
    if (key !== undefined && key === innerSortColumnKey.value) return innerSortOrder.value
    return null
  }

  /**
   * 切换排序方向。
   * 表头点击时调用。
   */
  function toggleSortOrder(column: ColumnType<Record<string, unknown>>): void {
    if (!column.sorter) return

    const key = getColumnKey(column)
    const currentOrder = getSortOrder(column)
    const directions = getSortDirections(column)
    const nextOrder = getNextSortOrder(currentOrder, directions)

    // 非受控模式：更新内部状态
    if (!isControlled(column)) {
      if (nextOrder === null) {
        innerSortColumnKey.value = undefined
        innerSortOrder.value = null
      } else {
        innerSortColumnKey.value = key
        innerSortOrder.value = nextOrder
      }
    }

    // 触发回调（无论受控/非受控）
    onSorterChange?.({
      column: nextOrder ? column : undefined,
      columnKey: nextOrder ? key : undefined,
      order: nextOrder,
      field: column.dataIndex,
    })
  }

  /**
   * 当前排序状态（computed）。
   */
  const sorterState = computed<SorterState>(() => {
    // 优先查找受控列
    const controlledCol = columns().find(
      (col) => col.sorter && isControlled(col) && col.sortOrder !== null,
    )
    if (controlledCol) {
      return {
        columnKey: getColumnKey(controlledCol),
        order: controlledCol.sortOrder!,
        column: controlledCol,
      }
    }

    // 非受控模式
    if (innerSortColumnKey.value !== undefined && innerSortOrder.value !== null) {
      const col = columns().find((c) => getColumnKey(c) === innerSortColumnKey.value)
      return {
        columnKey: innerSortColumnKey.value,
        order: innerSortOrder.value,
        column: col,
      }
    }

    return { columnKey: undefined, order: null, column: undefined }
  })

  /**
   * 排序数据。
   *
   * @param data - 原始数据数组
   * @returns 排序后的新数组（不修改原数组）
   */
  function sortData<TRecord extends Record<string, unknown>>(data: TRecord[]): TRecord[] {
    const { column, order } = sorterState.value
    if (!column || !order || !column.sorter) return data

    const compareFn: SorterFn<TRecord> =
      typeof column.sorter === 'function'
        ? (column.sorter as SorterFn<TRecord>)
        : (a, b) =>
            defaultCompare(getByDataIndex(a, column.dataIndex), getByDataIndex(b, column.dataIndex))

    const multiplier = order === 'descend' ? -1 : 1

    return [...data].sort((a, b) => compareFn(a, b) * multiplier)
  }

  return {
    sorterState,
    getSortOrder,
    toggleSortOrder,
    sortData,
  }
}

export { getColumnKey }
