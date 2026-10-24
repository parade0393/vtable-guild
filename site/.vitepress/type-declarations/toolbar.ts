import type { VNodeChild } from 'vue'
import type {
  TableColumnsType,
  TableColumnSettingsProps,
  TableColumnSettingsOptions,
  TableColumnSettingsSize,
  TableColumnSettingsSlots,
  SlotProps,
  ToolbarThemeConfig,
  VTableGuildToolbarLocale,
} from '@vtable-guild/vtable-guild'

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
  columns?: TableColumnsType<TRecord>
  size?: TableColumnSettingsSize
  options?: false | TableToolbarOptions
  loading?: boolean
  search?: boolean | TableToolbarSearchConfig
  searchValue?: string
  multipleLine?: boolean
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
  columns: TableColumnsType<TRecord>
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
