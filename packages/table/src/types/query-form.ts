import type { MaybeRefOrGetter, VNodeChild } from 'vue'
import type { QuerySlots } from '@vtable-guild/theme'
import type { ColumnGroupType, ColumnType } from './column'
import type { ColumnSentinel } from '../constants'
import type { TableDictionaryOption, TableDictionaryBinding } from './dictionary'
import type { TableControls, TableControlContext } from './controls'
import type { UseTableQueryReturn } from './query'

export interface TableQueryFieldContext<TValues extends object> {
  values: Readonly<TValues>
  field: TableQueryField<TValues>
}

/** Query metadata is independent from table visibility, ordering and readonly field formatting. */
export interface TableQueryField<TValues extends object = Record<string, unknown>> {
  name: keyof TValues & string
  label?: VNodeChild
  valueType?: string
  order?: number
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
      query?: false | (Omit<TableQueryField<TValues>, 'name'> & { name?: keyof TValues & string })
    })
  | (Omit<ColumnGroupType<TRecord>, 'children'> & {
      children: TableQueryColumn<TRecord, TValues>[]
      query?: false
    })
  | ColumnSentinel

export interface TableQueryLocale {
  label: string
  submit: string
  reset: string
  expand: string
  collapse: string
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
> {
  query: UseTableQueryReturn<TValues, TParams>
  /** Use div when an existing host Form wraps this query area, avoiding nested forms. */
  rootTag?: 'form' | 'div'
  fields: readonly TableQueryField<TValues>[]
  controls: TableControls
  layout?: 'form' | 'light'
  /** Explicit opt-in for light layout only. Form layout always waits for submit. */
  autoSubmit?: boolean
  debounceTime?: number
  /** Only schema-hidden fields are omitted; collapsing the layout never changes parameters. */
  hiddenPolicy?: 'preserve' | 'omit'
  collapsedCount?: number
  collapsible?: boolean
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

export interface TableQueryFieldSlotProps<TValues extends object = Record<string, unknown>> {
  field: TableQueryField<TValues>
  values: Readonly<TValues>
  control: TableControlContext
}

export interface TableQueryActionSlotProps {
  submit: () => Promise<boolean>
  reset: () => Promise<boolean>
  submitting: boolean
  collapsed: boolean
  toggleCollapsed: () => void
}

export interface TableQuerySlots<TValues extends object = Record<string, unknown>> {
  field?: (props: TableQueryFieldSlotProps<TValues>) => VNodeChild
  actions?: (props: TableQueryActionSlotProps) => VNodeChild
}

export interface TableQueryInstance {
  submit: () => Promise<boolean>
  reset: () => Promise<boolean>
  /** Cancel a pending auto-submit or host validation, retaining form values. */
  cancel: () => void
}
