import type { VNodeChild } from 'vue'
import type { SlotProps, VTableGuildToolbarLocale } from '@vtable-guild/core'
import type { ToolbarThemeConfig } from '@vtable-guild/theme'
import type { ColumnsType } from './column'
import type {
  TableColumnSettingsOptions,
  TableColumnSettingsProps,
  TableColumnSettingsSize,
  TableColumnSettingsSlots,
} from './column-settings'

export interface TableToolbarOptions extends TableColumnSettingsOptions {
  reload?: boolean
  fullScreen?: boolean
}

export interface TableToolbarSearchConfig {
  placeholder?: string
  clearable?: boolean
}

export interface TableToolbarProps<TRecord extends object = Record<string, unknown>> {
  title?: VNodeChild
  /** Bind the same columns and size to VTable. Omit columns to hide column settings. */
  columns?: ColumnsType<TRecord>
  size?: TableColumnSettingsSize
  /** Defaults to reload, density and column settings; full screen is opt-in. */
  options?: false | TableToolbarOptions
  loading?: boolean
  /** Search is opt-in. Search text is controlled by searchValue. */
  search?: boolean | TableToolbarSearchConfig
  searchValue?: string
  /** Put the filter slot in a full-width second row. The extra slot always gets its own row. */
  multipleLine?: boolean
  /** Disables built-in actions. Custom slots receive this state. */
  disabled?: boolean
  fullscreenTarget?: () => HTMLElement | null | undefined
  columnSettings?: Pick<
    TableColumnSettingsProps<TRecord>,
    'locale' | 'ui' | 'class' | 'getPopupContainer'
  >
  locale?: Partial<VTableGuildToolbarLocale>
  ui?: SlotProps<ToolbarThemeConfig>
  class?: string
}

export interface TableToolbarSlotProps<TRecord extends object = Record<string, unknown>> {
  columns: ColumnsType<TRecord>
  size: TableColumnSettingsSize
  loading: boolean
  disabled: boolean
  fullscreen: boolean
  fullscreenAvailable: boolean
  reload: () => void
  toggleFullscreen: () => Promise<void>
  searchValue: string
  updateSearchValue: (value: string) => void
  submitSearch: (value?: string) => void
  clearSearch: () => void
}

export interface TableToolbarSlots<TRecord extends object = Record<string, unknown>> {
  title?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  actions?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  settings?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  search?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  filter?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  extra?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  columnLabel?: TableColumnSettingsSlots<TRecord>['columnLabel']
}
