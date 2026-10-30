import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'
import type {
  CreateTableDictionaryOptions,
  TableDictionary,
  TableDictionaryOption,
  TableDictionaryResult,
  UseTableDictionaryOptions,
  UseTableDictionaryReturn,
} from '../types/dictionary'
import type { ColumnValue, ColumnValueEnumItem } from '../types/presentation'
import { snapshot } from '../utils/snapshot'
import { stateEqual } from '../utils/stateEqual'

function abortError() {
  const error = new Error('Dictionary request cancelled')
  error.name = 'AbortError'
  return error
}

function normalize(result: TableDictionaryResult, keyword: string): TableDictionaryResult {
  if (!result || !Array.isArray(result.options) || typeof result.complete !== 'boolean') {
    throw new Error('Dictionary request must return { options, complete }')
  }
  const options = new Map<ColumnValue, TableDictionaryOption>()
  for (const option of result.options) {
    if (
      !option ||
      !['string', 'number', 'boolean'].includes(typeof option.value) ||
      (typeof option.value === 'number' && !Number.isFinite(option.value)) ||
      typeof option.label !== 'string'
    ) {
      throw new Error('Dictionary options require a primitive value and a string label')
    }
    options.set(option.value, { ...option })
  }
  // A keyword search cannot stand in for the full header filter dictionary.
  return { options: [...options.values()], complete: result.complete && keyword === '' }
}

/** A cache is owned by this instance, never by a process-wide registry or a cell renderer. */
export function createTableDictionary<TParams extends object = Record<string, unknown>>(
  options: CreateTableDictionaryOptions<TParams>,
): TableDictionary<TParams> {
  if (!options.key.trim()) throw new Error('A stable dictionary key is required')
  interface Entry {
    params: Partial<TParams>
    keyword: string
    expires: number
    result?: TableDictionaryResult
    controller: AbortController
    task: Promise<TableDictionaryResult>
    pending: boolean
    users: Set<symbol>
  }
  const entries: Entry[] = []
  const cacheTime = Math.max(0, Number.isFinite(options.cacheTime) ? options.cacheTime! : 300000)
  const maxEntries = Math.max(
    1,
    Number.isFinite(options.maxEntries) ? Math.floor(options.maxEntries!) : 50,
  )
  const remove = (entry: Entry) => {
    const index = entries.indexOf(entry)
    if (index >= 0) entries.splice(index, 1)
  }
  function trim() {
    for (const entry of [...entries]) {
      if (!entry.pending && (entry.expires <= Date.now() || entries.length > maxEntries))
        remove(entry)
    }
  }
  return Object.freeze({
    key: options.key,
    invalidate() {
      entries.splice(0)
    },
    load(params, { signal, keyword, force = false }) {
      if (signal.aborted) return Promise.reject(abortError())
      trim()
      let entry = entries.find(
        (item) => item.keyword === keyword && stateEqual(item.params, params),
      )
      if (entry?.result && !force) return Promise.resolve(snapshot(entry.result))
      if (!entry?.pending) {
        if (entry) remove(entry)
        const controller = new AbortController()
        const savedParams = snapshot(params)
        const created: Entry = {
          params: savedParams,
          keyword,
          expires: 0,
          controller,
          pending: true,
          users: new Set(),
          task: Promise.resolve()
            .then(() => {
              if (controller.signal.aborted) throw abortError()
              return options.request(snapshot(savedParams), { signal: controller.signal, keyword })
            })
            .then((response) => {
              if (controller.signal.aborted) throw abortError()
              const result = normalize(response, keyword)
              created.pending = false
              created.result = result
              created.expires = Date.now() + cacheTime
              trim()
              return result
            })
            .catch((reason: unknown) => {
              created.pending = false
              remove(created)
              throw reason
            }),
        }
        entries.push(created)
        entry = created
      }
      const active = entry
      const user = Symbol()
      active.users.add(user)
      return new Promise<TableDictionaryResult>((resolve, reject) => {
        function release() {
          signal.removeEventListener('abort', cancel)
          active.users.delete(user)
          if (!active.users.size && active.pending) {
            active.controller.abort()
            remove(active)
          }
        }
        function cancel() {
          release()
          reject(abortError())
        }
        signal.addEventListener('abort', cancel, { once: true })
        active.task.then(
          (result) => {
            release()
            if (signal.aborted) reject(abortError())
            else resolve(snapshot(result))
          },
          (reason: unknown) => {
            release()
            reject(reason)
          },
        )
      })
    },
  } satisfies TableDictionary<TParams>)
}

