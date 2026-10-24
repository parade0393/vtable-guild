import type { VNodeChild } from 'vue'
import type { SlotProps, VTableGuildColumnSettingsLocale } from '@vtable-guild/core'
import type { ColumnSettingsThemeConfig } from '@vtable-guild/theme'
import type { ColumnsType, ColumnType, ColumnGroupType } from './column'

export type TableColumnSettingsSize = 'large' | 'middle' | 'small'

export interface TableColumnSettingsOptions {
  density?: boolean
  setting?: boolean
}

export interface TableColumnSettingsProps<TRecord extends object = Record<string, unknown>> {
  /** Controlled columns. Only visible is changed; sentinels are preserved. */
  columns: ColumnsType<TRecord>
  /** Bind the same size to VTable; otherwise follows the table theme's default density. */
  size?: TableColumnSettingsSize
  disabled?: boolean
  options?: TableColumnSettingsOptions
  locale?: Partial<VTableGuildColumnSettingsLocale>
  ui?: SlotProps<ColumnSettingsThemeConfig>
  class?: string
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement
}

export interface TableColumnSettingsSlots<TRecord extends object = Record<string, unknown>> {
  columnLabel?: (props: { column: ColumnType<TRecord> | ColumnGroupType<TRecord> }) => VNodeChild
}
