import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'
import type { TableFiltersInfo, VTableSorterResult } from '../types/table'
import type {
  TableRequestParams,
  TableRequestSort,
  UseTableRequestOptions,
  UseTableRequestReturn,
} from '../types/request'
import { positiveInteger } from './usePagination'
import { snapshot } from '../utils/snapshot'

function equal(a: unknown, b: unknown, seen = new WeakMap<object, WeakSet<object>>()): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
  if (Object.getPrototypeOf(a) !== Object.prototype && !Array.isArray(a)) return false
  if (seen.get(a)?.has(b)) return true
  const matches = seen.get(a) ?? new WeakSet<object>()
  seen.set(a, matches)
  matches.add(b)
  const left = Object.entries(a)
  const right = Object.entries(b)
  return (
    left.length === right.length &&
    left.every(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(b, key) && equal(value, Reflect.get(b, key), seen),
    )
  )
}

function normalizeSort<TRecord extends object>(
  sorter: VTableSorterResult<TRecord>,
): TableRequestSort {
  const entries: Array<[string, 'ascend' | 'descend']> = []
  for (const item of Array.isArray(sorter) ? sorter : [sorter]) {
    if (!item.order) continue
    const field = item.field ?? item.columnKey
    if (field === undefined || field === null) continue
    entries.push([Array.isArray(field) ? field.join('.') : String(field), item.order])
  }
  return Object.fromEntries(entries)
}

/** Optional server request orchestration. Bind onChange once and pass manual to VTable. */
export function useTableRequest<
  TRecord extends object,
  TParams extends object = Record<string, unknown>,
>(options: UseTableRequestOptions<TRecord, TParams>): UseTableRequestReturn<TRecord, TParams> {
  const defaults = snapshot(options.defaultParams ?? {}) as Partial<TParams>
  const submitted = shallowRef<Partial<TParams>>(snapshot(defaults))
  const activeSort = shallowRef<TableRequestSort>({})
  const activeFilters = shallowRef<TableFiltersInfo>({})
  const current = ref(positiveInteger(options.initialPagination?.current, 1))
  const pageSize = ref(positiveInteger(options.initialPagination?.pageSize, 10))
  const total = ref(Math.max(0, options.initialPagination?.total ?? 0))
  const dataSource = shallowRef<TRecord[]>([])
  const loading = ref(false)
  const error = shallowRef<Error | null>(null)
  const manual = Object.freeze({ sort: true, filter: true, pagination: true })

  let disposed = false
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let settle: (() => void) | undefined
  let previous: unknown
  let lastPromise: Promise<void> = Promise.resolve()

  function cancel() {
    generation++
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
    settle?.()
    settle = undefined
    loading.value = false
    previous = undefined
  }

  function request(force = false, immediate = false): Promise<void> {
    if (disposed) return Promise.resolve()
    let params: TableRequestParams<TParams>
    try {
      const values = snapshot({ ...defaults, ...submitted.value, ...toValue(options.params) })
      params = {
        ...(options.beforeSearchSubmit?.(values) ?? values),
        current: current.value,
        pageSize: pageSize.value,
      }
    } catch (reason) {
      cancel()
      error.value = reason instanceof Error ? reason : new Error(String(reason))
      options.onError?.(error.value)
      return Promise.resolve()
    }
    const sort = snapshot(activeSort.value)
    const filters = snapshot(activeFilters.value)
    const next = snapshot({ params, sort, filters })
    if (!force && previous !== undefined && equal(previous, next)) return lastPromise

    cancel()
    previous = next
    const id = generation
    const abort = new AbortController()
    controller = abort
    loading.value = true
    error.value = null
    lastPromise = new Promise<void>((resolve) => {
      settle = resolve
      const execute = async () => {
        timer = undefined
        try {
          // One fallback request handles deleting the last remote page, without a retry loop.
          for (let attempt = 0; attempt < 2; attempt++) {
            const response = await options.request(params, sort, filters, { signal: abort.signal })
            if (disposed || id !== generation || abort.signal.aborted) return
            if (response.success === false) throw new Error('Table request was unsuccessful')
            if (!Array.isArray(response.data))
              throw new Error('Table request data must be an array')
            if (!Number.isSafeInteger(response.total) || response.total < 0) {
              throw new Error('Table request total must be a non-negative safe integer')
            }
            const lastPage = Math.max(1, Math.ceil(response.total / params.pageSize))
            if (attempt === 0 && response.total > 0 && params.current > lastPage) {
              current.value = lastPage
              params = { ...params, current: lastPage }
              continue
            }
            const rows = options.postData ? options.postData(response.data) : response.data
            if (!Array.isArray(rows)) throw new Error('Table postData must return an array')
            current.value = Math.min(params.current, lastPage)
            total.value = response.total
            dataSource.value = rows
            previous = snapshot({ params: { ...params, current: current.value }, sort, filters })
            options.onLoad?.(rows, response)
            break
          }
        } catch (reason) {
          if (!disposed && id === generation && !abort.signal.aborted) {
            error.value = reason instanceof Error ? reason : new Error(String(reason))
            previous = undefined
            options.onError?.(error.value)
          }
        } finally {
          if (id === generation) {
            loading.value = false
            controller = undefined
            settle = undefined
          }
          resolve()
        }
      }
      const delay = immediate ? 0 : Math.max(0, options.debounceTime ?? 0)
      if (delay > 0) timer = setTimeout(() => void execute(), delay)
      else void execute()
    })
    return lastPromise
  }

  const onChange: UseTableRequestReturn<TRecord, TParams>['onChange'] = (
    filters,
    sorter,
    extra,
  ) => {
    if (extra.action === 'select') return
    const size = positiveInteger(extra.pagination?.pageSize, pageSize.value)
    const sizeChanged = size !== pageSize.value
    activeSort.value = normalizeSort(sorter)
    activeFilters.value = snapshot(filters)
    current.value =
      extra.action !== 'paginate' || (sizeChanged && options.resetOnPageSizeChange !== false)
        ? 1
        : positiveInteger(extra.pagination?.current, current.value)
    pageSize.value = size
    void request()
  }

  let extraParams = snapshot(toValue(options.params))
  const stop = watch(
    () => toValue(options.params),
    (value) => {
      if (equal(extraParams, value)) return
      extraParams = snapshot(value)
      current.value = 1
      void request()
    },
    { deep: true },
  )
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      stop()
      cancel()
    })
  }

  if (!options.manualRequest) void request()

  return {
    dataSource,
    loading: computed(() => loading.value),
    error,
    pagination: computed(() => ({
      ...options.pagination,
      current: current.value,
      pageSize: pageSize.value,
      total: total.value,
    })),
    query: computed(() => submitted.value),
    sort: computed(() => activeSort.value),
    filters: computed(() => activeFilters.value),
    manual,
    onChange,
    reload(resetPageIndex = false) {
      if (resetPageIndex) current.value = 1
      return request(true, true)
    },
    submit(params = {}) {
      submitted.value = snapshot(params)
      current.value = 1
      return request(true)
    },
    reset(params = defaults) {
      submitted.value = snapshot(params)
      activeSort.value = {}
      activeFilters.value = {}
      current.value = 1
      return request(true)
    },
    cancel,
  }
}
