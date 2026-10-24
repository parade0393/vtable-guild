import type {
  ThemeConfig,
  ThemePresetName,
  VTableGuildColumnSettingsLocale,
} from '@vtable-guild/core'
import { antdvCheckboxTheme } from './presets/antdv/checkbox'
import { elementPlusCheckboxTheme } from './presets/element-plus/checkbox'

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]'
const trigger = `inline-flex items-center justify-center h-6 w-6 p-0 border-0 bg-transparent text-[length:var(--vtg-column-settings-icon-size)] text-[color:var(--color-on-surface)] cursor-pointer transition-colors duration-200 hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-disabled)] ${focus}`
const popup =
  'box-border overflow-auto rounded-[var(--vtg-column-settings-radius)] bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] text-[length:var(--vtg-table-font-size)] font-[family-name:var(--font-family-base)] font-normal leading-[var(--vtg-table-line-height)] shadow-[var(--vtg-column-settings-shadow)]'

/** ProTable's separate density menu and column-setting popover, using Ant Design tokens. */
export const columnSettingsTheme = {
  slots: {
    root: 'inline-flex items-center gap-4',
    trigger,
    densityTrigger: trigger,
    popup: `${popup} flex flex-col w-[var(--vtg-column-settings-width)] max-w-[calc(100vw-16px)] p-3`,
    densityPopup: `${popup} min-w-[80px] p-1`,
    density: `block w-full border-0 rounded-[var(--vtg-btn-border-radius-sm)] px-3 py-[5px] text-left text-[length:var(--vtg-table-font-size)] font-normal leading-[var(--vtg-table-line-height)] bg-transparent cursor-pointer hover:bg-[color:var(--color-control-item-hover-bg)] aria-checked:bg-[color:var(--color-control-item-active-bg)] aria-checked:text-[color:var(--color-primary)] ${focus}`,
    header: 'flex items-center justify-between gap-3 h-8 mb-2',
    heading: 'group inline-flex items-center gap-2 cursor-pointer font-normal',
    reset: `shrink-0 border-0 bg-transparent p-0 text-[color:var(--color-primary)] text-[length:var(--vtg-table-font-size)] font-semibold cursor-pointer hover:text-[color:var(--color-primary-hover)] ${focus}`,
    columns: 'm-0 max-h-[280px] overflow-auto list-none px-0 py-2',
    children: 'm-0 list-none pl-6',
    item: 'm-0 p-0 pb-1',
    label:
      'group flex min-h-6 items-center gap-1 pl-6 cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[color:var(--color-text-disabled)]',
    checkboxControl:
      'relative inline-flex shrink-0 h-[var(--vtg-checkbox-size)] w-[var(--vtg-checkbox-size)]',
    checkbox: `peer m-0 h-full w-full appearance-none border border-[color:var(--color-border)] rounded-[var(--vtg-checkbox-border-radius)] bg-[color:var(--color-surface)] cursor-inherit transition-colors duration-300 checked:bg-[color:var(--color-primary)] checked:border-[color:var(--color-primary)] group-hover:enabled:border-[color:var(--color-primary)] group-hover:enabled:checked:bg-[color:var(--color-primary-hover)] group-hover:enabled:checked:border-transparent disabled:bg-[color:var(--color-bg-disabled)] disabled:border-[color:var(--color-border)] ${focus}`,
    checkMark: `${antdvCheckboxTheme.slots.checkMark} peer-disabled:border-[color:var(--color-text-disabled)]`,
    indeterminateMark: antdvCheckboxTheme.slots.indeterminateMark,
    labelText: 'min-w-0 flex-1 truncate px-1',
    empty: 'py-2 text-[color:var(--color-muted)]',
  },
} as const satisfies ThemeConfig

export const elementPlusColumnSettingsTheme = {
  ...columnSettingsTheme,
  slots: {
    ...columnSettingsTheme.slots,
    popup: `${columnSettingsTheme.slots.popup} border border-[color:var(--color-border)]`,
    densityPopup: `${columnSettingsTheme.slots.densityPopup} border border-[color:var(--color-border)]`,
    checkbox: `${columnSettingsTheme.slots.checkbox} indeterminate:bg-[color:var(--color-primary)] indeterminate:border-[color:var(--color-primary)]`,
    checkMark: `${elementPlusCheckboxTheme.slots.checkMark} peer-disabled:border-[color:var(--color-text-placeholder)]`,
    indeterminateMark: elementPlusCheckboxTheme.slots.indeterminateMark,
  },
} as const satisfies ThemeConfig

export type ColumnSettingsThemeConfig = typeof columnSettingsTheme
export type ColumnSettingsSlots = keyof ColumnSettingsThemeConfig['slots']

export function resolveColumnSettingsThemePreset(name: ThemePresetName = 'antdv') {
  return name === 'element-plus' ? elementPlusColumnSettingsTheme : columnSettingsTheme
}

export const columnSettingsZhCN = {
  title: '列设置',
  reset: '重置',
  density: '表格密度',
  large: '宽松',
  middle: '中等',
  small: '紧凑',
  columns: '列展示',
  empty: '暂无可配置列',
} as const satisfies VTableGuildColumnSettingsLocale

export const columnSettingsEnUS = {
  title: 'Column settings',
  reset: 'Reset',
  density: 'Density',
  large: 'Larger',
  middle: 'Middle',
  small: 'Compact',
  columns: 'Column display',
  empty: 'No configurable columns',
} as const satisfies VTableGuildColumnSettingsLocale
