import { effectScope, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTableRequest } from './useTableRequest'
import type { TableRequestResult, UseTableRequestOptions } from '../types/request'
import type { TableChangeExtra, VTableSorterResult } from '../types/table'

interface Row {
  key: number
  name: string
}
interface Params {
  keyword: string
  tenant: string
  bounds: { start: number }
}
const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.useRealTimers()
})

function setup(options: UseTableRequestOptions<Row, Params>) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useTableRequest(options))!
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function response(key = 1, total = 50): TableRequestResult<Row> {
  return { data: [{ key, name: `Record ${key}` }], total }
}
async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}
function change(
  hook: ReturnType<typeof setup>,
  current: number,
  action: TableChangeExtra<Row>['action'] = 'paginate',
  pageSize = 10,
  sorter: VTableSorterResult<Row> = {
    column: undefined,
    columnKey: undefined,
    field: undefined,
    order: null,
  },
) {
  hook.onChange({}, sorter, {
    action,
    pagination: { current, pageSize, total: 50 },
    currentDataSource: [],
  })
}

describe('useTableRequest', () => {
  it('automatically loads once, returns manual configuration and keeps view options', async () => {
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request, pagination: { showSizeChanger: true } })
    expect(hook.loading.value).toBe(true)
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][0]).toEqual({ current: 1, pageSize: 10 })
    expect(request.mock.calls[0][3].signal).toBeInstanceOf(AbortSignal)
    await flush()
    expect(hook.manual).toEqual({ sort: true, filter: true, pagination: true })
    expect(hook.dataSource.value).toEqual(response().data)
    expect(hook.pagination.value).toMatchObject({
      current: 1,
      pageSize: 10,
      total: 50,
      showSizeChanger: true,
    })
    expect(hook.pagination.value.onChange).toBeUndefined()
    expect(hook.loading.value).toBe(false)
  })

  it('supports manual first load and reload awaits the request', async () => {
    const pending = deferred<TableRequestResult<Row>>()
    const request = vi.fn().mockReturnValue(pending.promise)
    const hook = setup({ request, manualRequest: true })
    expect(request).not.toHaveBeenCalled()
    let done = false
    const loading = hook.reload().then(() => {
      done = true
    })
    await flush()
    expect(done).toBe(false)
    pending.resolve(response())
    await loading
    expect(done).toBe(true)
    expect(hook.loading.value).toBe(false)
  })

  it('deduplicates table changes and ignores selection without modifying query state', async () => {
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request })
    await flush()
    change(hook, 2)
    change(hook, 2)
    change(hook, 1, 'select')
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
    expect(hook.pagination.value.current).toBe(2)
  })

  it('ignores a stale response even when the HTTP client ignores AbortSignal', async () => {
    const first = deferred<TableRequestResult<Row>>()
    const second = deferred<TableRequestResult<Row>>()
    const request = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const hook = setup({ request })
    const firstSignal = request.mock.calls[0][3].signal as AbortSignal
    change(hook, 2)
    expect(firstSignal.aborted).toBe(true)
    second.resolve(response(2))
    await flush()
    first.resolve(response(1))
    await flush()
    expect(hook.dataSource.value[0].key).toBe(2)
    expect(hook.pagination.value.current).toBe(2)
    expect(hook.error.value).toBeNull()
  })

  it('keeps total and records during loading and ignores stale failures', async () => {
    const stale = deferred<TableRequestResult<Row>>()
    const latest = deferred<TableRequestResult<Row>>()
    const onError = vi.fn()
    const request = vi
      .fn()
      .mockResolvedValueOnce(response(1, 120))
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(latest.promise)
    const hook = setup({ request, onError })
    await flush()
    change(hook, 2)
    expect(hook.pagination.value.total).toBe(120)
    expect(hook.dataSource.value[0].key).toBe(1)
    change(hook, 3)
    stale.reject(new Error('obsolete'))
    await flush()
    expect(hook.loading.value).toBe(true)
    expect(onError).not.toHaveBeenCalled()
    latest.resolve(response(3, 120))
    await flush()
    expect(hook.loading.value).toBe(false)
  })

  it('retries once at the new last page after deleting the remote last page', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(response(1, 15))
      .mockResolvedValueOnce(response(11, 15))
    const hook = setup({ request, initialPagination: { current: 3, pageSize: 10, total: 25 } })
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls.map((args) => args[0].current)).toEqual([3, 2])
    expect(hook.pagination.value).toMatchObject({ current: 2, total: 15 })
    expect(hook.dataSource.value[0].key).toBe(11)
  })

  it('bounds fallback requests and handles a zero total without a request loop', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(response(1, 15))
      .mockResolvedValueOnce({ data: [], total: 0 })
    const hook = setup({ request, initialPagination: { current: 3, total: 25 } })
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
    expect(hook.pagination.value).toMatchObject({ current: 1, total: 0 })
    expect(hook.dataSource.value).toEqual([])
  })

  it('merges default, submitted and extra params in order, then protects pagination fields', async () => {
    const params = ref<Partial<Params>>({ tenant: 'extra', keyword: 'forced' })
    const request = vi.fn().mockResolvedValue(response())
    const beforeSearchSubmit = vi.fn((value: Partial<Params>) => ({
      ...value,
      tenant: value.tenant?.toUpperCase(),
      current: 999,
    }))
    const hook = setup({
      request,
      params,
      defaultParams: { tenant: 'default', keyword: 'initial' },
      beforeSearchSubmit,
    })
    await flush()
    await hook.submit({ tenant: 'submitted', keyword: 'search', bounds: { start: 5 } })
    expect(hook.query.value.keyword).toBe('search')
    expect(request.mock.lastCall?.[0]).toEqual({
      keyword: 'forced',
      tenant: 'EXTRA',
      bounds: { start: 5 },
      current: 1,
      pageSize: 10,
    })
    expect(beforeSearchSubmit.mock.lastCall?.[0]).toMatchObject({
      keyword: 'forced',
      tenant: 'extra',
    })
    params.value = { tenant: 'second' }
    await nextTick()
    await flush()
    expect(request.mock.lastCall?.[0]).toMatchObject({
      keyword: 'search',
      tenant: 'SECOND',
      current: 1,
    })
  })

  it('snapshots submitted values and detects nested extra parameter changes', async () => {
    const params = ref<Partial<Params>>({ bounds: { start: 1 } })
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request, params })
    await flush()
    const query = { keyword: 'one' }
    await hook.submit(query)
    query.keyword = 'changed outside'
    expect(hook.query.value.keyword).toBe('one')
    change(hook, 2)
    await flush()
    params.value = { bounds: { start: 1 } }
    await nextTick()
    expect(hook.pagination.value.current).toBe(2)
    params.value.bounds!.start = 2
    await nextTick()
    await flush()
    expect(request.mock.lastCall?.[0]).toMatchObject({ current: 1, bounds: { start: 2 } })
  })

  it('preserves filter value types and maps multi-sort fields without using display keys', async () => {
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request, manualRequest: true })
    hook.onChange(
      { enabled: [true, false, 0, '0'], missing: null },
      [
        { column: undefined, columnKey: 'label', field: ['address', 'city'], order: 'ascend' },
        { column: undefined, columnKey: 'score', field: undefined, order: 'descend' },
      ],
      { action: 'sort', pagination: { current: 3, pageSize: 5, total: 50 }, currentDataSource: [] },
    )
    await flush()
    expect(request.mock.calls[0][0]).toMatchObject({ current: 1, pageSize: 5 })
    expect(request.mock.calls[0][1]).toEqual({ 'address.city': 'ascend', score: 'descend' })
    expect(request.mock.calls[0][2]).toEqual({ enabled: [true, false, 0, '0'], missing: null })
  })

  it('resets the page on size changes by default and allows preserving it', async () => {
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request, initialPagination: { current: 3 } })
    await flush()
    change(hook, 3, 'paginate', 5)
    await flush()
    expect(hook.pagination.value.current).toBe(1)
    const preserve = setup({
      request,
      initialPagination: { current: 3 },
      resetOnPageSizeChange: false,
    })
    await flush()
    change(preserve, 3, 'paginate', 5)
    await flush()
    expect(preserve.pagination.value.current).toBe(3)
  })

  it('reset restores defaults and clears submitted sorting and filters', async () => {
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({
      request,
      defaultParams: { keyword: 'initial' },
      initialPagination: { current: 2 },
    })
    await flush()
    await hook.submit({ keyword: 'changed' })
    hook.onChange(
      { name: ['A'] },
      { column: undefined, columnKey: 'name', field: 'name', order: 'ascend' },
      { action: 'filter', currentDataSource: [] },
    )
    await flush()
    await hook.reset()
    expect(request.mock.lastCall?.slice(0, 3)).toEqual([
      { keyword: 'initial', current: 1, pageSize: 10 },
      {},
      {},
    ])
    expect(hook.query.value).toEqual({ keyword: 'initial' })
  })

  it('reports request and transform failures, retaining successful data for retry', async () => {
    const onError = vi.fn()
    const onLoad = vi.fn()
    const request = vi
      .fn()
      .mockResolvedValueOnce(response())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: [], total: 0, success: false })
    const hook = setup({
      request,
      onError,
      onLoad,
      postData: (rows) => rows.map((row) => ({ ...row, name: 'formatted' })),
    })
    await flush()
    await hook.reload()
    expect(hook.error.value?.message).toBe('network')
    expect(hook.pagination.value.total).toBe(50)
    expect(hook.dataSource.value[0].name).toBe('formatted')
    await hook.reload()
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onLoad).toHaveBeenCalledOnce()
    expect(hook.loading.value).toBe(false)
  })

  it('debounces changes and explicit reload bypasses the timer', async () => {
    vi.useFakeTimers()
    const request = vi.fn().mockResolvedValue(response())
    const hook = setup({ request, debounceTime: 100 })
    const first = hook.submit({ keyword: 'a' })
    const second = hook.submit({ keyword: 'ab' })
    await first
    expect(request).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    await second
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][0].keyword).toBe('ab')
    await hook.reload()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('cancels on scope disposal, settles callers and ignores later responses', async () => {
    const pending = deferred<TableRequestResult<Row>>()
    const request = vi.fn().mockReturnValue(pending.promise)
    const hook = setup({ request, manualRequest: true })
    const loading = hook.reload()
    scopes[scopes.length - 1].stop()
    await loading
    expect(request.mock.calls[0][3].signal.aborted).toBe(true)
    expect(hook.loading.value).toBe(false)
    pending.resolve(response())
    await flush()
    expect(hook.dataSource.value).toEqual([])
    await hook.reload()
    expect(request).toHaveBeenCalledOnce()
  })
})
