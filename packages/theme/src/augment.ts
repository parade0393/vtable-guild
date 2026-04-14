// packages/theme/src/augment.ts
// Module augmentation：为 @vtable-guild/core 的 VTableGuildThemeOverridesMap 注入内置组件的精确主题类型。
// 使 createVTableGuild({ theme: { table: { slots: { ... } } } }) 拥有完整的类型提示。

import type { ThemeOverrideConfig } from '@vtable-guild/core'
import type { TableThemeConfig } from './table'
import type { ButtonThemeConfig } from './button'
import type { CheckboxThemeConfig } from './checkbox'
import type { RadioThemeConfig } from './radio'
import type { InputThemeConfig } from './input'
import type { TooltipThemeConfig } from './tooltip'
import type { ScrollbarThemeConfig } from './scrollbar'

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
