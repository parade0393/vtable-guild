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
}

export interface VTableGuildContext {
  themePreset: ThemePresetName
  cssMode: VTableGuildCssMode
  classPrefix: string
  theme: VTableGuildThemeOverrides
  locale: LocaleName
  locales: LocaleRegistry
  localeOverrides: DeepPartial<VTableGuildLocale>
}

// ---------- Composables ----------
export { useTheme, mergeThemeConfigs } from './composables/useTheme'
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
