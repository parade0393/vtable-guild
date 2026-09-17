import type { ColumnType } from '../types'
import { getColumnKey } from '../composables/useColumns'

/**
 * 与 ColGroup / TableCell 同一套宽度口径：拖拽覆写优先，否则用列声明。
 *
 * 非数字声明（`auto`、百分比）按 0 计入滚动总宽——它们的真实像素只能量表头，
 * 那是 virtualColumn 路径的事。这里只负责「声明数字宽 + 拖拽结果」。
 */
export function resolveDeclaredColumnWidth(
  column: ColumnType<Record<string, unknown>>,
  index: number,
  columnWidths?: Record<string, number>,
): number {
  const resized = columnWidths?.[String(getColumnKey(column) ?? index)]
  const raw = resized ?? column.width
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? raw : 0
  }
  const parsed = Number.parseInt(String(raw || '0'), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function sumDeclaredColumnWidths(
  columns: readonly ColumnType<Record<string, unknown>>[],
  columnWidths?: Record<string, number>,
): number {
  let total = 0
  for (let i = 0; i < columns.length; i += 1) {
    total += resolveDeclaredColumnWidth(columns[i], i, columnWidths)
  }
  return total
}

/** 从 table 内联 width（如 `20600px`）取出数字，供虚拟表体总宽与 scroll.x 对齐。 */
export function parseStylePxWidth(width: string | undefined): number {
  if (!width) return 0
  const match = /^(\d+(?:\.\d+)?)px$/.exec(width.trim())
  if (!match) return 0
  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : 0
}
