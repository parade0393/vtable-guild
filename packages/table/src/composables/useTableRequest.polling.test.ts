import { effectScope, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTableRequest } from './useTableRequest'
import type { TableRequestResult, UseTableRequestOptions } from '../types/request'

type Row = { key: number }
const scopes: ReturnType<typeof effectScope>[] = []
const result = { data: [{ key: 1 }], total: 100 }
function setup(options: UseTableRequestOptions<Row, { keyword: string }>) {
  vi.useFakeTimers()
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useTableRequest(options))!
}
async function flush() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}
function deferred() {
  let resolve!: (result: TableRequestResult<Row>) => void
  const promise = new Promise<TableRequestResult<Row>>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('automatic request refresh', () => {
  it('settles reload and stops scheduling when polling and its error handler throw', async () => {
    const pending = deferred()
    const pollingError = new Error('polling failed')
    const callbackError = new Error('error handler failed')
    const polling = vi
      .fn()
      .mockReturnValueOnce(2000)
      .mockImplementation(() => {
        throw pollingError
      })
    const onError = vi.fn(() => {
      throw callbackError
    })
    const request = vi.fn().mockResolvedValueOnce(result).mockReturnValueOnce(pending.promise)
    const hook = setup({ request, polling, onError })
    await flush()
    await vi.advanceTimersByTimeAsync(2000)
    expect(hook.refreshing.value).toBe(true)
    const reloaded = hook.reload()
    pending.resolve(result)
    await expect(reloaded).resolves.toBeUndefined()
    expect(hook.loading.value).toBe(false)
    expect(hook.refreshing.value).toBe(false)
    expect(hook.error.value).toBe(callbackError)
    expect(onError).toHaveBeenCalledExactlyOnceWith(pollingError)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(6000)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('keeps unscoped and server usage free of automatic timers', async () => {
    vi.useFakeTimers()
    const request = vi.fn().mockResolvedValue(result)
    const unscoped = useTableRequest({ request, polling: 2000, revalidateOnFocus: true })
    await flush()
    await vi.advanceTimersByTimeAsync(6000)
    expect(request).toHaveBeenCalledTimes(1)
    unscoped.cancel()
    vi.stubGlobal('document', undefined)
    try {
      setup({ request, polling: 2000, revalidateOnFocus: true })
      await flush()
      await vi.advanceTimersByTimeAsync(6000)
      expect(request).toHaveBeenCalledTimes(2)
    } finally {
      scopes.at(-1)!.stop()
      vi.unstubAllGlobals()
    }
  })

  it('allows hidden polling and reactive visibility refresh without enabling invalid intervals', async () => {
    let visibility: DocumentVisibilityState = 'hidden'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    const focus = ref(false)
    const polling = ref(2000)
    const request = vi.fn().mockResolvedValue(result)
    setup({ request, polling, pollingWhenHidden: true, revalidateOnFocus: focus })
    await flush()
    await vi.advanceTimersByTimeAsync(2000)
    expect(request).toHaveBeenCalledTimes(2)
    for (const invalid of [0, -1, NaN, Infinity]) {
      polling.value = invalid
      await nextTick()
      await vi.advanceTimersByTimeAsync(4000)
    }
    expect(request).toHaveBeenCalledTimes(2)
    focus.value = true
    await nextTick()
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('discards an automatic response after query dependencies change', async () => {
    const pending = deferred()
    const params = ref({ keyword: 'old' })
    const request = vi
      .fn()
      .mockResolvedValueOnce(result)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue({ data: [{ key: 3 }], total: 1 })
    const hook = setup({ request, params, polling: 2000 })
    await flush()
    await vi.advanceTimersByTimeAsync(2000)
    params.value = { keyword: 'new' }
    await flush()
    expect(request.mock.calls[1][3].signal.aborted).toBe(true)
    pending.resolve({ data: [{ key: 2 }], total: 1 })
    await flush()
    expect(hook.dataSource.value).toEqual([{ key: 3 }])
    expect(request.mock.calls[2][0]).toMatchObject({ keyword: 'new', current: 1 })
  })

  it('clamps the interval, serializes slow requests and keeps background refresh nonblocking', async () => {
    const pending = deferred()
    const request = vi
      .fn()
      .mockResolvedValueOnce(result)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(result)
    const hook = setup({ request, polling: 1, initialPagination: { current: 3 } })
    await flush()
    await vi.advanceTimersByTimeAsync(1999)
    expect(request).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(hook.refreshing.value).toBe(true)
    expect(hook.loading.value).toBe(false)
    expect(hook.dataSource.value).toEqual(result.data)
    await vi.advanceTimersByTimeAsync(10000)
    expect(request).toHaveBeenCalledTimes(2)
    const same = hook.reload()
    expect(request).toHaveBeenCalledTimes(2)
    pending.resolve(result)
    await same
    expect(hook.refreshing.value).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls.map(([params]) => params.current)).toEqual([3, 3, 3])
  })

  it('does not start a manual first load from visibility, polling or resume', async () => {
    const request = vi.fn().mockResolvedValue(result)
    const hook = setup({ request, manualRequest: true, polling: 2000, revalidateOnFocus: true })
    document.dispatchEvent(new Event('visibilitychange'))
    await hook.resume(true)
    await vi.advanceTimersByTimeAsync(5000)
    expect(request).not.toHaveBeenCalled()
    await hook.submit({ keyword: 'submitted' })
    await vi.advanceTimersByTimeAsync(2000)
    expect(request.mock.calls[1][0]).toMatchObject({ keyword: 'submitted' })
  })

  it('pauses while hidden, coalesces visibility/reload and removes listeners on disposal', async () => {
    let visibility = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility as DocumentVisibilityState,
    )
    const pending = deferred()
    const request = vi.fn().mockResolvedValueOnce(result).mockReturnValue(pending.promise)
    const hook = setup({ request, polling: 2000, revalidateOnFocus: true })
    await flush()
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(10000)
    expect(request).toHaveBeenCalledTimes(1)
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    const reload = hook.reload()
    await vi.advanceTimersByTimeAsync(0)
    expect(request).toHaveBeenCalledTimes(2)
    scopes.at(-1)!.stop()
    await reload
    expect(request.mock.calls[1][3].signal.aborted).toBe(true)
    pending.resolve(result)
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(10000)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('refreshes on visibility without polling and preserves table sort/filter state', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const request = vi.fn().mockResolvedValue(result)
    const hook = setup({ request, revalidateOnFocus: true })
    await flush()
    hook.onChange(
      { status: [1] },
      { column: undefined, columnKey: 'key', field: 'key', order: 'descend' },
      {
        action: 'sort',
        currentDataSource: [],
        pagination: { current: 1, pageSize: 10, total: 100 },
      },
    )
    await flush()
    document.dispatchEvent(new Event('visibilitychange'))
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls[2].slice(1, 3)).toEqual([{ key: 'descend' }, { status: [1] }])
  })

  it('supports explicit pause, cancellation, result-based stopping and reactive intervals', async () => {
    const polling = ref<number | false>(2000)
    const request = vi.fn().mockResolvedValue(result)
    const hook = setup({ request, polling })
    await flush()
    hook.pause()
    await vi.advanceTimersByTimeAsync(4000)
    expect(hook.paused.value).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    await hook.resume(true)
    expect(request).toHaveBeenCalledTimes(2)
    polling.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(4000)
    expect(request).toHaveBeenCalledTimes(2)
    polling.value = 2000
    await nextTick()
    await vi.advanceTimersByTimeAsync(2000)
    expect(request).toHaveBeenCalledTimes(3)
    hook.cancel()
    await vi.advanceTimersByTimeAsync(4000)
    expect(request).toHaveBeenCalledTimes(3)
    const finish = vi.fn().mockResolvedValue(result)
    setup({ request: finish, polling: (rows) => (rows.length ? false : 2000) })
    await flush()
    await vi.advanceTimersByTimeAsync(4000)
    expect(finish).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])(
    'makes retry after failure opt-in: pollingOnError=%s',
    async (pollingOnError) => {
      const request = vi.fn().mockRejectedValue(new Error('offline'))
      const hook = setup({ request, polling: 2000, pollingOnError })
      await flush()
      await vi.advanceTimersByTimeAsync(2000)
      expect(request).toHaveBeenCalledTimes(pollingOnError ? 2 : 1)
      expect(hook.error.value?.message).toBe('offline')
      expect(hook.refreshing.value).toBe(false)
    },
  )

  it('aborts a paused automatic request and ignores its response, while manual work may finish', async () => {
    const pending = deferred()
    const request = vi.fn().mockResolvedValueOnce(result).mockReturnValue(pending.promise)
    const hook = setup({ request, polling: 2000 })
    await flush()
    await vi.advanceTimersByTimeAsync(2000)
    hook.pause()
    expect(request.mock.calls[1][3].signal.aborted).toBe(true)
    pending.resolve({ data: [{ key: 2 }], total: 2 })
    await flush()
    expect(hook.dataSource.value).toEqual(result.data)
    const manual = hook.reload()
    hook.pause()
    expect(request.mock.calls[2][3].signal.aborted).toBe(false)
    await manual
  })
})
