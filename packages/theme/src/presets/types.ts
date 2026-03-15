import type {
  ThemeConfig,
  ThemePresetName,
  VTableGuildLocale,
  VTableGuildTableLocale,
} from '@vtable-guild/core'

export type BuiltInLocaleName = 'zh-CN' | 'en-US'

/**
 * 主题预设接口。
 *
 * 每个 preset 导出一个 ThemePreset 对象，包含各组件的主题配置。
 * 当前仅 table。
 */
export interface ThemePreset {
  table: ThemeConfig
  button?: ThemeConfig
  checkbox?: ThemeConfig
  radio?: ThemeConfig
  input?: ThemeConfig
  tooltip?: ThemeConfig
  tableLocale: VTableGuildTableLocale
  locales: Record<BuiltInLocaleName, VTableGuildLocale>
}

export type { ThemePresetName }
