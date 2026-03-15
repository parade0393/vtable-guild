/**
 * Input 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { inputTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 input 主题。
 */
export { antdvInputTheme as inputTheme } from './presets/antdv/input'
export type {
  AntdvInputSlots as InputSlots,
  AntdvInputThemeConfig as InputThemeConfig,
} from './presets/antdv/input'
