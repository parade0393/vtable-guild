// packages/table/src/utils/compat.ts

/**
 * antdv 兼容类名 · 第二层（状态驱动）。
 *
 * 第一层由主题 slot 静态映射（见 @vtable-guild/theme 的 compat/antdv-table），
 * 这里补的是 slot 覆盖不到、必须按运行时状态计算的部分：选中行、树层级、
 * 固定列边界、滚动 ping 状态等。
 *
 * 所有函数在未开启兼容类名时（`tableContext.compatClass` 为 undefined）返回空串，
 * 调用点无需额外判断。类名以 ant-design-vue 4.2.6 源码为准。
 */

import type { TableContext } from '../context'
import type { FixedOffset } from '../composables/useScroll'

/** 行级状态类：选中态 + 树层级。 */
export function getRowCompatClass(
  tableContext: TableContext,
  record: Record<string, unknown>,
  rowIndex: number,
  rowIndent: number,
): string {
  const compat = tableContext.compatClass
  if (!compat) return ''

  const classes: string[] = []

  if (tableContext.getSelectionState?.(record, rowIndex).checked) {
    classes.push(compat('row-selected'))
  }

  if (tableContext.isTreeData?.value) {
    classes.push(compat(`row-level-${rowIndent}`))
  }

  return classes.join(' ')
}

/** 固定列单元格状态类：左右固定 + 边界位置。 */
export function getFixedCellCompatClass(
  tableContext: TableContext,
  fixedInfo: FixedOffset | null,
): string {
  const compat = tableContext.compatClass
  if (!compat || !fixedInfo) return ''

  const classes: string[] = []

  if (fixedInfo.left !== undefined) {
    classes.push(compat('cell-fix-left'))
    if (fixedInfo.isLastLeft) classes.push(compat('cell-fix-left-last'))
  }

  if (fixedInfo.right !== undefined) {
    classes.push(compat('cell-fix-right'))
    if (fixedInfo.isFirstRight) classes.push(compat('cell-fix-right-first'))
  }

  return classes.join(' ')
}

/** 表格根元素状态类：存在固定列 + 横向滚动 ping 状态。 */
export function getRootCompatClass(
  tableContext: Pick<TableContext, 'compatClass' | 'fixedOffsets' | 'scrollState'>,
): string {
  const compat = tableContext.compatClass
  if (!compat) return ''

  const classes: string[] = []
  const offsets = tableContext.fixedOffsets?.value

  let hasLeft = false
  let hasRight = false
  if (offsets) {
    for (const info of offsets.values()) {
      if (info.left !== undefined) hasLeft = true
      if (info.right !== undefined) hasRight = true
      if (hasLeft && hasRight) break
    }
  }

  if (hasLeft) classes.push(compat('has-fix-left'))
  if (hasRight) classes.push(compat('has-fix-right'))

  // ping 表示该侧还有未滚动到的内容；antdv 用它驱动固定列阴影
  if (tableContext.scrollState) {
    if (!tableContext.scrollState.atStart.value) classes.push(compat('ping-left'))
    if (!tableContext.scrollState.atEnd.value) classes.push(compat('ping-right'))
  }

  return classes.join(' ')
}
