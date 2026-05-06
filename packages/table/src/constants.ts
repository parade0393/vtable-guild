export const SELECTION_ALL = 'SELECT_ALL' as const
export const SELECTION_INVERT = 'SELECT_INVERT' as const
export const SELECTION_NONE = 'SELECT_NONE' as const

export type SelectionSentinel =
  | typeof SELECTION_ALL
  | typeof SELECTION_INVERT
  | typeof SELECTION_NONE

/**
 * 占位常量：把这两个 sentinel 插入到 `columns` 数组的任意位置，
 * 可以让展开图标列 / 复选框选择列出现在该位置而非默认的最左侧。
 *
 * 仅当对应特性 (`expandable` / `rowSelection`) 启用时 sentinel 才生效；
 * 关闭时 sentinel 会被静默忽略，与 ant-design-vue 行为一致。
 *
 * sentinel 仅在 `columns` 顶层识别，不会进入 `ColumnGroupType.children` 内查找。
 */
export const EXPAND_COLUMN: unique symbol = Symbol('VTG_EXPAND_COLUMN')
export const SELECTION_COLUMN: unique symbol = Symbol('VTG_SELECTION_COLUMN')

export type ExpandColumnSentinel = typeof EXPAND_COLUMN
export type SelectionColumnSentinel = typeof SELECTION_COLUMN
export type ColumnSentinel = ExpandColumnSentinel | SelectionColumnSentinel
