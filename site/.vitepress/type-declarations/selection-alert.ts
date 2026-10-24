import type { VNodeChild } from 'vue'
import type {
  Key,
  SlotProps,
  SelectionAlertThemeConfig,
  VTableGuildSelectionAlertLocale,
} from '@vtable-guild/vtable-guild'

export interface TableSelectionAlertProps<TRecord extends object = Record<string, unknown>> {
  selectedRowKeys: readonly Key[]
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
