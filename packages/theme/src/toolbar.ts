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
    search: 'flex w-[var(--vtg-toolbar-search-width,240px)] max-w-full items-center',
    searchGroup:
      'inline-flex h-[var(--vtg-toolbar-search-height,32px)] w-full min-w-0 items-stretch text-[length:var(--vtg-toolbar-search-font-size,14px)]',
    searchField:
      'relative z-0 -mr-px flex min-w-0 flex-1 items-center gap-1 rounded-l-[var(--vtg-input-border-radius)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-[var(--vtg-input-padding-inline)] transition-all duration-200 hover:z-10 hover:border-[color:var(--color-primary-hover)] focus-within:z-10 focus-within:border-[color:var(--color-primary)] focus-within:shadow-[0_0_0_2px_rgba(5,145,255,0.1)] data-[disabled]:cursor-not-allowed data-[disabled]:bg-[color:var(--color-bg-disabled)] data-[disabled]:hover:border-[color:var(--color-border)]',
    searchInput:
      'h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[length:var(--vtg-toolbar-search-font-size,14px)] outline-none shadow-none focus:shadow-none',
    searchSubmit:
      'relative z-0 inline-flex w-[var(--vtg-toolbar-search-height,32px)] shrink-0 items-center justify-center rounded-r-[var(--vtg-input-border-radius)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-0 text-[color:var(--color-on-surface)] cursor-pointer transition-colors duration-200 hover:z-10 hover:text-[color:var(--color-primary-hover)] hover:border-[color:var(--color-primary-hover)] focus-visible:z-10 focus-visible:outline-none focus-visible:border-[color:var(--color-primary)] focus-visible:shadow-[0_0_0_2px_rgba(5,145,255,0.1)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-bg-disabled)] disabled:text-[color:var(--color-text-disabled)] disabled:hover:border-[color:var(--color-border)]',
    searchClear:
      'inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[color:var(--color-text-placeholder)] cursor-pointer hover:text-[color:var(--color-muted)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-disabled)]',
    searchIcon: 'block h-[1em] w-[1em] shrink-0',
    filter: 'flex min-w-0 max-w-full flex-wrap items-center gap-2',
    extra: 'flex w-full min-w-0 flex-wrap items-center gap-3',
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
    searchField: `${toolbarTheme.slots.searchField} hover:border-[color:var(--color-border-hover)] focus-within:shadow-none focus-within:hover:border-[color:var(--color-primary)]`,
    searchSubmit: `${toolbarTheme.slots.searchSubmit} bg-[color:var(--color-bg-disabled)] text-[color:var(--color-muted)] focus-visible:shadow-none`,
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
  searchPlaceholder: '请输入关键词',
  search: '搜索',
  clearSearch: '清空搜索',
} as const satisfies VTableGuildToolbarLocale

export const toolbarEnUS = {
  label: 'Table toolbar',
  reload: 'Reload',
  fullScreen: 'Full screen',
  exitFullScreen: 'Exit full screen',
  searchPlaceholder: 'Enter keywords',
  search: 'Search',
  clearSearch: 'Clear search',
} as const satisfies VTableGuildToolbarLocale
