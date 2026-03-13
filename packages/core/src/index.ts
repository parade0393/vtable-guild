// packages/core/src/index.ts

// ---------- Utils ----------
export { tv, cn } from './utils/tv'
export { optionalProp, requiredProp, optionalBoolProp, optionalStringProp } from './utils/props'

// ---------- Types ----------
export type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemeConfig,
  SlotProps,
  VTableGuildOptions,
  VTableGuildContext,
  ThemePresetName,
  VTableGuildLocale,
  VTableGuildTableLocale,
  VTableGuildTableHeaderLocale,
  VTableGuildTableFilterDropdownLocale,
  VTableGuildTableEmptyLocale,
  VTableGuildTableLoadingLocale,
} from './utils/types'

// ---------- Composables ----------
export { useTheme, mergeThemeConfigs } from './composables/useTheme'
export { mergeDeep } from './utils/mergeDeep'

// ---------- Components ----------
export { default as Tooltip } from './components/Tooltip'
export { default as Checkbox } from './components/Checkbox'
export { default as Radio } from './components/Radio'
export { default as Button } from './components/Button'
export { default as Input } from './components/Input'
export { default as VTableGuildConfigProvider } from './components/VTableGuildConfigProvider'

// ---------- Plugin ----------
export {
  createVTableGuild,
  VTABLE_GUILD_INJECTION_KEY,
  syncDocumentPresetAttr,
} from './plugin/index'
