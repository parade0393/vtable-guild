import type {
  TableQueryProps,
  TableQueryField,
  TableQueryColumn,
  TableQueryInstance,
} from './query-form'
import type { TableBuiltinControlValueType, TableControls, TableControlValueType } from './controls'
import type { TableColumnEditor, TableEditableCellContext } from './editable'
import { useTableQuery } from '../composables/useTableQuery'
import { createAntdvTableControls, createElementPlusTableControls } from '../controls'
import { deriveTableQueryFields } from '../utils/queryFields'

interface Values {
  name: string
  range?: [string, string]
}

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

// Control hints remain shared while factory registries support dynamic string lookups.
export type ControlValueTypeContract = [
  Assert<Equal<TableControls, ReturnType<typeof createAntdvTableControls>>>,
  Assert<Equal<TableControls, ReturnType<typeof createElementPlusTableControls>>>,
  Assert<Equal<NonNullable<TableQueryField<Values>['valueType']>, TableControlValueType>>,
  Assert<Equal<NonNullable<TableColumnEditor<Values>['valueType']>, TableControlValueType>>,
  Assert<Equal<TableEditableCellContext<Values>['valueType'], TableControlValueType>>,
  Assert<string extends TableControlValueType ? true : false>,
]

export const customQueryField: TableQueryField<Values> = { name: 'name', valueType: 'memberPicker' }
export const customColumnEditor: TableColumnEditor<Values> = { valueType: 'memberPicker' }
// @ts-expect-error A business registry key is valid as a control type, but is not built in.
const _invalidBuiltinControl: TableBuiltinControlValueType = 'memberPicker'
// @ts-expect-error Control keys remain strings, including when custom types are allowed.
const _invalidControlValueType: TableControlValueType = 1
void [_invalidBuiltinControl, _invalidControlValueType]

const fields: TableQueryField<Values>[] = [{ name: 'name', valueType: 'text' }]
// @ts-expect-error Query names remain keyed to the form values.
const invalidField: TableQueryField<Values> = { name: 'missing' }
const columns: TableQueryColumn<Values>[] = [
  {
    dataIndex: 'name',
    visible: false,
    search: { name: 'range', valueType: 'dateRange', hidden: false },
  },
]
const query = useTableQuery<Values>({ defaultValues: { name: '' } })
export const queryProps: TableQueryProps<Values> = { query, fields, controls: {} as TableControls }
export const derivedFields = deriveTableQueryFields(columns)
export function instanceContract(instance: TableQueryInstance) {
  const result: Promise<boolean> = instance.submit()
  void [result, invalidField]
  query.submit({ omitFields: ['range'] })
  // @ts-expect-error Hidden field omission retains the form's keys.
  query.submit({ omitFields: ['missing'] })
}
