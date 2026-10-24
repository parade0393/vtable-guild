import type { VNodeChild } from 'vue'
import type {
  TableColumnsType,
  ColumnType,
  ColumnGroupType,
  SlotProps,
  ColumnSettingsThemeConfig,
  VTableGuildColumnSettingsLocale,
} from '@vtable-guild/vtable-guild'

// #region TableColumnSettingsSize
export type TableColumnSettingsSize = 'large' | 'middle' | 'small'
// #endregion TableColumnSettingsSize

// #region TableColumnSettingsOptions
export interface TableColumnSettingsOptions {
  density?: boolean
  setting?: boolean
  fixed?: boolean
  draggable?: boolean
}
// #endregion TableColumnSettingsOptions

// #region TableColumnSettingsProps
export interface TableColumnSettingsProps<TRecord extends object = Record<string, unknown>> {
  columns: TableColumnsType<TRecord>
  size?: TableColumnSettingsSize
  disabled?: boolean
  options?: TableColumnSettingsOptions
  locale?: Partial<VTableGuildColumnSettingsLocale>
  ui?: SlotProps<ColumnSettingsThemeConfig>
  class?: string
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement
}
// #endregion TableColumnSettingsProps

// #region TableColumnSettingsSlots
export interface TableColumnSettingsSlots<TRecord extends object = Record<string, unknown>> {
  columnLabel?: (props: { column: ColumnType<TRecord> | ColumnGroupType<TRecord> }) => VNodeChild
}
// #endregion TableColumnSettingsSlots
