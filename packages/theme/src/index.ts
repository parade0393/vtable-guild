// packages/theme/src/index.ts

// ---------- Module Augmentation ----------
// 内联 declare module 块，确保 vite-plugin-dts 将其保留在 dist/index.d.ts 中。
// （原 augment.ts 中的副作用导入被 dts 构建时剥离，导致外部项目无法获取类型增强。）
import type { ThemeOverrideConfig } from '@vtable-guild/core'
import type { TableThemeConfig } from './table'
import type { ButtonThemeConfig } from './button'
import type { CheckboxThemeConfig } from './checkbox'
import type { RadioThemeConfig } from './radio'
import type { InputThemeConfig } from './input'
import type { TooltipThemeConfig } from './tooltip'
import type { ScrollbarThemeConfig } from './scrollbar'

declare module '@vtable-guild/core' {
  interface VTableGuildThemeOverridesMap {
    table: ThemeOverrideConfig<TableThemeConfig>
    button: ThemeOverrideConfig<ButtonThemeConfig>
    checkbox: ThemeOverrideConfig<CheckboxThemeConfig>
    radio: ThemeOverrideConfig<RadioThemeConfig>
    input: ThemeOverrideConfig<InputThemeConfig>
    tooltip: ThemeOverrideConfig<TooltipThemeConfig>
    scrollbar: ThemeOverrideConfig<ScrollbarThemeConfig>
  }
}

// ---------- 主题定义 ----------
export { tableTheme, TABLE_ALIGN_CLASSES } from './table'
export { buttonTheme } from './button'
export { checkboxTheme } from './checkbox'
export { radioTheme } from './radio'
export { inputTheme } from './input'
export { tooltipTheme } from './tooltip'
export { scrollbarTheme } from './scrollbar'

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
  resolveScrollbarThemePreset,
} from './presets'
export type { BuiltInLocaleName, ThemePresetName } from './presets'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps, TableThemeConfig } from './table'
export type { ButtonSlots, ButtonThemeConfig } from './button'
export type { CheckboxSlots, CheckboxThemeConfig } from './checkbox'
export type { RadioSlots, RadioThemeConfig } from './radio'
export type { InputSlots, InputThemeConfig } from './input'
export type { TooltipSlots, TooltipThemeConfig } from './tooltip'
export type { ScrollbarSlots, ScrollbarThemeConfig } from './scrollbar'

// ---------- 兼容类名 ----------
export { antdvTableCompatClasses } from './compat/antdv-table'
export type { CompatClassConfig } from './compat/antdv-table'
