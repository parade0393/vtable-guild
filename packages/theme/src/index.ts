// packages/theme/src/index.ts

// ---------- 主题定义 ----------
export { tableTheme, TABLE_ALIGN_CLASSES } from './table'

// ---------- 预设解析 ----------
export {
  resolveBuiltInLocale,
  resolveThemePreset,
  resolveTableThemePreset,
  resolveTableLocalePreset,
  resolveBuiltInTableLocale,
} from './presets'
export type { BuiltInLocaleName, ThemePresetName } from './presets'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps, TableThemeConfig } from './table'
