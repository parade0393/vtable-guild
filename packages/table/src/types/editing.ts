import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { Key } from './column'

export interface TableEditContext<TRecord extends object> {
  key: Key
  /** Snapshot from start(); undefined for a cached addition until it is saved. */
  original: TRecord | undefined
  isNew: boolean
  signal: AbortSignal
}

export type TableEditDraftContext<TRecord extends object> = Omit<
  TableEditContext<TRecord>,
  'signal'
>

export interface TableEditAddConfig {
  position?: 'top' | 'bottom'
  /** Cache until saved (default), or immediately insert into the controlled source. */
  mode?: 'cache' | 'source'
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

export interface TableEditValidationResult<TRecord extends object> {
  valid: boolean
  /** Submitted snapshots from this validation; absent for failures or obsolete work. */
  values?: TRecord[]
  errors: ReadonlyMap<Key, TableEditError>
  obsolete?: boolean
}

export interface UseTableEditOptions<TRecord extends object> {
  /** A stable key is required; row indexes are intentionally unsupported. */
  rowKey: keyof TRecord | ((record: TRecord) => Key)
  /** Defaults to single. Starting another row in single mode returns false. */
  mode?: 'single' | 'multiple'
  /** Override when records contain mutable class instances. */
  clone?: (record: TRecord) => TRecord
  /** Optional controlled source. Parent updates never replace an open local draft. */
  dataSource?: MaybeRefOrGetter<readonly TRecord[]>
  /** Commit notifications only; draft keystrokes never write back into the source. */
  onChange?: (records: TRecord[]) => void
  /** Convert a source record once when opening its editor. */
  toDraft?: (record: TRecord, context: TableEditDraftContext<TRecord>) => TRecord
  /** Convert an editor snapshot when saving or obtaining submitted values. */
  toValue?: (draft: TRecord, context: TableEditContext<TRecord>) => TRecord
  /** Used by add() when no explicit record is supplied. */
  createRecord?: () => TRecord
  /** Maximum client-held rows, including cached additions. Finite limits round down to an integer. */
  maxRows?: number
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
  /** Controlled source overlaid with local drafts and positioned cached additions. */
  records: ComputedRef<TRecord[]>
  validating: ComputedRef<boolean>
  editableKeys: ComputedRef<readonly Key[]>
  savingKeys: ComputedRef<ReadonlySet<Key>>
  cancellingKeys: ComputedRef<ReadonlySet<Key>>
  errors: ComputedRef<ReadonlyMap<Key, TableEditError>>
  /** Unsaved cache-mode additions. Source-mode additions are committed through onChange. */
  newRecords: ComputedRef<TRecord[]>
  isEditing: (key: Key) => boolean
  /** Returns an isolated copy. Use setDraft() to apply changes. */
  getDraft: (key: Key) => TRecord | undefined
  /** Source snapshot captured when editing began; undefined for cached additions or missing sessions. */
  getOriginal: (key: Key) => TRecord | undefined
  getDrafts: () => ReadonlyMap<Key, TRecord>
  /** Source records plus converted draft snapshots; never calls onSave or onChange. */
  getValues: () => TRecord[]
  /** Validate all client-held rows, including unmounted virtual rows, without saving. */
  validateAll: () => Promise<TableEditValidationResult<TRecord>>
  /** Abort operations and discard drafts/errors, retaining the current controlled source. */
  reset: () => void
  start: (record: TRecord) => boolean
  add: (record?: TRecord, config?: TableEditAddConfig) => boolean
  setDraft: (key: Key, patch: Partial<TRecord> | ((draft: TRecord) => TRecord)) => boolean
  /** Resolves undefined on validation/save failure, cancellation, or disposal. */
  save: (key: Key) => Promise<TRecord | undefined>
  cancel: (key: Key) => Promise<boolean>
  cancelAll: () => Promise<boolean[]>
}
