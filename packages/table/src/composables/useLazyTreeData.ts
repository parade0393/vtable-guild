import { computed, getCurrentScope, onScopeDispose, shallowRef, watch } from 'vue'
import type { Key } from '../types/column'
import type { TableTreeLoadData } from '../types/tree'

interface Loaded<TRecord> {
  record: TRecord
  children: TRecord[]
}

/** Immutable lazy children shared by sorting, selection, pagination and tree flattening. */
export function useLazyTreeData<TRecord extends Record<string, unknown>>(options: {
  data: () => TRecord[]
  loadData: () => TableTreeLoadData<TRecord> | undefined
  isLeaf: () => ((record: TRecord) => boolean) | undefined
  childrenColumnName: () => string | undefined
  getRowKey: (record: TRecord, index: number) => Key
  onLoadError?: (error: Error, record: TRecord) => void
}) {
  const loaded = shallowRef(new Map<Key, Loaded<TRecord>>())
  const errors = shallowRef(new Map<Key, Error>())
  const loadingKeys = shallowRef(new Set<Key>())
  const pending = new Map<
    Key,
    {
      record: TRecord
      controller: AbortController
      promise: Promise<boolean>
      resolve: (value: boolean) => void
    }
  >()
  const sourceRecords = new WeakMap<TRecord, TRecord>()
  let disposed = false
  const field = computed(() => options.childrenColumnName() ?? 'children')
  const records = computed(() => {
    const result = new Map<Key, TRecord>()
    let index = 0
    function walk(rows: TRecord[]) {
      for (const row of rows) {
        const key = options.getRowKey(row, index++)
        result.set(key, row)
        const cached = loaded.value.get(key)
        const children = row[field.value] ?? (cached?.record === row ? cached.children : undefined)
        if (Array.isArray(children)) walk(children)
      }
    }
    if (options.loadData()) walk(options.data())
    return result
  })
  function cancel(key: Key, abort = true) {
    const entry = pending.get(key)
    if (abort) {
      entry?.controller.abort()
      entry?.resolve(false)
    }
    pending.delete(key)
    loadingKeys.value = new Set([...loadingKeys.value].filter((item) => item !== key))
  }
  let previousRecords = records.value
  watch(
    records,
    (current) => {
      const nextLoaded = new Map(loaded.value)
      for (const [key, entry] of nextLoaded) {
        if (current.get(key) !== entry.record || Array.isArray(entry.record[field.value]))
          nextLoaded.delete(key)
      }
      if (nextLoaded.size !== loaded.value.size) loaded.value = nextLoaded
      for (const [key, entry] of pending) {
        if (current.get(key) !== entry.record || Array.isArray(entry.record[field.value]))
          cancel(key)
      }
      errors.value = new Map(
        [...errors.value].filter(([key]) => {
          const record = current.get(key)
          return (
            record !== undefined &&
            record === previousRecords.get(key) &&
            !Array.isArray(record[field.value])
          )
        }),
      )
      previousRecords = current
    },
    { flush: 'sync' },
  )

  const data = computed(() => {
    if (!options.loadData()) return options.data()
    let index = 0
    function merge(rows: TRecord[]): TRecord[] {
      return rows.map((row) => {
        const key = options.getRowKey(row, index++)
        const cached = loaded.value.get(key)
        const children = row[field.value] ?? (cached?.record === row ? cached.children : undefined)
        if (!Array.isArray(children)) return row
        const result = { ...row, [field.value]: merge(children) }
        sourceRecords.set(result, row)
        return result
      })
    }
    return merge(options.data())
  })

  function hasChildren(record: TRecord) {
    const children = record[field.value]
    if (Array.isArray(children)) return children.length > 0
    return !!options.loadData() && options.isLeaf()?.(sourceRecords.get(record) ?? record) !== true
  }

  function load(record: TRecord, index: number): Promise<boolean> {
    const source = sourceRecords.get(record) ?? record
    const key = options.getRowKey(source, index)
    if (disposed || !options.loadData() || !hasChildren(record)) return Promise.resolve(false)
    return loadKey(source, key)
  }

  function loadKey(source: TRecord, key: Key): Promise<boolean> {
    if (Array.isArray(source[field.value]) || loaded.value.get(key)?.record === source)
      return Promise.resolve(true)
    const active = pending.get(key)
    if (active) return active.promise
    const controller = new AbortController()
    const request = options.loadData()!
    let resolve!: (value: boolean) => void
    const cancelled = new Promise<boolean>((done) => {
      resolve = done
    })
    const entry = { record: source, controller, promise: Promise.resolve(false), resolve }
    pending.set(key, entry)
    loadingKeys.value = new Set([...loadingKeys.value, key])
    const nextErrors = new Map(errors.value)
    nextErrors.delete(key)
    errors.value = nextErrors
    const operation = Promise.resolve().then(async () => {
      if (disposed || controller.signal.aborted || pending.get(key) !== entry) return false
      try {
        const children = await request(source, { signal: controller.signal })
        if (
          disposed ||
          controller.signal.aborted ||
          records.value.get(key) !== source ||
          Array.isArray(source[field.value])
        )
          return false
        if (!Array.isArray(children)) throw new Error('Tree loadData must return an array')
        loaded.value = new Map(loaded.value).set(key, { record: source, children })
        return true
      } catch (reason) {
        if (disposed || controller.signal.aborted || records.value.get(key) !== source) return false
        const error = reason instanceof Error ? reason : new Error(String(reason))
        errors.value = new Map(errors.value).set(key, error)
        try {
          void Promise.resolve(options.onLoadError?.(error, source)).catch(() => {
            // Error observers must not turn a handled load failure into a rejected request.
          })
        } catch {
          // Keep the original load error and boolean result when a synchronous observer throws.
        }
        return false
      } finally {
        if (pending.get(key) === entry) cancel(key, false)
      }
    })
    entry.promise = Promise.race([operation, cancelled])
    return entry.promise
  }

  watch(
    [options.loadData, field],
    () => {
      for (const key of pending.keys()) cancel(key)
      loaded.value = new Map()
      errors.value = new Map()
    },
    { flush: 'sync' },
  )
  if (getCurrentScope())
    onScopeDispose(() => {
      disposed = true
      for (const key of pending.keys()) cancel(key)
    })

  return {
    data,
    hasChildren,
    load,
    isLoading: (key: Key) => loadingKeys.value.has(key),
    getError: (key: Key) => errors.value.get(key),
    retry(key: Key) {
      const record = records.value.get(key)
      return record && !disposed && options.loadData() && hasChildren(record)
        ? loadKey(record, key)
        : Promise.resolve(false)
    },
  }
}
