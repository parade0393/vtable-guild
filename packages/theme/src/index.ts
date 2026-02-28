// packages/theme/src/index.ts

// ---------- 主题定义 ----------
export { tableTheme } from './table'
export { paginationTheme } from './pagination'

// ---------- 预设解析 ----------
export { resolveThemePreset, resolveTableThemePreset } from './presets'
export type { ThemePresetName } from './presets'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps, TableThemeConfig } from './table'
export type { PaginationSlots, PaginationVariantProps } from './pagination'
