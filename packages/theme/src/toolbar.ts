import type { ThemeConfig, ThemePresetName, VTableGuildToolbarLocale } from '@vtable-guild/core'
import { columnSettingsTheme } from './column-settings'

export const toolbarTheme = {
  slots: {
    root: 'flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-3 text-[length:var(--vtg-table-font-size)] text-[color:var(--color-on-surface)] font-[family-name:var(--font-family-base)] leading-[var(--vtg-table-line-height)]',
    title:
      'min-w-0 flex-1 text-[length:var(--vtg-toolbar-title-font-size)] font-[number:var(--vtg-toolbar-title-font-weight)]',
    right: 'ml-auto flex max-w-full flex-wrap items-center justify-end gap-4',
    actions: 'flex max-w-full flex-wrap items-center gap-2',
    settings: 'inline-flex shrink-0 items-center gap-4',
    action: columnSettingsTheme.slots.trigger,
    icon: 'block',
    loadingIcon: 'animate-spin motion-reduce:animate-none',
  },
} as const satisfies ThemeConfig

export const elementPlusToolbarTheme = {
  ...toolbarTheme,
  slots: {
    ...toolbarTheme.slots,
    actions: `${toolbarTheme.slots.actions} [&>.el-button+.el-button]:!ml-0`,
  },
} as const satisfies ThemeConfig

export type ToolbarThemeConfig = typeof toolbarTheme
export type ToolbarSlots = keyof ToolbarThemeConfig['slots']

export function resolveToolbarThemePreset(name: ThemePresetName = 'antdv') {
  return name === 'element-plus' ? elementPlusToolbarTheme : toolbarTheme
}

export const toolbarZhCN = {
  label: '表格工具栏',
  reload: '刷新',
  fullScreen: '全屏',
  exitFullScreen: '退出全屏',
} as const satisfies VTableGuildToolbarLocale

export const toolbarEnUS = {
  label: 'Table toolbar',
  reload: 'Reload',
  fullScreen: 'Full screen',
  exitFullScreen: 'Exit full screen',
} as const satisfies VTableGuildToolbarLocale
