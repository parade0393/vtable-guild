import {
  computed,
  getCurrentScope,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  unref,
  watch,
} from 'vue'
import type { TableFiltersInfo, VTableSorterResult } from '../types/table'
import type {
  TableRequestParams,
  TableRequestSort,
  UseTableRequestOptions,
  UseTableRequestReturn,
} from '../types/request'
import { positiveInteger } from './usePagination'
import { snapshot } from '../utils/snapshot'
import { stateEqual as equal } from '../utils/stateEqual'

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
  const refreshing = ref(false)
  const paused = ref(false)
  const error = shallowRef<Error | null>(null)
  const manual = Object.freeze({ sort: true, filter: true, pagination: true })

  let disposed = false
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let settle: (() => void) | undefined
  let previous: unknown
  let lastPromise: Promise<void> = Promise.resolve()
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let visibilityTimer: ReturnType<typeof setTimeout> | undefined
  let started = false
  let loaded = false
  let backgroundRequest = false
  const scoped = !!getCurrentScope()

  function clearSchedule() {
    clearTimeout(pollTimer)
    clearTimeout(visibilityTimer)
    pollTimer = undefined
    visibilityTimer = undefined
  }

  function canRefresh() {
    return (
      scoped &&
      typeof document !== 'undefined' &&
      !disposed &&
      started &&
      !paused.value &&
      (options.pollingWhenHidden || document.visibilityState !== 'hidden')
    )
  }

  function reportError(reason: unknown) {
    error.value = reason instanceof Error ? reason : new Error(String(reason))
    try {
      options.onError?.(error.value)
    } catch (callbackReason) {
      error.value =
        callbackReason instanceof Error ? callbackReason : new Error(String(callbackReason))
    }
  }

  function schedule() {
    clearSchedule()
    if (!canRefresh() || controller || (error.value && !options.pollingOnError)) return
    const polling = unref(options.polling)
    let interval: number | false | undefined
    try {
      interval = typeof polling === 'function' ? polling(snapshot(dataSource.value)) : polling
    } catch (reason) {
      reportError(reason)
      return
    }
    if (typeof interval !== 'number' || !Number.isFinite(interval) || interval <= 0) return
    pollTimer = setTimeout(
      () => {
        pollTimer = undefined
        if (canRefresh()) void request(true, true, true, true)
      },
      Math.max(2000, interval),
    )
  }

  function abortRequest() {
    clearSchedule()
    generation++
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    controller?.abort()
    controller = undefined
    settle?.()
    settle = undefined
    loading.value = false
    refreshing.value = false
    previous = undefined
  }

  function pause() {
    paused.value = true
    clearSchedule()
    if (controller && backgroundRequest) abortRequest()
  }

  function cancel() {
    paused.value = true
    abortRequest()
  }

  function request(
    force = false,
    immediate = false,
    background = false,
    mergeActive = false,
  ): Promise<void> {
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
      abortRequest()
      reportError(reason)
      return Promise.resolve()
    }
    const sort = snapshot(activeSort.value)
    const filters = snapshot(activeFilters.value)
    const next = snapshot({ params, sort, filters })
    // A manual reload and an automatic trigger may arrive in the same frame.
    // Promote a debounced request immediately, but share an already running identical one.
    if (mergeActive && controller && timer === undefined && equal(previous, next))
      return lastPromise
    if (!force && previous !== undefined && equal(previous, next)) return lastPromise

    abortRequest()
    started = true
    backgroundRequest = background
    previous = next
    const id = generation
    const abort = new AbortController()
    controller = abort
    refreshing.value = background && loaded
    loading.value = !refreshing.value
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
            loaded = true
            previous = snapshot({ params: { ...params, current: current.value }, sort, filters })
            options.onLoad?.(rows, response)
            break
          }
        } catch (reason) {
          if (!disposed && id === generation && !abort.signal.aborted) {
            previous = undefined
            reportError(reason)
          }
        } finally {
          if (id === generation) {
            loading.value = false
            refreshing.value = false
            controller = undefined
            settle = undefined
            schedule()
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
  const stopRefresh = watch(
    () => [unref(options.polling), toValue(options.revalidateOnFocus)],
    schedule,
  )
  function onVisibilityChange() {
    clearSchedule()
    if (!canRefresh()) return
    if (document.visibilityState === 'visible' && toValue(options.revalidateOnFocus)) {
      // Coalesce visibility events with a synchronous user reload.
      visibilityTimer = setTimeout(() => {
        visibilityTimer = undefined
        if (canRefresh() && !controller) void request(true, true, true, true)
      }, 0)
    } else schedule()
  }
  // Automatic work is browser-only and scoped; ordinary request use remains SSR-compatible.
  if (getCurrentScope() && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      stop()
      stopRefresh()
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisibilityChange)
      cancel()
    })
  }

  if (!options.manualRequest) void request()

  return {
    dataSource,
    loading: computed(() => loading.value),
    refreshing: computed(() => refreshing.value),
    paused: computed(() => paused.value),
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
      return request(true, true, false, true)
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
    pause,
    resume(immediate = false) {
      paused.value = false
      if (immediate && canRefresh()) return request(true, true, true, true)
      schedule()
      return Promise.resolve()
    },
  }
}
