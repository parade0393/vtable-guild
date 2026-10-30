import type {
  TableQueryProps,
  TableQueryField,
  TableQueryColumn,
  TableQueryInstance,
} from './query-form'
import type { TableControls } from './controls'
import { useTableQuery } from '../composables/useTableQuery'
import { deriveTableQueryFields } from '../utils/queryFields'

interface Values {
  name: string
  range?: [string, string]
}
const fields: TableQueryField<Values>[] = [{ name: 'name', valueType: 'text' }]
// @ts-expect-error Query names remain keyed to the form values.
const invalidField: TableQueryField<Values> = { name: 'missing' }
const columns: TableQueryColumn<Values>[] = [
  {
    dataIndex: 'name',
    visible: false,
    query: { name: 'range', valueType: 'dateRange', hidden: false },
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
