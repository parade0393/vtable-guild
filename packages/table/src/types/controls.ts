import type { Component, VNodeChild } from 'vue'
import type { TableDictionaryOption } from './dictionary'

/** Keys registered by both host control factories; enum aliases select and money uses InputNumber. */
export type TableBuiltinControlValueType =
  | 'text'
  | 'select'
  | 'enum'
  | 'digit'
  | 'money'
  | 'date'
  | 'dateRange'
  | 'dateTime'
  | 'dateTimeRange'
  | 'time'

/** Suggest built-in control keys while accepting custom keys from the controls registry. */
export type TableControlValueType = TableBuiltinControlValueType | (string & Record<never, never>)

/** Shared by schema query fields and editable cells; host libraries remain optional. */
export interface TableControlContext {
  value: unknown
  onChange: (value: unknown) => void
  onSearch?: (keyword: string) => void
  fieldProps: Record<string, unknown>
  options: readonly TableDictionaryOption[]
  disabled: boolean
  readonly: boolean
  loading: boolean
  error?: string
  id?: string
  name?: string
  mode: 'query' | 'edit'
}
export type TableControlRenderer = (context: TableControlContext) => VNodeChild
export type TableControls = Readonly<Record<string, TableControlRenderer>>

/** Pass components already installed by the host application. No UI library is imported here. */
export interface TableControlComponents {
  Input: Component
  Select: Component
  InputNumber: Component
  DatePicker: Component
  RangePicker?: Component
  TimePicker?: Component
  /** Element Plus ElOption; unused by the Ant Design Vue adapter. */
  Option?: Component
}
