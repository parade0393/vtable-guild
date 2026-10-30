import { useTableEdit } from '../composables/useTableEdit'
import type { TableEditValidationResult, UseTableEditOptions, UseTableEditReturn } from './editing'

interface EditableRow {
  id: number
  name: string
}

export const editOptions: UseTableEditOptions<EditableRow> = {
  rowKey: 'id',
  mode: 'multiple',
  dataSource: () => [{ id: 1, name: 'Source' }],
  onChange: (records) => {
    const _rows: EditableRow[] = records
    void _rows
  },
  createRecord: () => ({ id: -1, name: '' }),
  maxRows: 20,
  toDraft: (record, { original, isNew }) => {
    const _original: EditableRow | undefined = original
    const _isNew: boolean = isNew
    void [_original, _isNew]
    return record
  },
  toValue: (draft, { signal }) => {
    const _signal: AbortSignal = signal
    void _signal
    return draft
  },
  validate: (draft, { original, signal }) => {
    const _name: string = draft.name
    const _original: EditableRow | undefined = original
    const _signal: AbortSignal = signal
    void [_name, _original, _signal]
    return draft.name ? undefined : { fields: { name: 'Required' } }
  },
  onSave: async (draft, { key, isNew }) => {
    const _key: string | number = key
    const _isNew: boolean = isNew
    void [_key, _isNew]
    return draft
  },
  onCancel: async (draft) => {
    const _row: EditableRow = draft
    void _row
  },
}

export function editingContract(edit: UseTableEditReturn<EditableRow>) {
  const _keys: readonly (string | number)[] = edit.editableKeys.value
  const _saving: ReadonlySet<string | number> = edit.savingKeys.value
  const _savingPromise: Promise<EditableRow | undefined> = edit.save(1)
  const _cancelPromise: Promise<boolean> = edit.cancel(1)
  const _draft: EditableRow | undefined = edit.getDraft(1)
  const _original: EditableRow | undefined = edit.getOriginal(1)
  const _records: EditableRow[] = edit.records.value
  const _drafts: ReadonlyMap<string | number, EditableRow> = edit.getDrafts()
  const _values: EditableRow[] = edit.getValues()
  const _validation: Promise<TableEditValidationResult<EditableRow>> = edit.validateAll()
  const _validating: boolean = edit.validating.value
  edit.add(undefined, { position: 'top', mode: 'cache' })
  edit.add({ id: -2, name: '' }, { mode: 'source' })
  edit.reset()
  void [
    _keys,
    _saving,
    _savingPromise,
    _cancelPromise,
    _draft,
    _original,
    _records,
    _drafts,
    _values,
    _validation,
    _validating,
  ]
  edit.setDraft(1, { name: 'Name' })
  // @ts-expect-error Draft fields retain their record types.
  edit.setDraft(1, { name: 1 })
  // @ts-expect-error Editing keys are derived from active sessions.
  edit.editableKeys.value = []
  // @ts-expect-error Full draft maps cannot be assigned through the readonly contract.
  edit.getDrafts().set(1, { id: 1, name: 'Invalid write' })
  // @ts-expect-error Positions stay limited to the explicit insertion contract.
  edit.add({ id: -3, name: '' }, { position: 'middle' })
}

export const inferredEditing = useTableEdit(editOptions)

export const invalidEditing: UseTableEditOptions<EditableRow> = {
  // @ts-expect-error String keys must belong to the record.
  rowKey: 'missing',
}
