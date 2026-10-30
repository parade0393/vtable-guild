import {
  computed,
  getCurrentScope,
  nextTick,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import type { Key } from '../types/column'
import type {
  TableEditContext,
  TableEditAddConfig,
  TableEditError,
  TableEditValidationResult,
  UseTableEditOptions,
  UseTableEditReturn,
} from '../types/editing'
import { snapshot } from '../utils/snapshot'
import { stateEqual } from '../utils/stateEqual'

interface EditEntry<TRecord> {
  draft: TRecord
  original: TRecord | undefined
  isNew: boolean
  position: 'top' | 'bottom'
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
  const validation = shallowRef<EditOperation<TableEditValidationResult<TRecord>>>()
  const pendingSource = shallowRef<TRecord[]>()
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

  function sourceRows() {
    const rows = [...(pendingSource.value ?? toValue(options.dataSource) ?? [])]
    const keys = new Set<Key>()
    for (const record of rows) {
      const key = getKey(record)
      if (keys.has(key)) throw new Error('useTableEdit requires unique source row keys')
      keys.add(key)
    }
    return rows
  }

  function publishSource(rows: TRecord[]) {
    // A parent's v-model echo reaches child props on the next Vue render. Compose all
    // changes in that interval against the last publication, including synchronous adds.
    const previous = pendingSource.value
    const pending = rows.map(clone)
    pendingSource.value = pending
    try {
      options.onChange!(rows)
    } catch (cause) {
      if (pendingSource.value === pending) pendingSource.value = previous
      throw cause
    } finally {
      void nextTick(() => {
        if (pendingSource.value === pending) {
          pendingSource.value = undefined
          invalidateValidation()
        }
      })
    }
  }

  function invalidateValidation() {
    const operation = validation.value
    if (!operation) return
    validation.value = undefined
    operation.controller.abort()
    operation.resolve({ valid: false, errors: new Map(), obsolete: true })
  }

  function editContext(
    key: Key,
    entry: EditEntry<TRecord>,
    signal: AbortSignal,
  ): TableEditContext<TRecord> {
    return {
      key,
      original: entry.original === undefined ? undefined : clone(entry.original),
      isNew: entry.isNew,
      signal,
    }
  }

  function editorDraft(record: TRecord, key: Key, original: TRecord | undefined, isNew: boolean) {
    const draft =
      options.toDraft?.(clone(record), {
        key,
        original: original === undefined ? undefined : clone(original),
        isNew,
      }) ?? record
    if (getKey(draft) !== key) throw new Error('Converting an editor cannot change its row key')
    return clone(draft)
  }

  function submittedValue(key: Key, entry: EditEntry<TRecord>, signal: AbortSignal) {
    const draft = clone(entry.draft)
    const value = options.toValue?.(draft, editContext(key, entry, signal)) ?? draft
    if (getKey(value) !== key) {
      throw new Error('Converting a submission cannot change its row key')
    }
    return clone(value)
  }

  function compose(convert: boolean, signal = new AbortController().signal) {
    const rows = sourceRows()
    const keys = new Set(rows.map(getKey))
    const fromEntry = (key: Key, entry: EditEntry<TRecord>) =>
      convert ? submittedValue(key, entry, signal) : clone(entry.draft)
    const values = rows.map((record) => {
      const key = getKey(record)
      const entry = entries.value.get(key)
      if (convert && entry?.isNew) throw new Error('A cached new row duplicates a source row key')
      return entry ? fromEntry(key, entry) : clone(record)
    })
    const top: TRecord[] = []
    const bottom: TRecord[] = []
    for (const [key, entry] of entries.value) {
      if (keys.has(key)) continue
      const record = fromEntry(key, entry)
      if (entry.position === 'top') top.unshift(record)
      else bottom.push(record)
    }
    return [...top, ...values, ...bottom]
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
    invalidateValidation()
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
    invalidateValidation()
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

  function begin(record: TRecord, isNew: boolean, position: 'top' | 'bottom' = 'bottom') {
    if (disposed) return false
    const key = getKey(record)
    if (entries.value.has(key)) return false
    if (options.mode !== 'multiple' && entries.value.size > 0) return false
    const original = isNew ? undefined : clone(record)
    const draft = editorDraft(record, key, original, isNew)
    invalidateValidation()
    entries.value = new Map(entries.value).set(key, {
      draft,
      original,
      isNew,
      position,
    })
    return true
  }

  function add(record?: TRecord, config: TableEditAddConfig = {}) {
    if (disposed || (options.mode !== 'multiple' && entries.value.size > 0)) return false
    const rows = sourceRows()
    const sourceKeys = new Set(rows.map(getKey))
    const count =
      sourceKeys.size + [...entries.value.keys()].filter((key) => !sourceKeys.has(key)).length
    const maxRows = Number.isFinite(options.maxRows)
      ? Math.max(0, Math.floor(options.maxRows!))
      : undefined
    if (maxRows !== undefined && count >= maxRows) return false
    const next = record ?? options.createRecord?.()
    if (!next) return false
    const key = getKey(next)
    if (sourceKeys.has(key) || entries.value.has(key)) return false
    const immediate = config.mode === 'source'
    if (immediate && (options.dataSource === undefined || !options.onChange)) return false
    const position = config.position ?? 'bottom'
    if (!begin(next, !immediate, position)) return false
    if (immediate) {
      try {
        const values = rows.map(clone)
        if (position === 'top') values.unshift(clone(next))
        else values.push(clone(next))
        publishSource(values)
      } catch (cause) {
        remove(key)
        reportError(key, {
          type: 'save',
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        })
        return false
      }
    }
    return true
  }

  function setDraft(key: Key, patch: Partial<TRecord> | ((draft: TRecord) => TRecord)) {
    const entry = entries.value.get(key)
    if (disposed || !entry) return false
    const draft =
      typeof patch === 'function' ? patch(clone(entry.draft)) : { ...clone(entry.draft), ...patch }
    if (getKey(draft) !== key) throw new Error('Editing a row key is unsupported')
    invalidateValidation()
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
    invalidateValidation()
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
        const payload = submittedValue(key, { ...entry, draft: submitted }, context.signal)
        const response = await options.onSave?.(clone(payload), context)
        if (!active()) return
        if (response === false) return
        const accepted = response === true ? payload : (response ?? payload)
        if (!entry.isNew && getKey(accepted) !== key) {
          throw new Error('Saving an existing row cannot change its key')
        }
        const result = clone(accepted)
        const acceptedKey = getKey(result)
        if (acceptedKey !== key && entries.value.has(acceptedKey)) {
          throw new Error('Saving a new row cannot duplicate another draft row key')
        }
        if (options.dataSource !== undefined && options.onChange) {
          const rows = sourceRows().map(clone)
          if (
            entry.isNew &&
            rows.some((record) => getKey(record) === key || getKey(record) === acceptedKey)
          ) {
            throw new Error('Saving a new row cannot duplicate a source row key')
          }
          const index = rows.findIndex((record) => getKey(record) === key)
          if (index >= 0) rows[index] = clone(result)
          else if (entry.position === 'top') rows.unshift(clone(result))
          else rows.push(clone(result))
          publishSource(rows)
          if (!active()) return
        }
        invalidateValidation()
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

  function validateAll(): Promise<TableEditValidationResult<TRecord>> {
    if (disposed) return Promise.resolve({ valid: false, errors: new Map(), obsolete: true })
    if (validation.value) return validation.value.promise
    const rows = compose(false)
    const sourceKeys = new Set(sourceRows().map(getKey))
    const captured = rows.map((record) => {
      const key = getKey(record)
      const entry = entries.value.get(key)
      return {
        key,
        record: clone(record),
        entry: entry
          ? {
              ...entry,
              draft: clone(entry.draft),
              original: entry.original === undefined ? undefined : clone(entry.original),
            }
          : undefined,
      }
    })
    let resolve!: (result: TableEditValidationResult<TRecord>) => void
    const promise = new Promise<TableEditValidationResult<TRecord>>((done) => {
      resolve = done
    })
    const operation = { controller: new AbortController(), promise, resolve }
    validation.value = operation
    const active = () => !disposed && validation.value === operation
    void (async () => {
      const errors = new Map<Key, TableEditError>()
      const values: TRecord[] = []
      for (const item of captured) {
        if (!active()) return
        try {
          if (item.entry?.isNew && sourceKeys.has(item.key)) {
            throw new Error('A cached new row duplicates a source row key')
          }
          const entry = item.entry ?? {
            original: clone(item.record),
            draft: editorDraft(item.record, item.key, item.record, false),
            isNew: false,
            position: 'bottom' as const,
          }
          const error = await options.validate?.(
            clone(entry.draft),
            editContext(item.key, entry, operation.controller.signal),
          )
          if (!active()) return
          if (error?.message || Object.keys(error?.fields ?? {}).length) {
            errors.set(item.key, {
              ...error,
              type: 'validation',
              message: error?.message ?? 'Validation failed',
            })
          }
        } catch (cause) {
          if (!active()) return
          errors.set(item.key, {
            type: 'validation',
            message: cause instanceof Error ? cause.message : String(cause),
            cause,
          })
        }
      }
      if (!active()) return
      if (!errors.size) {
        for (const item of captured) {
          try {
            values.push(
              item.entry
                ? submittedValue(item.key, item.entry, operation.controller.signal)
                : clone(item.record),
            )
          } catch (cause) {
            errors.set(item.key, {
              type: 'validation',
              message: cause instanceof Error ? cause.message : String(cause),
              cause,
            })
          }
          if (!active()) return
        }
      }
      if (!active()) return
      const next = new Map([...failures.value].filter(([, error]) => error.type !== 'validation'))
      for (const [key, error] of errors) next.set(key, error)
      failures.value = next
      for (const [key, error] of errors) {
        try {
          options.onError?.(snapshot(error), key)
        } catch {
          /* Observers cannot prevent settlement. */
        }
        if (!active()) return
      }
      validation.value = undefined
      operation.resolve({
        valid: errors.size === 0,
        errors: new Map(errors),
        ...(errors.size ? {} : { values: values.map(clone) }),
      })
    })()
    return promise
  }

  function reset() {
    invalidateValidation()
    pendingSource.value = undefined
    for (const key of operations.value.keys()) invalidate(key)
    for (const key of cancellations.value.keys()) invalidateCancel(key)
    entries.value = new Map()
    failures.value = new Map()
  }

  let previousSource = toValue(options.dataSource)?.map(clone)
  const stopSource =
    options.dataSource === undefined
      ? undefined
      : watch(
          () => toValue(options.dataSource),
          (records) => {
            // An authoritative source update may normalize or reject the publication.
            if (pendingSource.value) {
              pendingSource.value = undefined
              invalidateValidation()
            }
            if (stateEqual(previousSource, records)) return
            previousSource = records?.map(clone)
            invalidateValidation()
          },
          { deep: true, flush: 'sync' },
        )

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      stopSource?.()
      reset()
    })
  }

  return {
    records: computed(() => compose(false)),
    validating: computed(() => !!validation.value),
    editableKeys: computed(() => [...entries.value.keys()]),
    savingKeys: computed(() => new Set(operations.value.keys())),
    cancellingKeys: computed(() => new Set(cancellations.value.keys())),
    errors: computed(() => new Map(failures.value)),
    newRecords: computed(() => {
      const top: TRecord[] = []
      const bottom: TRecord[] = []
      for (const entry of entries.value.values()) {
        if (!entry.isNew) continue
        const record = clone(entry.draft)
        if (entry.position === 'top') top.unshift(record)
        else bottom.push(record)
      }
      return [...top, ...bottom]
    }),
    isEditing: (key) => entries.value.has(key),
    getDraft: (key) => {
      const entry = entries.value.get(key)
      return entry ? clone(entry.draft) : undefined
    },
    getOriginal: (key) => {
      const original = entries.value.get(key)?.original
      return original === undefined ? undefined : clone(original)
    },
    getDrafts: () => new Map([...entries.value].map(([key, entry]) => [key, clone(entry.draft)])),
    getValues: () => compose(true),
    validateAll,
    reset,
    start: (record) => begin(record, false),
    add,
    setDraft,
    save,
    cancel,
    cancelAll,
  }
}
