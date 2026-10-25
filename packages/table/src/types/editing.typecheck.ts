import { useTableEdit } from '../composables/useTableEdit'
import type { UseTableEditOptions, UseTableEditReturn } from './editing'

interface EditableRow {
  id: number
  name: string
}

export const editOptions: UseTableEditOptions<EditableRow> = {
  rowKey: 'id',
  mode: 'multiple',
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
  void [_keys, _saving, _savingPromise, _cancelPromise, _draft]
  edit.setDraft(1, { name: 'Name' })
  // @ts-expect-error Draft fields retain their record types.
  edit.setDraft(1, { name: 1 })
  // @ts-expect-error Editing keys are derived from active sessions.
  edit.editableKeys.value = []
}

export const inferredEditing = useTableEdit(editOptions)

export const invalidEditing: UseTableEditOptions<EditableRow> = {
  // @ts-expect-error String keys must belong to the record.
  rowKey: 'missing',
}
