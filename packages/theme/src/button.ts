/**
 * Button 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { buttonTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 button 主题。
 */
export { antdvButtonTheme as buttonTheme } from './presets/antdv/button'
export type {
  AntdvButtonSlots as ButtonSlots,
  AntdvButtonThemeConfig as ButtonThemeConfig,
} from './presets/antdv/button'
