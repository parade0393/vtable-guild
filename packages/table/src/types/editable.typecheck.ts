import { useTableEditable } from '../composables/useTableEditable'
import type { TableColumnEditor, UseTableEditableOptions } from './editable'
import type { TableControlContext, TableControls } from './controls'

interface Row {
  id: number
  profile: { name: string }
  amount: number
}
export const editorContract: TableColumnEditor<Row> = {
  disabled: ({ draft, original }) => draft.amount === 0 || original?.amount === 0,
  onValueChange: () => ({ amount: 1 }),
  validate: async (value, { signal }) => (signal.aborted || value ? undefined : 'Required'),
}
export const controlsContract: TableControls = {
  text: ({ value }: TableControlContext) => String(value ?? ''),
}
export const editableOptionsContract: UseTableEditableOptions<Row> = {
  rowKey: 'id',
  controls: controlsContract,
  columns: [{ dataIndex: ['profile', 'name'], editor: editorContract }],
  createRecord: () => ({ id: -1, profile: { name: '' }, amount: 1 }),
}
export function editableContract() {
  const edit = useTableEditable(editableOptionsContract)
  const _original: Row | undefined = edit.getOriginal(1)
  const _validation = edit.validateAll()
  const _field = edit.getCell({
    record: { id: 1, profile: { name: 'A' }, amount: 1 },
    column: { dataIndex: 'amount', editor: {} },
  })
  void [_original, _validation, _field]
  const _invalid: UseTableEditableOptions<Row> = {
    // @ts-expect-error Row keys must belong to the business record.
    rowKey: 'missing',
    columns: [],
    controls: controlsContract,
  }
  void _invalid
}
