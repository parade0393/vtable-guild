// packages/table/src/utils/rowKey.ts
import type { Key } from '../types/column'

export type RowKeyProp = string | ((record: Record<string, unknown>) => Key) | undefined

/**
 * 从记录解析出行 key：函数形式直接调用；字符串形式取记录字段；
 * 都不可用时回退到 index（是否告警由调用方决定，本函数保持纯净）。
 */
export function resolveRowKey(
  record: Record<string, unknown>,
  index: number,
  rowKey: RowKeyProp,
): Key {
  if (typeof rowKey === 'function') return rowKey(record)
  if (typeof rowKey === 'string' && rowKey in record) {
    return record[rowKey] as Key
  }
  return index
}
