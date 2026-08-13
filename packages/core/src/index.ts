// packages/core/src/index.ts

// ---------- Utils ----------
export { tv, cn } from './utils/tv'
export {
  DEFAULT_VTG_CLASS_PREFIX,
  normalizeVtgClassPrefix,
  prefixVtgClassNames,
  cnByCssMode,
} from './utils/classPrefix'
export { optionalProp, requiredProp, optionalBoolProp, optionalStringProp } from './utils/props'
export { devWarn } from './utils/devWarn'
import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemePresetName,
  VTableGuildCssMode,
  VTableGuildLocale,
} from './utils/types'

// ---------- Types ----------
export type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemeConfig,
  ThemeOverrideConfig,
  SlotProps,
  ThemePresetName,
  VTableGuildCssMode,
  VTableGuildLocale,
  VTableGuildTableLocale,
  VTableGuildTableHeaderLocale,
  VTableGuildTableFilterDropdownLocale,
  VTableGuildTableEmptyLocale,
  VTableGuildTableLoadingLocale,
  VTableGuildTableSelectionLocale,
} from './utils/types'

// 可由 @vtable-guild/theme 或业务项目通过 module augmentation 扩展。
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VTableGuildThemeOverridesMap {}

export type VTableGuildThemeOverrides = {
  [K in keyof VTableGuildThemeOverridesMap]?: VTableGuildThemeOverridesMap[K]
}

export interface VTableGuildOptions {
  themePreset?: ThemePresetName
  cssMode?: VTableGuildCssMode
  classPrefix?: string
  theme?: VTableGuildThemeOverrides
  locale?: LocaleName
  locales?: LocaleRegistry
  localeOverrides?: DeepPartial<VTableGuildLocale>
  /** 兼容类名开关，默认关闭；开启后为元素添加 antdv 语义类名以兼容旧项目的覆盖 CSS。安装时读取一次，不支持运行时切换 */
  compatClass?: boolean
}

export interface VTableGuildContext {
  themePreset: ThemePresetName
  cssMode: VTableGuildCssMode
  classPrefix: string
  theme: VTableGuildThemeOverrides
  locale: LocaleName
  locales: LocaleRegistry
  localeOverrides: DeepPartial<VTableGuildLocale>
  compatClass?: boolean
}

// ---------- Composables ----------
export { useTheme, mergeThemeConfigs } from './composables/useTheme'
export type { CompatClassConfig, UseThemeOptions } from './composables/useTheme'
export { mergeDeep } from './utils/mergeDeep'

// ---------- Components ----------
export { default as Tooltip } from './components/Tooltip'
export { default as Checkbox } from './components/Checkbox'
export { default as Radio } from './components/Radio'
export { default as Button } from './components/Button'
export { default as Input } from './components/Input'
export { default as Scrollbar } from './components/Scrollbar'
export { default as VTableGuildConfigProvider } from './components/VTableGuildConfigProvider'
export { VirtualList } from './components/VirtualList'
/**
 * 前缀和 + 二分的位置表。纵向虚拟化用它存行高，横向虚拟化用它存列宽——
 * 两条轴共用同一份实现，见 @vtable-guild/table 的 useColumnWindow。
 */
export { PrefixSums } from './components/VirtualList'
export type {
  ListProps,
  ListRef,
  ScrollConfig as VirtualScrollConfig,
  ScrollInfo as VirtualScrollInfo,
  ExtraRenderInfo,
  ScrollBarDirectionType,
} from './components/VirtualList'

// ---------- Plugin ----------
export {
  createVTableGuild,
  VTABLE_GUILD_INJECTION_KEY,
  syncDocumentPresetAttr,
} from './plugin/index'
