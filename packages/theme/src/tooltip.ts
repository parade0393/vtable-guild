/**
 * Tooltip 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { tooltipTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 tooltip 主题。
 */
export { antdvTooltipTheme as tooltipTheme } from './presets/antdv/tooltip'
export type {
  AntdvTooltipSlots as TooltipSlots,
  AntdvTooltipThemeConfig as TooltipThemeConfig,
} from './presets/antdv/tooltip'
