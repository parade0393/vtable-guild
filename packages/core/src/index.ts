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

// ---------- Components ----------
export { default as Tooltip } from './components/Tooltip'
export { default as Checkbox } from './components/Checkbox'
export { default as Button } from './components/Button'

// ---------- Plugin ----------
export { createVTableGuild, VTABLE_GUILD_INJECTION_KEY } from './plugin/index'
