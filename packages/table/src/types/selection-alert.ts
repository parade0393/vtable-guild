import type { VNodeChild } from 'vue'
import type { SlotProps, VTableGuildSelectionAlertLocale } from '@vtable-guild/core'
import type { SelectionAlertThemeConfig } from '@vtable-guild/theme'
import type { Key } from './column'

export interface TableSelectionAlertProps<TRecord extends object = Record<string, unknown>> {
  /** Controlled selected keys. Count comes from keys, including unloaded remote records. */
  selectedRowKeys: readonly Key[]
  /** Available selected records; this may be shorter than selectedRowKeys. */
  selectedRows?: readonly TRecord[]
  alwaysShow?: boolean
  disabled?: boolean
  loading?: boolean
  showClear?: boolean
  locale?: Partial<VTableGuildSelectionAlertLocale>
  ui?: SlotProps<SelectionAlertThemeConfig>
  class?: string
}

export interface TableSelectionAlertSlotProps<TRecord extends object = Record<string, unknown>> {
  selectedRowKeys: readonly Key[]
  selectedRows: readonly TRecord[]
  count: number
  disabled: boolean
  loading: boolean
  clear: () => void
}

export interface TableSelectionAlertSlots<TRecord extends object = Record<string, unknown>> {
  info?: (props: TableSelectionAlertSlotProps<TRecord>) => VNodeChild
  actions?: (props: TableSelectionAlertSlotProps<TRecord>) => VNodeChild
}
