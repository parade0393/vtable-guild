import type {
  ThemeConfig,
  ThemePresetName,
  VTableGuildSelectionAlertLocale,
} from '@vtable-guild/core'

/** Visual language follows ProTable's current alert (2.8.x / 3.x): neutral tint, no border. */
export const selectionAlertTheme = {
  slots: {
    root: 'box-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--vtg-selection-alert-radius,6px)] bg-[color:var(--vtg-selection-alert-bg,#fafafa)] px-[var(--vtg-selection-alert-padding-inline,24px)] py-[var(--vtg-selection-alert-padding-block,8px)] text-[length:var(--vtg-table-font-size)] font-[family-name:var(--font-family-base)] leading-[var(--vtg-table-line-height)] text-[color:var(--color-muted)]',
    info: 'flex min-w-0 flex-1 flex-wrap items-center',
    text: 'break-words',
    clear:
      'shrink-0 border-0 bg-transparent p-0 text-[length:var(--vtg-table-font-size)] text-[color:var(--color-primary)] cursor-pointer hover:text-[color:var(--color-primary-hover)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-disabled)]',
    option: 'flex min-w-[48px] items-center gap-2 pl-4',
    actions: 'flex min-w-0 flex-wrap items-center gap-2',
  },
} as const satisfies ThemeConfig

export const elementPlusSelectionAlertTheme = {
  ...selectionAlertTheme,
  slots: {
    ...selectionAlertTheme.slots,
    root: `${selectionAlertTheme.slots.root} rounded-[var(--vtg-selection-alert-radius,4px)]`,
    actions: `${selectionAlertTheme.slots.actions} [&>.el-button+.el-button]:!ml-0`,
  },
} as const satisfies ThemeConfig

export type SelectionAlertThemeConfig = typeof selectionAlertTheme
export type SelectionAlertSlots = keyof SelectionAlertThemeConfig['slots']

export function resolveSelectionAlertThemePreset(name: ThemePresetName = 'antdv') {
  return name === 'element-plus' ? elementPlusSelectionAlertTheme : selectionAlertTheme
}

export const selectionAlertZhCN = {
  label: '批量操作',
  selected: '已选择 {count} 项',
  clear: '清空选择',
} as const satisfies VTableGuildSelectionAlertLocale

export const selectionAlertEnUS = {
  label: 'Batch actions',
  selected: '{count} selected',
  clear: 'Clear selection',
} as const satisfies VTableGuildSelectionAlertLocale
