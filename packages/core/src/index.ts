// packages/core/src/index.ts

// ---------- Utils ----------
export { tv, cn } from './utils/tv'
export { optionalProp, requiredProp, optionalBoolProp, optionalStringProp } from './utils/props'

// ---------- Types ----------
export type {
  ThemeConfig,
  SlotProps,
  VTableGuildOptions,
  VTableGuildContext,
  ThemePresetName,
} from './utils/types'

// ---------- Composables ----------
export { useTheme } from './composables/useTheme'

// ---------- Plugin ----------
export { createVTableGuild, VTABLE_GUILD_INJECTION_KEY } from './plugin/index'
