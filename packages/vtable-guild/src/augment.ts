// Module augmentation：把各内置组件的精确主题类型注入 @vtable-guild/core 的
// VTableGuildThemeOverridesMap，使 createVTableGuild({ theme: { table: ... } }) 拥有完整补全。
//
// 为什么 declare module 必须写相对路径：
// @vtable-guild/core 是 private 包（永不发布），本包的 dependencies 只有 tailwind-variants，
// 外部消费者装不到它，任何残留的裸 specifier 都会在消费方编译期炸出 TS2307。
// 而 vite 的 preserveModulesRoot: packages/ 让产物与源码目录结构一一对应
// （packages/vtable-guild/src/augment.ts ↔ dist/vtable-guild/src/augment.d.ts），
// 因此 '../../core/src/index' 在 src 与 dist 两侧都指向同一个 core 入口
// （src 下解析到 packages/core/src/index.ts，dist 下解析到 dist/core/src/index.d.ts）。
// 上面的 import type 保持裸 specifier，由 vite-plugin-dts 依据 tsconfig paths 自动改写。

import type { ThemeOverrideConfig } from '@vtable-guild/core'
import type {
  TableThemeConfig,
  ButtonThemeConfig,
  CheckboxThemeConfig,
  RadioThemeConfig,
  InputThemeConfig,
  TooltipThemeConfig,
  ScrollbarThemeConfig,
  PaginationThemeConfig,
  ColumnSettingsThemeConfig,
  ToolbarThemeConfig,
} from '@vtable-guild/theme'

declare module '../../core/src/index' {
  interface VTableGuildThemeOverridesMap {
    table: ThemeOverrideConfig<TableThemeConfig>
    button: ThemeOverrideConfig<ButtonThemeConfig>
    checkbox: ThemeOverrideConfig<CheckboxThemeConfig>
    radio: ThemeOverrideConfig<RadioThemeConfig>
    input: ThemeOverrideConfig<InputThemeConfig>
    tooltip: ThemeOverrideConfig<TooltipThemeConfig>
    scrollbar: ThemeOverrideConfig<ScrollbarThemeConfig>
    pagination: ThemeOverrideConfig<PaginationThemeConfig>
    columnSettings: ThemeOverrideConfig<ColumnSettingsThemeConfig>
    toolbar: ThemeOverrideConfig<ToolbarThemeConfig>
  }
}
