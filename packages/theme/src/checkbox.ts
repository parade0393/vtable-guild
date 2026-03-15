/**
 * Checkbox 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { checkboxTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 checkbox 主题。
 */
export { antdvCheckboxTheme as checkboxTheme } from './presets/antdv/checkbox'
export type {
  AntdvCheckboxSlots as CheckboxSlots,
  AntdvCheckboxThemeConfig as CheckboxThemeConfig,
} from './presets/antdv/checkbox'
