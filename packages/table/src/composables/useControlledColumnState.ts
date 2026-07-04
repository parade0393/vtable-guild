import { reactive } from 'vue'
import type { ColumnType } from '../types'
import { getColumnKey } from './useColumns'

export interface UseControlledColumnStateOptions<TValue, TRecord extends Record<string, unknown>> {
  /**
   * 从列配置读取受控值；返回 undefined 表示该列处于非受控模式。
   * 返回 null 表示"受控但为空"（如 filteredValue: null），读取时落到 fallback。
   */
  controlledValue: (column: ColumnType<TRecord>) => TValue | null | undefined
}

/**
 * 按列 keyed 的受控/非受控状态原语（useSorter / useFilter 共享）。
 *
 * - 受控列（列配置上的受控字段 !== undefined）：读列配置，写入被忽略
 * - 非受控列：读写内部 reactive record（columnKey → value）
 *
 * 各消费方保留自己的初始化（defaultSortOrder / defaultFilteredValue）
 * 与批量清理逻辑，直接操作暴露出的 innerState。
 */
export function useControlledColumnState<
  TValue,
  TRecord extends Record<string, unknown> = Record<string, unknown>,
>(options: UseControlledColumnStateOptions<TValue, TRecord>) {
  const innerState = reactive({}) as Record<string, TValue>

  function isControlled(column: ColumnType<TRecord>): boolean {
    return options.controlledValue(column) !== undefined
  }

  function readValue<F extends TValue | null>(
    column: ColumnType<TRecord>,
    fallback: F,
  ): TValue | F {
    if (isControlled(column)) {
      return options.controlledValue(column) ?? fallback
    }
    const key = getColumnKey(column)
    if (key === undefined) return fallback
    return innerState[String(key)] ?? fallback
  }

  /** 仅对非受控列生效；value 为 undefined 时删除该列条目 */
  function writeValue(column: ColumnType<TRecord>, value: TValue | undefined): void {
    if (isControlled(column)) return
    const key = getColumnKey(column)
    if (key === undefined) return
    if (value === undefined) {
      delete innerState[String(key)]
    } else {
      innerState[String(key)] = value
    }
  }

  return { innerState, isControlled, readValue, writeValue }
}
