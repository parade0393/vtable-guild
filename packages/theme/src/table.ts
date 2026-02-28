// packages/theme/src/table.ts

/**
 * Table 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { tableTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 table 主题。
 */
export { antdvTableTheme as tableTheme } from './presets/antdv/table'
export type {
  AntdvTableSlots as TableSlots,
  AntdvTableVariantProps as TableVariantProps,
  AntdvTableThemeConfig as TableThemeConfig,
} from './presets/antdv/table'
