import type { MaybeRefOrGetter, VNodeChild } from 'vue'
import type { ColumnType, ColumnsType, CustomRenderContext, Key } from './column'
import type { TableControls, TableControlContext } from './controls'
import type { TableDictionaryOption, TableDictionaryBinding } from './dictionary'
import type { UseTableEditOptions, UseTableEditReturn } from './editing'

export interface TableEditableFieldContext<TRecord extends object> {
  key: Key
  name: string
  column: ColumnType<TRecord>
  draft: TRecord
  original?: TRecord
  value: unknown
  isNew: boolean
}
export interface TableColumnEditor<TRecord extends object> {
  valueType?: string
  editable?: boolean | ((context: TableEditableFieldContext<TRecord>) => boolean)
  readonly?: boolean | ((context: TableEditableFieldContext<TRecord>) => boolean)
  disabled?: boolean | ((context: TableEditableFieldContext<TRecord>) => boolean)
  fieldProps?:
    | Record<string, unknown>
    | ((context: TableEditableFieldContext<TRecord>) => Record<string, unknown>)
  options?: MaybeRefOrGetter<readonly TableDictionaryOption[]>
  dictionary?: TableDictionaryBinding
  /** Once when starting an editor, never on each render. */
  convertValue?: (value: unknown, context: TableEditableFieldContext<TRecord>) => unknown
  /** Applied to a draft snapshot for saving/getValues, without rewriting the editor value. */
  transform?: (value: unknown, context: TableEditableFieldContext<TRecord>) => unknown
  validate?: (
    value: unknown,
    context: TableEditableFieldContext<TRecord> & { signal: AbortSignal },
  ) => string | void | Promise<string | void>
  /** A linked-field patch after the current field changes. */
  onValueChange?: (
    value: unknown,
    context: TableEditableFieldContext<TRecord>,
  ) => Partial<TRecord> | void
}
export interface TableEditableCellContext<TRecord extends object> extends TableControlContext {
  key: Key
  column: ColumnType<TRecord>
  draft: TRecord
  valueType: string
}
export interface UseTableEditableOptions<TRecord extends object> extends Omit<
  UseTableEditOptions<TRecord>,
  'toDraft' | 'toValue'
> {
  columns: MaybeRefOrGetter<ColumnsType<TRecord>>
  controls: MaybeRefOrGetter<TableControls>
  ui?: Partial<Record<'editCell' | 'editControl' | 'editError', string>>
}
export interface UseTableEditableReturn<
  TRecord extends object,
> extends UseTableEditReturn<TRecord> {
  getCell: (
    context: Pick<CustomRenderContext<TRecord>, 'record' | 'column'>,
  ) => TableEditableCellContext<TRecord> | undefined
  /** Return from bodyCell; undefined retains VTable's normal readonly rendering. */
  renderEditor: (context: CustomRenderContext<TRecord>) => VNodeChild
}
