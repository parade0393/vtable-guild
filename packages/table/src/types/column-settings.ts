import type { VNodeChild } from 'vue'
import type { SlotProps, VTableGuildColumnSettingsLocale } from '@vtable-guild/core'
import type { ColumnSettingsThemeConfig } from '@vtable-guild/theme'
import type { ColumnsType, ColumnType, ColumnGroupType } from './column'

export type TableColumnSettingsSize = 'large' | 'middle' | 'small'

export interface TableColumnSettingsOptions {
  density?: boolean
  setting?: boolean
  /** Allow changing top-level columns/groups between left, center and right. */
  fixed?: boolean
  /** Top-level columns/groups can be moved inside their fixed region. */
  draggable?: boolean
}

export interface TableColumnSettingsProps<TRecord extends object = Record<string, unknown>> {
  /** Controlled columns; visibility, pinning and top-level ordering can be changed. */
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
