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

export interface TableToolbarProps<TRecord extends object = Record<string, unknown>> {
  title?: VNodeChild
  /** Bind the same columns and size to VTable. Omit columns to hide column settings. */
  columns?: ColumnsType<TRecord>
  size?: TableColumnSettingsSize
  /** Defaults to reload, density and column settings; full screen is opt-in. */
  options?: false | TableToolbarOptions
  loading?: boolean
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
}

export interface TableToolbarSlots<TRecord extends object = Record<string, unknown>> {
  title?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  actions?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  settings?: (props: TableToolbarSlotProps<TRecord>) => VNodeChild
  columnLabel?: TableColumnSettingsSlots<TRecord>['columnLabel']
}
