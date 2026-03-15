/**
 * Radio 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { radioTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 radio 主题。
 */
export { antdvRadioTheme as radioTheme } from './presets/antdv/radio'
export type {
  AntdvRadioSlots as RadioSlots,
  AntdvRadioThemeConfig as RadioThemeConfig,
} from './presets/antdv/radio'