export function useTableDictionary<TParams extends object = Record<string, unknown>>(
  options: UseTableDictionaryOptions<TParams>,
): UseTableDictionaryReturn {
  const keyword = ref(options.defaultKeyword ?? '')
  const rows = shallowRef<readonly TableDictionaryOption[]>([])
  const known = shallowRef(new Map<ColumnValue, TableDictionaryOption>())
  const complete = ref(false)
  const loading = ref(false)
  const error = shallowRef<Error | null>(null)
  let params = snapshot(toValue(options.params) ?? {}) as Partial<TParams>
  let disposed = false
  let generation = 0
  let controller: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let settle: ((success: boolean) => void) | undefined
  let activeQuery: { params: Partial<TParams>; keyword: string } | undefined
  let lastPromise = Promise.resolve(false)
  function cancel() {
    generation++
    clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
    activeQuery = undefined
    settle?.(false)
    settle = undefined
    loading.value = false
  }
  function load(immediate = false, force = false): Promise<boolean> {
    if (disposed) return Promise.resolve(false)
    if (
      controller &&
      timer === undefined &&
      activeQuery &&
      activeQuery.keyword === keyword.value &&
      stateEqual(activeQuery.params, params)
    )
      return lastPromise
    cancel()
    const id = generation
    const abort = new AbortController()
    controller = abort
    const savedParams = snapshot(params)
    const savedKeyword = keyword.value
    activeQuery = { params: savedParams, keyword: savedKeyword }
    loading.value = true
    complete.value = false
    error.value = null
    lastPromise = new Promise<boolean>((resolve) => {
      settle = resolve
      const execute = async () => {
        timer = undefined
        try {
          const result = await options.dictionary.load(savedParams, {
            keyword: savedKeyword,
            signal: abort.signal,
            force,
          })
          if (disposed || id !== generation) return
          rows.value = result.options
          complete.value = result.complete
          const labels = result.complete
            ? new Map<ColumnValue, TableDictionaryOption>()
            : new Map(known.value)
          for (const option of result.options) labels.set(option.value, option)
          known.value = labels
          resolve(true)
        } catch (reason) {
          if (!disposed && id === generation && !abort.signal.aborted) {
            error.value = reason instanceof Error ? reason : new Error(String(reason))
            try {
              options.onError?.(error.value)
            } catch (callbackReason) {
              error.value =
                callbackReason instanceof Error ? callbackReason : new Error(String(callbackReason))
            }
          }
          resolve(false)
        } finally {
          if (id === generation) {
            loading.value = false
            controller = undefined
            settle = undefined
          }
        }
      }
      const delay = immediate ? 0 : Math.max(0, options.debounceTime ?? 0)
      if (delay) timer = setTimeout(() => void execute(), delay)
      else void execute()
    })
    return lastPromise
  }
  const stop = watch(
    () => toValue(options.params),
    (value) => {
      if (stateEqual(params, value ?? {})) return
      params = snapshot(value ?? {}) as Partial<TParams>
      keyword.value = ''
      known.value = new Map()
      rows.value = []
      void load()
    },
    { deep: true },
  )
  if (getCurrentScope())
    onScopeDispose(() => {
      disposed = true
      stop()
      cancel()
    })
  if (!options.manualRequest) void load()
  return {
    options: computed(() => rows.value),
    valueEnum: computed(() => {
      const labels = new Map<ColumnValue, ColumnValueEnumItem>()
      for (const option of [...(toValue(options.selectedOptions) ?? []), ...known.value.values()]) {
        labels.set(option.value, { text: option.label, status: option.status })
      }
      return labels
    }),
    filters: computed(() =>
      complete.value ? rows.value.map(({ value, label }) => ({ value, text: label })) : [],
    ),
    complete: computed(() => complete.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    keyword: computed(() => keyword.value),
    search(value) {
      keyword.value = value
      return load()
    },
    reload: () => load(true, true),
    cancel,
  }
}
