import type { ComputedRef } from 'vue'
import type { Key } from './column'

export interface TableEditContext<TRecord extends object> {
  key: Key
  /** Snapshot from start(); undefined for a newly added row. */
  original: TRecord | undefined
  isNew: boolean
  signal: AbortSignal
}

export interface TableEditValidationErrors {
  message?: string
  /** Field names or business-defined nested field paths. */
  fields?: Record<string, string>
}

export interface TableEditError extends TableEditValidationErrors {
  type: 'validation' | 'save' | 'cancel'
  message: string
  cause?: unknown
}

export interface UseTableEditOptions<TRecord extends object> {
  /** A stable key is required; row indexes are intentionally unsupported. */
  rowKey: keyof TRecord | ((record: TRecord) => Key)
  /** Defaults to single. Starting another row in single mode returns false. */
  mode?: 'single' | 'multiple'
  /** Override when records contain mutable class instances. */
  clone?: (record: TRecord) => TRecord
  /** Return errors to keep the draft open, or void to continue saving. */
  validate?: (
    draft: TRecord,
    context: TableEditContext<TRecord>,
  ) => TableEditValidationErrors | void | Promise<TableEditValidationErrors | void>
  /** Return a canonical record, true/void to accept, or false to keep editing. Business updates dataSource. */
  onSave?: (
    draft: TRecord,
    context: TableEditContext<TRecord>,
  ) => TRecord | void | boolean | Promise<TRecord | void | boolean>
  /** Returning false or rejecting keeps the draft open. Cancellation aborts a pending save first. */
  onCancel?: (
    draft: TRecord,
    context: TableEditContext<TRecord>,
  ) => void | boolean | Promise<void | boolean>
  onError?: (error: TableEditError, key: Key) => void
}

export interface UseTableEditReturn<TRecord extends object> {
  editableKeys: ComputedRef<readonly Key[]>
  savingKeys: ComputedRef<ReadonlySet<Key>>
  cancellingKeys: ComputedRef<ReadonlySet<Key>>
  errors: ComputedRef<ReadonlyMap<Key, TableEditError>>
  /** Unsaved new rows. Compose these with dataSource; add() does not mutate the source. */
  newRecords: ComputedRef<TRecord[]>
  isEditing: (key: Key) => boolean
  /** Returns an isolated copy. Use setDraft() to apply changes. */
  getDraft: (key: Key) => TRecord | undefined
  start: (record: TRecord) => boolean
  add: (record: TRecord) => boolean
  setDraft: (key: Key, patch: Partial<TRecord> | ((draft: TRecord) => TRecord)) => boolean
  /** Resolves undefined on validation/save failure, cancellation, or disposal. */
  save: (key: Key) => Promise<TRecord | undefined>
  cancel: (key: Key) => Promise<boolean>
  cancelAll: () => Promise<boolean[]>
}
