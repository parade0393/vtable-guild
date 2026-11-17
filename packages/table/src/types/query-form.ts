import type { CSSProperties, MaybeRefOrGetter, VNodeChild } from 'vue'
import type { QuerySlots } from '@vtable-guild/theme'
import type { ColumnGroupType, ColumnType } from './column'
import type { ColumnSentinel } from '../constants'
import type { TableDictionaryOption, TableDictionaryBinding } from './dictionary'
import type { TableControls, TableControlContext, TableControlValueType } from './controls'
import type { UseTableQueryReturn } from './query'

export interface TableQueryFieldContext<TValues extends object> {
  values: Readonly<TValues>
  field: TableQueryField<TValues>
}

/** Query metadata is independent from table visibility, ordering and readonly field formatting. */
export interface TableQueryField<TValues extends object = Record<string, unknown>> {
  name: keyof TValues & string
  label?: VNodeChild
  /** Select a registered host control; missing or unregistered keys fall back to text. */
  valueType?: TableControlValueType
  /** Larger values appear first, independently of table column order. */
  order?: number
  /** QueryFilter grid units; one unit occupies the configured span. */
  colSize?: number
  /** LightFilter fields collected inside More filters. */
  secondary?: boolean
  hidden?: boolean | ((context: TableQueryFieldContext<TValues>) => boolean)
  disabled?: boolean | ((context: TableQueryFieldContext<TValues>) => boolean)
  readonly?: boolean | ((context: TableQueryFieldContext<TValues>) => boolean)
  fieldProps?:
    | Record<string, unknown>
    | ((context: TableQueryFieldContext<TValues>) => Record<string, unknown>)
  options?: MaybeRefOrGetter<readonly TableDictionaryOption[]>
  dictionary?: TableDictionaryBinding
}

export type TableQueryColumn<TRecord extends object, TValues extends object = TRecord> =
  | (ColumnType<TRecord> & {
      search?: false | (Omit<TableQueryField<TValues>, 'name'> & { name?: keyof TValues & string })
      hideInSearch?: boolean
    })
  | (Omit<ColumnGroupType<TRecord>, 'children'> & {
      children: TableQueryColumn<TRecord, TValues>[]
      search?: false
      hideInSearch?: boolean
    })
  | ColumnSentinel

export interface TableQueryLocale {
  label: string
  submit: string
  reset: string
  expand: string
  collapse: string
  more: string
  confirm: string
  clear: string
  validationFailed: string
}

export interface TableQueryValidationContext<TValues extends object> {
  fields: readonly TableQueryField<TValues>[]
  action: 'submit' | 'reset'
  signal: AbortSignal
}

export interface TableQueryProps<
  TValues extends object = Record<string, unknown>,
  TParams extends object = TValues,
  TRecord extends object = TValues,
> {
  query: UseTableQueryReturn<TValues, TParams>
  /** Use div when an existing host Form wraps this query area, avoiding nested forms. */
  rootTag?: 'form' | 'div'
  /** Explicit fields take precedence over columns. */
  fields?: readonly TableQueryField<TValues>[]
  columns?: readonly TableQueryColumn<TRecord, TValues>[]
  controls: TableControls
  layoutType?: 'QueryFilter' | 'LightFilter'
  layout?: 'horizontal' | 'inline' | 'vertical'
  span?: number | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>>
  /** Maximum controls in the collapsed row, limited by its grid capacity. */
  defaultColsNumber?: number
  /** Overrides defaultColsNumber and permits a collapsed area containing multiple rows. */
  defaultFormItemsNumber?: number
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  collapseRender?: boolean | ((collapsed: boolean) => VNodeChild)
  optionRender?:
    | boolean
    | ((context: TableQueryActionSlotProps, buttons: VNodeChild[]) => VNodeChild)
  searchText?: string
  resetText?: string
  labelWidth?: number | 'auto'
  searchGutter?: number | [number, number]
  split?: boolean
  /** Keep hidden fields registered and include their values in submissions. Defaults to true. */
  preserve?: boolean
  showHiddenNum?: boolean
  submitter?: false | TableQuerySubmitter
  submitterColSpanProps?: { span: number; offset?: number; class?: string; style?: CSSProperties }
  /** LightFilter: collect every field in the filter popup. */
  collapse?: boolean
  collapseLabel?: VNodeChild
  footerRender?: false | ((context: TableQueryFooterContext<TValues>) => VNodeChild)
  getPopupContainer?: (anchor: HTMLElement) => HTMLElement | string
  disabled?: boolean
  /** Connect a host form's validate here. false or an exception prevents query submission. */
  validate?: (
    values: Readonly<TValues>,
    context: TableQueryValidationContext<TValues>,
  ) => boolean | void | Promise<boolean | void>
  errors?: Readonly<Partial<Record<keyof TValues & string, string>>>
  locale?: Partial<TableQueryLocale>
  ui?: Partial<Record<QuerySlots, string>>
  class?: string
}

export interface TableQuerySubmitter {
  searchConfig?: { submitText?: string; resetText?: string }
  submitButtonProps?: false | Record<string, unknown>
  resetButtonProps?: false | Record<string, unknown>
  render?: false | ((context: TableQueryActionSlotProps, buttons: VNodeChild[]) => VNodeChild)
}

export interface TableQueryFooterContext<TValues extends object = Record<string, unknown>> {
  values: Readonly<TValues>
  fields: readonly TableQueryField<TValues>[]
  confirm: () => Promise<boolean>
  clear: () => Promise<boolean>
  submitting: boolean
}

export interface TableQueryFieldSlotProps<TValues extends object = Record<string, unknown>> {
  field: TableQueryField<TValues>
  values: Readonly<TValues>
  control: TableControlContext
  layoutType: 'QueryFilter' | 'LightFilter'
}

export interface TableQueryActionSlotProps {
  submit: () => Promise<boolean>
  reset: () => Promise<boolean>
  submitting: boolean
  collapsed: boolean
  toggleCollapsed: () => void
  showCollapseButton: boolean
}

export interface TableQuerySlots<TValues extends object = Record<string, unknown>> {
  field?: (props: TableQueryFieldSlotProps<TValues>) => VNodeChild
  actions?: (props: TableQueryActionSlotProps) => VNodeChild
}

export interface TableQueryInstance {
  submit: () => Promise<boolean>
  reset: () => Promise<boolean>
  /** Cancel pending host validation, retaining form values. */
  cancel: () => void
}
