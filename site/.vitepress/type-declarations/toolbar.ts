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

export interface TableToolbarProps<TRecord extends object = Record<string, unknown>> {
  title?: VNodeChild
  columns?: TableColumnsType<TRecord>
  size?: TableColumnSettingsSize
  options?: false | TableToolbarOptions
  loading?: boolean
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
}

export interface TableToolbarSlots<TRecord extends object = Record<string, unknown>> {
  title?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  actions?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  settings?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  columnLabel?: TableColumnSettingsSlots<TRecord>['columnLabel']
}
