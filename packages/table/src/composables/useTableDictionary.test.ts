import { effectScope, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTableDictionary, useTableDictionary } from './useTableDictionary'
import type { TableDictionaryResult, UseTableDictionaryOptions } from '../types/dictionary'

const all: TableDictionaryResult = {
  options: [
    { value: 1, label: 'One', status: 'success' },
    { value: '1', label: 'String one' },
    { value: false, label: 'No' },
  ],
  complete: true,
}
const scopes: ReturnType<typeof effectScope>[] = []
const context = () => ({ keyword: '', signal: new AbortController().signal })
function setup<P extends object>(options: UseTableDictionaryOptions<P>) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useTableDictionary(options))!
}
function deferred() {
  let resolve!: (result: TableDictionaryResult) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<TableDictionaryResult>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
async function flush() {
  for (let index = 0; index < 12; index++) await Promise.resolve()
  await nextTick()
}
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.useRealTimers()
})

describe('dictionary instances', () => {
  it('invalidates pending cache entries without cancelling their existing subscribers', async () => {
    const pending = deferred()
    const request = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(all)
    const dictionary = createTableDictionary({ key: 'status', request })
    const old = dictionary.load({}, context())
    await flush()
    dictionary.invalidate()
    const fresh = await dictionary.load({}, context())
    expect(request.mock.calls[0][1].signal.aborted).toBe(false)
    pending.resolve({ options: [], complete: true })
    expect((await old).options).toEqual([])
    expect(await dictionary.load({}, context())).toEqual(fresh)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('shares pending work even when completed result caching is disabled', async () => {
    const request = vi.fn().mockResolvedValue(all)
    const dictionary = createTableDictionary({ key: 'status', request, cacheTime: 0 })
    await Promise.all([dictionary.load({}, context()), dictionary.load({}, context())])
    expect(request).toHaveBeenCalledTimes(1)
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('deduplicates pending loads, isolates consumers and retains primitive value identity', async () => {
    const pending = deferred()
    const request = vi.fn().mockReturnValue(pending.promise)
    const dictionary = createTableDictionary({ key: 'status', request })
    const first = dictionary.load({ tenant: 1 }, context())
    const second = dictionary.load({ tenant: 1 }, context())
    await flush()
    expect(request).toHaveBeenCalledOnce()
    pending.resolve(all)
    const firstResult = await first
    const secondResult = await second
    expect(firstResult).toEqual(all)
    expect(secondResult).not.toBe(firstResult)
    firstResult.options[0].label = 'Changed by consumer'
    expect((await dictionary.load({ tenant: 1 }, context())).options[0].label).toBe('One')
    await dictionary.load({ tenant: '1' }, context())
    expect(request).toHaveBeenCalledTimes(2)
    const independent = createTableDictionary({ key: 'status', request })
    await independent.load({ tenant: 1 }, context())
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('cancels a subscriber without aborting other users, then aborts when the last user leaves', async () => {
    const pending = deferred()
    const request = vi.fn().mockReturnValue(pending.promise)
    const dictionary = createTableDictionary({ key: 'status', request })
    const first = new AbortController()
    const second = new AbortController()
    const a = dictionary
      .load({}, { keyword: '', signal: first.signal })
      .catch((error: Error) => error.name)
    const b = dictionary
      .load({}, { keyword: '', signal: second.signal })
      .catch((error: Error) => error.name)
    await flush()
    first.abort()
    expect(await a).toBe('AbortError')
    expect(request.mock.calls[0][1].signal.aborted).toBe(false)
    second.abort()
    expect(await b).toBe('AbortError')
    expect(request.mock.calls[0][1].signal.aborted).toBe(true)
    pending.resolve(all)
    await flush()
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('expires, bypasses, invalidates and bounds completed cache entries', async () => {
    vi.useFakeTimers()
    const request = vi.fn().mockResolvedValue(all)
    const dictionary = createTableDictionary({
      key: 'status',
      request,
      cacheTime: 100,
      maxEntries: 2,
    })
    await dictionary.load({}, context())
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(1)
    await dictionary.load({}, { ...context(), force: true })
    expect(request).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(101)
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(3)
    dictionary.invalidate()
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(4)
    await dictionary.load({ tenant: 1 }, context())
    await dictionary.load({ tenant: 2 }, context())
    await dictionary.load({}, context())
    expect(request).toHaveBeenCalledTimes(7)
  })

  it('never caches a failed or malformed response and guards search completeness', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ options: [{ value: {}, label: 'Bad' }], complete: true })
      .mockResolvedValue(all)
    const dictionary = createTableDictionary({ key: 'status', request })
    await expect(dictionary.load({}, context())).rejects.toThrow('offline')
    await expect(dictionary.load({}, context())).rejects.toThrow('primitive value')
    expect((await dictionary.load({}, { ...context(), keyword: 'one' })).complete).toBe(false)
    expect((await dictionary.load({}, context())).complete).toBe(true)
    expect(request).toHaveBeenCalledTimes(4)
  })
})

describe('useTableDictionary', () => {
  it('shares reloads during an active query and immediately promotes a debounced search', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const request = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(all)
    const hook = setup({
      dictionary: createTableDictionary({ key: 'status', request }),
      debounceTime: 100,
    })
    const promoted = hook.reload()
    await flush()
    const shared = hook.reload()
    expect(shared).toBe(promoted)
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][1].signal.aborted).toBe(false)
    pending.resolve(all)
    expect(await promoted).toBe(true)
    expect(await shared).toBe(true)
    const search = hook.search('one')
    const immediate = hook.reload()
    expect(await search).toBe(false)
    expect(await immediate).toBe(true)
    expect(request).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(200)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('settles failed loads even if the error callback itself throws', async () => {
    const request = vi.fn().mockRejectedValue(new Error('offline'))
    const hook = setup({
      dictionary: createTableDictionary({ key: 'status', request }),
      manualRequest: true,
      onError() {
        throw new Error('callback failed')
      },
    })
    expect(await hook.reload()).toBe(false)
    expect(hook.loading.value).toBe(false)
    expect(hook.error.value?.message).toBe('callback failed')
    expect(await hook.search('retry')).toBe(false)
  })

  it('shares a dictionary across controls and exposes full enum/filter options', async () => {
    const request = vi.fn().mockResolvedValue(all)
    const dictionary = createTableDictionary({ key: 'status', request })
    const a = setup({ dictionary })
    const b = setup({ dictionary })
    await flush()
    expect(request).toHaveBeenCalledOnce()
    expect(a.valueEnum.value.get(1)).toEqual({ text: 'One', status: 'success' })
    expect(a.valueEnum.value.get('1')).toMatchObject({ text: 'String one' })
    expect(a.valueEnum.value.get(false)).toMatchObject({ text: 'No' })
    expect(b.filters.value).toEqual(all.options.map(({ value, label }) => ({ value, text: label })))
    expect(b.complete.value).toBe(true)
  })

  it('debounces search and retains selected labels without exposing partial results as filters', async () => {
    vi.useFakeTimers()
    const request = vi
      .fn()
      .mockResolvedValue({ options: [{ value: 2, label: 'Two' }], complete: false })
    const dictionary = createTableDictionary({ key: 'users', request })
    const hook = setup({
      dictionary,
      manualRequest: true,
      debounceTime: 100,
      selectedOptions: [{ value: 1, label: 'Selected' }],
    })
    const first = hook.search('t')
    const second = hook.search('two')
    expect(await first).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(await second).toBe(true)
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][1].keyword).toBe('two')
    expect(hook.filters.value).toEqual([])
    expect(hook.options.value).toEqual([{ value: 2, label: 'Two' }])
    expect(hook.valueEnum.value.get(1)).toMatchObject({ text: 'Selected' })
    expect(hook.valueEnum.value.get(2)).toMatchObject({ text: 'Two' })
  })

  it('ignores old dependency responses and clears old labels without mutating a selection', async () => {
    const a = deferred()
    const b = deferred()
    const request = vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
    const dictionary = createTableDictionary<{ tenant: number }>({ key: 'teams', request })
    const params = ref({ tenant: 1 })
    const selected = ref([{ value: 100, label: 'Keep my selection' }])
    const hook = setup({ dictionary, params, selectedOptions: selected })
    await flush()
    params.value = { tenant: 2 }
    await flush()
    expect(request.mock.calls[0][1].signal.aborted).toBe(true)
    b.resolve({ options: [{ value: 2, label: 'Tenant two' }], complete: true })
    await flush()
    a.resolve(all)
    await flush()
    expect(hook.options.value).toEqual([{ value: 2, label: 'Tenant two' }])
    expect(hook.valueEnum.value.has(1)).toBe(false)
    expect(hook.valueEnum.value.has(100)).toBe(true)
    expect(selected.value).toEqual([{ value: 100, label: 'Keep my selection' }])
    params.value = { tenant: 2 }
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('reports errors, reloads once and settles callers on scope disposal', async () => {
    const pending = deferred()
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(all)
      .mockReturnValue(pending.promise)
    const onError = vi.fn()
    const hook = setup({ dictionary: createTableDictionary({ key: 'status', request }), onError })
    await flush()
    expect(hook.error.value?.message).toBe('offline')
    expect(onError).toHaveBeenCalledOnce()
    expect(await hook.reload()).toBe(true)
    const last = hook.reload()
    await flush()
    scopes.at(-1)!.stop()
    expect(await last).toBe(false)
    pending.resolve({ options: [], complete: true })
    await flush()
    expect(hook.options.value).toEqual(all.options)
    expect(await hook.reload()).toBe(false)
    expect(hook.loading.value).toBe(false)
  })
})
