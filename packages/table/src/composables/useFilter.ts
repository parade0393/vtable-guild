// packages/table/src/composables/useFilter.ts

import { reactive } from 'vue'
import type { ColumnType } from '../types'
import { getColumnKey } from './useSorter'

/** 筛选状态记录：columnKey → 选中的筛选值数组 */
export type FiltersRecord = Record<string, (string | number | boolean)[] | null>

export interface UseFilterOptions {
  /** 响应式列配置 getter */
  columns: () => ColumnType<Record<string, unknown>>[]
  /** 筛选变化回调 */
  onFilterChange?: (filters: FiltersRecord) => void
}

/**
 * 筛选状态管理 composable。
 *
 * 支持受控（column.filteredValue）和非受控（内部 reactive）两种模式：
 * - 受控：column.filteredValue !== undefined 时，组件不管理筛选状态
 * - 非受控：首次使用 column.defaultFilteredValue，后续内部维护
 */
export function useFilter(options: UseFilterOptions) {
  const { columns, onFilterChange } = options

  // 非受控模式的内部状态
  const innerFilterState = reactive<Record<string, (string | number | boolean)[]>>({})

  // 初始化：读取 defaultFilteredValue
  for (const col of columns()) {
    const key = getColumnKey(col)
    if (key !== undefined && col.defaultFilteredValue) {
      innerFilterState[String(key)] = [...col.defaultFilteredValue]
    }
  }

  /**
   * 判断某列是否处于受控模式。
   */
  function isControlled(column: ColumnType<Record<string, unknown>>): boolean {
    return column.filteredValue !== undefined
  }

  /**
   * 获取某列的当前筛选值。
   */
  function getFilteredValue(
    column: ColumnType<Record<string, unknown>>,
  ): (string | number | boolean)[] {
    if (isControlled(column)) {
      return column.filteredValue ?? []
    }
    const key = getColumnKey(column)
    if (key === undefined) return []
    return innerFilterState[String(key)] ?? []
  }

  /**
   * 确认筛选。
   */
  function confirmFilter(
    column: ColumnType<Record<string, unknown>>,
    values: (string | number | boolean)[],
  ): void {
    const key = getColumnKey(column)
    if (key === undefined) return

    // 非受控模式：更新内部状态
    if (!isControlled(column)) {
      if (values.length === 0) {
        delete innerFilterState[String(key)]
      } else {
        innerFilterState[String(key)] = [...values]
      }
    }

    // 触发回调
    onFilterChange?.(getAllFilters())
  }

  /**
   * 重置筛选。
   */
  function resetFilter(column: ColumnType<Record<string, unknown>>): void {
    if (column.filterResetToDefaultFilteredValue && column.defaultFilteredValue) {
      confirmFilter(column, [...column.defaultFilteredValue])
    } else {
      confirmFilter(column, [])
    }
  }

  /**
   * 获取所有列的筛选状态（用于 change 事件参数）。
   */
  function getAllFilters(): FiltersRecord {
    const filters: FiltersRecord = {}
    for (const col of columns()) {
      const key = getColumnKey(col)
      if (key === undefined) continue
      const values = getFilteredValue(col)
      filters[String(key)] = values.length > 0 ? values : null
    }
    return filters
  }

  /**
   * 对数据执行筛选。
   * 遍历所有有筛选值的列，调用其 onFilter 函数。
   * 多列筛选为 AND 关系（所有列都需匹配）。
   * 同列多值为 OR 关系（匹配任一值即可）。
   */
  function filterData<TRecord extends Record<string, unknown>>(data: TRecord[]): TRecord[] {
    const cols = columns()
    // 收集所有有 active 筛选的列
    const activeFilters: Array<{
      column: ColumnType<Record<string, unknown>>
      values: (string | number | boolean)[]
    }> = []

    for (const col of cols) {
      const values = getFilteredValue(col)
      if (values.length > 0 && col.onFilter) {
        activeFilters.push({ column: col, values })
      }
    }

    if (activeFilters.length === 0) return data

    return data.filter((record) =>
      activeFilters.every(({ column, values }) =>
        values.some((val) => column.onFilter!(val, record as Record<string, unknown>)),
      ),
    )
  }

  return {
    getFilteredValue,
    confirmFilter,
    resetFilter,
    getAllFilters,
    filterData,
  }
}
