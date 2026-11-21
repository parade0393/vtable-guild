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
  /** Present when the renderer is used inside a LightFilter popup. */
  lightFilter?: {
    grouped: boolean
    getPopupContainer: () => HTMLElement
  }
}

export interface TableControlLightFilterOptions {
  /** Selected value summary in the filter trigger. */
  formatValue?: (context: TableControlContext) => VNodeChild
  /** Submit changes immediately for standalone fields. Grouped edits always require confirmation. */
  submitOnChange?: boolean
  /** Defaults to true for standalone fields that submit immediately. */
  closeOnChange?: boolean | ((context: TableControlContext) => boolean)
}

export type TableControlRenderer = ((context: TableControlContext) => VNodeChild) & {
  lightFilter?: TableControlLightFilterOptions
}

/** Optional form renderer metadata on a controls registry. */
export const TABLE_QUERY_FORM_ADAPTER = Symbol('table-query-form-adapter')

export interface TableQueryFormAdapter {
  kind: 'antdv' | 'element-plus'
  Form: Component
  FormItem: Component
  Button?: Component
}

export type TableControls = Readonly<
  Record<string, TableControlRenderer> & { [TABLE_QUERY_FORM_ADAPTER]?: TableQueryFormAdapter }
>

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
  /** Provide both Form and FormItem to enable native query form rendering. */
  Form?: Component
  FormItem?: Component
  /** Use the host button for native query form actions. */
  Button?: Component
}
