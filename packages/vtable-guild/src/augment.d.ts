// Module augmentation for @vtable-guild/core
// This file ensures type hints work correctly when importing from @vtable-guild/vtable-guild

import type { ThemeOverrideConfig } from '@vtable-guild/core'
import type {
  TableThemeConfig,
  ButtonThemeConfig,
  CheckboxThemeConfig,
  RadioThemeConfig,
  InputThemeConfig,
  TooltipThemeConfig,
  ScrollbarThemeConfig,
} from '@vtable-guild/theme'

declare module '@vtable-guild/core' {
  interface VTableGuildThemeOverridesMap {
    table: ThemeOverrideConfig<TableThemeConfig>
    button: ThemeOverrideConfig<ButtonThemeConfig>
    checkbox: ThemeOverrideConfig<CheckboxThemeConfig>
    radio: ThemeOverrideConfig<RadioThemeConfig>
    input: ThemeOverrideConfig<InputThemeConfig>
    tooltip: ThemeOverrideConfig<TooltipThemeConfig>
    scrollbar: ThemeOverrideConfig<ScrollbarThemeConfig>
  }
}
