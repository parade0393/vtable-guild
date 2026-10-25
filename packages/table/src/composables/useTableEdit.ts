import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue'
import type { Key } from '../types/column'
import type {
  TableEditContext,
  TableEditError,
  UseTableEditOptions,
  UseTableEditReturn,
} from '../types/editing'
import { snapshot } from '../utils/snapshot'

interface EditEntry<TRecord> {
  draft: TRecord
  original: TRecord | undefined
  isNew: boolean
}

interface EditOperation<TResult> {
  controller: AbortController
  promise: Promise<TResult>
  resolve: (record: TResult) => void
}

/** Row drafts and validation without coupling the table to a form or HTTP library. */
export function useTableEdit<TRecord extends object>(
  options: UseTableEditOptions<TRecord>,
): UseTableEditReturn<TRecord> {
  const entries = shallowRef(new Map<Key, EditEntry<TRecord>>())
  const failures = shallowRef(new Map<Key, TableEditError>())
  const operations = shallowRef(new Map<Key, EditOperation<TRecord | undefined>>())
  const cancellations = shallowRef(new Map<Key, EditOperation<boolean>>())
  const clone = options.clone ?? ((record: TRecord) => snapshot(record))
  let disposed = false

  function getKey(record: TRecord): Key {
    const key =
      typeof options.rowKey === 'function' ? options.rowKey(record) : record[options.rowKey]
    if (typeof key !== 'string' && typeof key !== 'number') {
      throw new Error('useTableEdit requires a string or number row key')
    }
    return key
  }

  function clearError(key: Key) {
    if (!failures.value.has(key)) return
    const next = new Map(failures.value)
    next.delete(key)
    failures.value = next
  }

  function reportError(key: Key, error: TableEditError) {
    failures.value = new Map(failures.value).set(key, error)
    try {
      options.onError?.(error, key)
    } catch {
      // Error observers cannot prevent an edit operation from settling and releasing loading state.
    }
  }

  function invalidate(key: Key) {
    const operation = operations.value.get(key)
    if (!operation) return
    operation.controller.abort()
    const next = new Map(operations.value)
    next.delete(key)
    operations.value = next
    operation.resolve(undefined)
  }

  function invalidateCancel(key: Key) {
    const operation = cancellations.value.get(key)
    if (!operation) return
    operation.controller.abort()
    const next = new Map(cancellations.value)
    next.delete(key)
    cancellations.value = next
    operation.resolve(false)
  }

  function remove(key: Key) {
    invalidate(key)
    invalidateCancel(key)
    const next = new Map(entries.value)
    next.delete(key)
    entries.value = next
    clearError(key)
  }

  function cancel(key: Key): Promise<boolean> {
    const existing = cancellations.value.get(key)
    if (existing) return existing.promise
    const entry = entries.value.get(key)
    if (disposed || !entry) return Promise.resolve(false)
    invalidate(key)
    clearError(key)
    if (!options.onCancel) {
      remove(key)
      return Promise.resolve(true)
    }
    let resolve!: (value: boolean) => void
    const promise = new Promise<boolean>((done) => {
      resolve = done
    })
    const operation = { controller: new AbortController(), promise, resolve }
    cancellations.value = new Map(cancellations.value).set(key, operation)
    const active = () => !disposed && cancellations.value.get(key) === operation
    void (async () => {
      try {
        const result = await options.onCancel!(clone(entry.draft), {
          key,
          original: entry.original === undefined ? undefined : clone(entry.original),
          isNew: entry.isNew,
          signal: operation.controller.signal,
        })
        if (!active()) return
        if (result === false) return
        operation.resolve(true)
        remove(key)
      } catch (cause) {
        if (!active()) return
        const error: TableEditError = {
          type: 'cancel',
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        }
        reportError(key, error)
      } finally {
        if (active()) {
          const next = new Map(cancellations.value)
          next.delete(key)
          cancellations.value = next
        }
        operation.resolve(false)
      }
    })()
    return promise
  }

  function cancelAll() {
    return Promise.all([...entries.value.keys()].map(cancel))
  }

  function begin(record: TRecord, isNew: boolean) {
    if (disposed) return false
    const key = getKey(record)
    if (entries.value.has(key)) return false
    if (options.mode !== 'multiple' && entries.value.size > 0) return false
    entries.value = new Map(entries.value).set(key, {
      draft: clone(record),
      original: isNew ? undefined : clone(record),
      isNew,
    })
    return true
  }

  function setDraft(key: Key, patch: Partial<TRecord> | ((draft: TRecord) => TRecord)) {
    const entry = entries.value.get(key)
    if (disposed || !entry) return false
    const draft =
      typeof patch === 'function' ? patch(clone(entry.draft)) : { ...clone(entry.draft), ...patch }
    if (getKey(draft) !== key) throw new Error('Editing a row key is unsupported')
    invalidate(key)
    invalidateCancel(key)
    clearError(key)
    entries.value = new Map(entries.value).set(key, { ...entry, draft: clone(draft) })
    return true
  }

  function save(key: Key): Promise<TRecord | undefined> {
    const existing = operations.value.get(key)
    if (existing) return existing.promise
    const entry = entries.value.get(key)
    if (disposed || !entry || cancellations.value.has(key)) return Promise.resolve(undefined)
    clearError(key)
    let resolve!: (record: TRecord | undefined) => void
    const promise = new Promise<TRecord | undefined>((done) => {
      resolve = done
    })
    const operation = { controller: new AbortController(), promise, resolve }
    operations.value = new Map(operations.value).set(key, operation)
    const active = () => !disposed && operations.value.get(key) === operation
    const context: TableEditContext<TRecord> = {
      key,
      original: entry.original === undefined ? undefined : clone(entry.original),
      isNew: entry.isNew,
      signal: operation.controller.signal,
    }
    const report = (error: TableEditError) => {
      if (!active()) return
      reportError(key, error)
    }
    void (async () => {
      let stage: 'validation' | 'save' = 'validation'
      try {
        const submitted = clone(entry.draft)
        const validation = await options.validate?.(clone(submitted), context)
        if (!active()) return
        if (validation?.message || Object.keys(validation?.fields ?? {}).length > 0) {
          report({
            ...validation,
            type: 'validation',
            message: validation?.message ?? 'Validation failed',
          })
          return
        }
        stage = 'save'
        const response = await options.onSave?.(clone(submitted), context)
        if (!active()) return
        if (response === false) return
        const accepted = response === true ? submitted : (response ?? submitted)
        if (!entry.isNew && getKey(accepted) !== key) {
          throw new Error('Saving an existing row cannot change its key')
        }
        const result = clone(accepted)
        const next = new Map(entries.value)
        next.delete(key)
        entries.value = next
        clearError(key)
        operation.resolve(result)
      } catch (cause) {
        report({
          type: stage,
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        })
      } finally {
        if (active()) {
          const next = new Map(operations.value)
          next.delete(key)
          operations.value = next
        }
        operation.resolve(undefined)
      }
    })()
    return promise
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      for (const key of entries.value.keys()) remove(key)
    })
  }

  return {
    editableKeys: computed(() => [...entries.value.keys()]),
    savingKeys: computed(() => new Set(operations.value.keys())),
    cancellingKeys: computed(() => new Set(cancellations.value.keys())),
    errors: computed(() => new Map(failures.value)),
    newRecords: computed(() =>
      [...entries.value.values()].filter((entry) => entry.isNew).map((entry) => clone(entry.draft)),
    ),
    isEditing: (key) => entries.value.has(key),
    getDraft: (key) => {
      const entry = entries.value.get(key)
      return entry ? clone(entry.draft) : undefined
    },
    start: (record) => begin(record, false),
    add: (record) => begin(record, true),
    setDraft,
    save,
    cancel,
    cancelAll,
  }
}
