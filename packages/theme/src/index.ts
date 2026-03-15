// packages/theme/src/index.ts

// ---------- 主题定义 ----------
export { tableTheme, TABLE_ALIGN_CLASSES } from './table'
export { buttonTheme } from './button'
export { checkboxTheme } from './checkbox'
export { radioTheme } from './radio'
export { inputTheme } from './input'
export { tooltipTheme } from './tooltip'

// ---------- 预设解析 ----------
export {
  resolveBuiltInLocale,
  resolveThemePreset,
  resolveTableThemePreset,
  resolveTableLocalePreset,
  resolveBuiltInTableLocale,
  resolveButtonThemePreset,
  resolveCheckboxThemePreset,
  resolveRadioThemePreset,
  resolveInputThemePreset,
  resolveTooltipThemePreset,
} from './presets'
export type { BuiltInLocaleName, ThemePresetName } from './presets'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps, TableThemeConfig } from './table'
export type { ButtonSlots, ButtonThemeConfig } from './button'
export type { CheckboxSlots, CheckboxThemeConfig } from './checkbox'
export type { RadioSlots, RadioThemeConfig } from './radio'
export type { InputSlots, InputThemeConfig } from './input'
export type { TooltipSlots, TooltipThemeConfig } from './tooltip'
