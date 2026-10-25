import { effectScope, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useTableQuery } from './useTableQuery'
import { useTableRequest } from './useTableRequest'

describe('useTableQuery', () => {
  it('shares controlled collapse state and notifies once per change', () => {
    const collapsed = ref(false)
    const onCollapse = vi.fn()
    const scope = effectScope()
    const query = scope.run(() =>
      useTableQuery({
        defaultValues: {},
        collapsed,
        defaultCollapsed: true,
        onCollapse,
      }),
    )!
    expect(query.collapsed.value).toBe(false)
    query.toggleCollapsed()
    expect(collapsed.value).toBe(true)
    expect(onCollapse).toHaveBeenCalledExactlyOnceWith(true)
    collapsed.value = false
    expect(onCollapse).toHaveBeenCalledTimes(2)
    scope.stop()
    collapsed.value = true
    expect(onCollapse).toHaveBeenCalledTimes(2)
  })
  it('keeps draft edits separate, snapshots nested values and submits only on demand', async () => {
    const initial = { keyword: '', range: [new Date('2026-01-01')] }
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: initial, onSubmit })
    initial.range[0].setFullYear(2000)
    query.draft.value.keyword = 'hello'
    expect(onSubmit).not.toHaveBeenCalled()
    expect(query.submitted.value).toBeUndefined()
    expect(await query.submit()).toBe(true)
    query.draft.value.range[0].setFullYear(2030)
    query.draft.value.keyword = 'draft'
    expect(query.submitted.value).toMatchObject({ keyword: 'hello' })
    expect(query.submitted.value?.range[0].getFullYear()).toBe(2026)
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('isolates cyclic form values across defaults, draft, submitted state and callbacks', async () => {
    interface Node {
      label: string
      children: Node[]
    }
    const node: Node = { label: 'initial', children: [] }
    node.children.push(node)
    const query = useTableQuery({
      defaultValues: { node, alias: node },
      onSubmit(params, values) {
        expect(params.node?.children[0]).toBe(params.node)
        expect(params.node).toBe(params.alias)
        expect(values.node.children[0]).toBe(values.node)
        params.node!.label = 'callback mutation'
      },
    })
    node.label = 'external mutation'
    expect(query.draft.value.node.label).toBe('initial')
    expect(query.draft.value.node.children[0]).toBe(query.draft.value.node)
    query.draft.value.node.label = 'submitted'
    expect(await query.submit()).toBe(true)
    const submitted = query.submitted.value!
    expect(submitted.node.children[0]).toBe(submitted.node)
    expect(submitted.node).toBe(submitted.alias)
    expect(submitted.node.label).toBe('submitted')
    expect(query.params.value?.node?.label).toBe('submitted')
    query.resetFields()
    expect(query.draft.value.node.label).toBe('initial')
    expect(query.draft.value.node.children[0]).toBe(query.draft.value.node)
    expect(submitted.node.label).toBe('submitted')
  })

  it('expands transformed fields, omits source keys and applies whole transforms last', async () => {
    interface Values {
      keyword: string
      range: [number, number]
      ignored: string
      start: number
    }
    interface Params {
      keyword: string
      start: number
      end: number
    }
    const transform = vi.fn((params: Partial<Params>) => ({
      ...params,
      keyword: params.keyword?.trim(),
    }))
    const query = useTableQuery<Values, Params>({
      defaultValues: { keyword: ' term ', range: [1, 2], ignored: 'secret', start: 99 },
      fieldTransforms: {
        range: ([start, end]) => ({ start, end }),
        ignored: () => undefined,
      },
      transform,
    })
    query.draft.value.keyword = ' changed '
    expect(transform).not.toHaveBeenCalled()
    await query.submit()
    expect(query.params.value).toEqual({ keyword: 'changed', start: 1, end: 2 })
    expect(transform).toHaveBeenCalledOnce()
  })

  it('resets fields without requesting, and reset submits defaults once through its own callback', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: 'initial' }, onSubmit, onReset })
    query.draft.value.keyword = 'one'
    await query.submit()
    query.resetFields()
    expect(query.draft.value.keyword).toBe('initial')
    expect(query.submitted.value?.keyword).toBe('one')
    expect(onSubmit).toHaveBeenCalledOnce()
    query.draft.value.keyword = 'two'
    await query.reset()
    expect(onReset).toHaveBeenCalledExactlyOnceWith({ keyword: 'initial' }, { keyword: 'initial' })
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(query.submitted.value?.keyword).toBe('initial')
    query.toggleCollapsed()
    expect(query.collapsed.value).toBe(false)
  })

  it('retains fields whose optional transform is undefined', async () => {
    const query = useTableQuery({
      defaultValues: { keyword: 'query' },
      fieldTransforms: { keyword: undefined },
    })
    await query.submit()
    expect(query.params.value).toEqual({ keyword: 'query' })
  })

  it('reports transform errors without replacing the last submitted state and permits retry', async () => {
    const query = useTableQuery({
      defaultValues: { keyword: 'ok' },
      transform(params) {
        if (params.keyword === 'fail') throw new Error('invalid keyword')
        return params
      },
    })
    await query.submit()
    query.draft.value.keyword = 'fail'
    expect(await query.submit()).toBe(false)
    expect(query.error.value?.message).toBe('invalid keyword')
    expect(query.submitted.value?.keyword).toBe('ok')
    expect(query.submitting.value).toBe(false)
    query.draft.value.keyword = 'retry'
    expect(await query.submit()).toBe(true)
    expect(query.error.value).toBeNull()
  })

  it('publishes transformed snapshots before the callback and retains them on callback failure', async () => {
    const failure = new Error('request failed')
    const query = useTableQuery({
      defaultValues: { keyword: ' initial ' },
      transform: (params) => ({ keyword: params.keyword?.trim() }),
      async onSubmit(params, values) {
        expect(query.submitted.value).toEqual(values)
        expect(query.params.value).toEqual(params)
        throw failure
      },
    })
    query.draft.value.keyword = ' changed '
    expect(await query.submit()).toBe(false)
    expect(query.submitted.value).toEqual({ keyword: ' changed ' })
    expect(query.params.value).toEqual({ keyword: 'changed' })
    expect(query.error.value).toBe(failure)
    expect(query.submitting.value).toBe(false)
  })

  it('ignores stale callback failures and stops state changes after scope disposal', async () => {
    let reject!: (reason: Error) => void
    const pending = new Promise<void>((_resolve, rejectPromise) => {
      reject = rejectPromise
    })
    const scope = effectScope()
    const callback = vi.fn().mockReturnValueOnce(pending).mockResolvedValue(undefined)
    const query = scope.run(() =>
      useTableQuery({ defaultValues: { keyword: '' }, onSubmit: callback }),
    )!
    const first = query.submit()
    query.draft.value.keyword = 'new'
    expect(await query.submit()).toBe(true)
    reject(new Error('obsolete'))
    expect(await first).toBe(false)
    expect(query.error.value).toBeNull()
    expect(query.submitting.value).toBe(false)
    scope.stop()
    expect(await query.submit()).toBe(false)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('composes with request submit/reset using one request per action and clears table state', async () => {
    const scope = effectScope()
    const request = vi.fn().mockResolvedValue({ data: [], total: 0 })
    const hooks = scope.run(() => {
      const table = useTableRequest<object, { keyword: string }>({ request, manualRequest: true })
      const query = useTableQuery({
        defaultValues: { keyword: ' initial ' },
        transform: (params) => ({ keyword: params.keyword?.trim() }),
        onSubmit: (params) => table.submit(params),
        onReset: (params) => table.reset(params),
      })
      return { table, query }
    })!
    hooks.query.draft.value.keyword = 'search'
    await hooks.query.submit()
    expect(request).toHaveBeenCalledOnce()
    hooks.table.onChange(
      { status: [true] },
      {
        column: undefined,
        columnKey: 'name',
        field: 'name',
        order: 'ascend',
      },
      { action: 'filter', currentDataSource: [] },
    )
    await Promise.resolve()
    await hooks.query.reset()
    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.lastCall?.slice(0, 3)).toEqual([
      { keyword: 'initial', current: 1, pageSize: 10 },
      {},
      {},
    ])
    scope.stop()
  })
})
