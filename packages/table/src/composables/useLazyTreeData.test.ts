import { effectScope, nextTick, reactive, ref, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useLazyTreeData } from './useLazyTreeData'
import type { TableTreeLoadData } from '../types/tree'

interface Row extends Record<string, unknown> {
  key: string
  leaf?: boolean
  children?: Row[]
}
function setup(
  loadData: TableTreeLoadData<Row>,
  onLoadError?: (error: Error, record: Row) => void,
) {
  const scope = effectScope()
  const roots = shallowRef<Row[]>([{ key: 'root' }])
  const loader = shallowRef(loadData)
  const field = ref<string>()
  const tree = scope.run(() =>
    useLazyTreeData({
      data: () => roots.value,
      loadData: () => loader.value,
      isLeaf: () => (row: Row) => row.leaf === true,
      childrenColumnName: () => field.value,
      getRowKey: (row: Row) => row.key,
      onLoadError,
    }),
  )!
  return { tree, roots, loader, field, stop: () => scope.stop() }
}

describe('lazy tree data', () => {
  it.each(['sync', 'async'])(
    'preserves handled load failures when an %s error observer fails',
    async (mode) => {
      const original = new Error('network')
      const onLoadError = vi.fn(() => {
        if (mode === 'async') return Promise.reject(new Error('observer'))
        throw new Error('observer')
      })
      const load = vi
        .fn<TableTreeLoadData<Row>>()
        .mockRejectedValueOnce(original)
        .mockResolvedValueOnce([{ key: 'child', leaf: true }])
      const { tree, roots, stop } = setup(load, onLoadError)
      await expect(tree.retry('root')).resolves.toBe(false)
      expect(onLoadError).toHaveBeenCalledExactlyOnceWith(original, roots.value[0])
      expect(tree.getError('root')).toBe(original)
      expect(tree.isLoading('root')).toBe(false)
      await expect(tree.retry('root')).resolves.toBe(true)
      expect(tree.getError('root')).toBeUndefined()
      stop()
    },
  )

  it.each(['empty', 'preloaded'])(
    'clears an error when business supplies %s children on the same record',
    async (kind) => {
      const load = vi.fn<TableTreeLoadData<Row>>().mockRejectedValue(new Error('network'))
      const { tree, roots, stop } = setup(load)
      const root = reactive<Row>({ key: 'root' })
      roots.value = [root]
      await tree.load(root, 0)
      expect(tree.getError('root')?.message).toBe('network')
      root.children = kind === 'empty' ? [] : [{ key: 'child', leaf: true }]
      expect(tree.getError('root')).toBeUndefined()
      expect(tree.hasChildren(tree.data.value[0]!)).toBe(kind !== 'empty')
      await tree.retry('root')
      expect(load).toHaveBeenCalledOnce()
      root.children = undefined
      expect(tree.getError('root')).toBeUndefined()
      stop()
    },
  )
  it('settles cancelled callers even when the loader ignores abort and never responds', async () => {
    const load = vi.fn(() => new Promise<Row[]>(() => {}))
    const { tree, roots, stop } = setup(load)
    const pending = tree.load(roots.value[0]!, 0)
    await nextTick()
    let result: boolean | undefined
    void pending.then((value) => {
      result = value
    })
    roots.value = [{ key: 'root', name: 'replacement' }]
    await nextTick()
    await Promise.resolve()
    expect(result).toBe(false)
    expect(tree.isLoading('root')).toBe(false)
    stop()
  })

  it('does not start a request invalidated before its scheduled execution', async () => {
    const load = vi.fn().mockResolvedValue([])
    const { tree, roots, stop } = setup(load)
    const pending = tree.load(roots.value[0]!, 0)
    roots.value = [{ key: 'root' }]
    expect(await pending).toBe(false)
    expect(load).not.toHaveBeenCalled()
    stop()
  })

  it('treats replacement children on the same source node as authoritative', async () => {
    let resolve!: (rows: Row[]) => void
    let signal!: AbortSignal
    const { tree, roots, stop } = setup((_row, context) => {
      signal = context.signal
      return new Promise<Row[]>((done) => {
        resolve = done
      })
    })
    const root = reactive<Row>({ key: 'root' })
    roots.value = [root]
    const pending = tree.load(root, 0)
    await nextTick()
    root.children = [{ key: 'authoritative', leaf: true }]
    expect(await pending).toBe(false)
    expect(signal.aborted).toBe(true)
    resolve([{ key: 'stale', leaf: true }])
    await nextTick()
    expect(tree.data.value[0]?.children?.[0]?.key).toBe('authoritative')
    root.children = undefined
    expect(tree.data.value[0]?.children).toBeUndefined()
    stop()
  })

  it('invalidates loader/field changes and deep cached child replacements', async () => {
    const oldLoad = vi.fn().mockResolvedValue([{ key: 'child' }])
    const { tree, roots, loader, field, stop } = setup(oldLoad)
    await tree.load(roots.value[0]!, 0)
    expect(tree.data.value[0]?.children?.[0]?.key).toBe('child')
    loader.value = vi.fn().mockResolvedValue([{ key: 'new-child', leaf: true }])
    expect(tree.data.value[0]?.children).toBeUndefined()
    await tree.load(roots.value[0]!, 0)
    expect(tree.data.value[0]?.children?.[0]?.key).toBe('new-child')
    field.value = 'nodes'
    expect(tree.data.value[0]?.children).toBeUndefined()
    await tree.load(roots.value[0]!, 0)
    expect(tree.data.value[0]?.nodes).toEqual([{ key: 'new-child', leaf: true }])
    stop()

    const child = reactive<Row>({ key: 'child' })
    const deep = setup(async () => [{ key: 'grandchild', leaf: true }])
    deep.roots.value = [{ key: 'root', children: [child] }]
    await deep.tree.load(child, 1)
    expect(deep.tree.data.value[0]?.children?.[0]?.children?.[0]?.key).toBe('grandchild')
    child.children = [{ key: 'replaced', leaf: true }]
    expect(deep.tree.data.value[0]?.children?.[0]?.children?.[0]?.key).toBe('replaced')
    child.children = undefined
    expect(deep.tree.data.value[0]?.children?.[0]?.children).toBeUndefined()
    deep.stop()
  })
  it('deduplicates requests, attaches immutable children and caches empty leaf results', async () => {
    let resolve!: (rows: Row[]) => void
    const load = vi.fn(
      () =>
        new Promise<Row[]>((done) => {
          resolve = done
        }),
    )
    const { tree, roots, stop } = setup(load)
    const original = roots.value[0]!
    expect(tree.hasChildren(original)).toBe(true)
    const first = tree.load(original, 0)
    expect(tree.load(original, 0)).toBe(first)
    await nextTick()
    expect(tree.isLoading('root')).toBe(true)
    resolve([{ key: 'child', leaf: true }])
    expect(await first).toBe(true)
    expect(tree.data.value[0]?.children).toEqual([{ key: 'child', leaf: true }])
    expect(original.children).toBeUndefined()
    await tree.load(tree.data.value[0]!, 0)
    expect(load).toHaveBeenCalledTimes(1)
    stop()

    const empty = setup(async () => [])
    await empty.tree.load(empty.roots.value[0]!, 0)
    expect(empty.tree.hasChildren(empty.tree.data.value[0]!)).toBe(false)
    empty.stop()
  })

  it('retains failed nodes for explicit retry and clears errors on success', async () => {
    const load = vi
      .fn<TableTreeLoadData<Row>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ key: 'child', leaf: true }])
    const { tree, roots, stop } = setup(load)
    expect(await tree.load(roots.value[0]!, 0)).toBe(false)
    expect(tree.getError('root')?.message).toBe('network')
    expect(tree.isLoading('root')).toBe(false)
    expect(await tree.retry('root')).toBe(true)
    expect(tree.getError('root')).toBeUndefined()
    expect(await tree.retry('missing')).toBe(false)
    stop()
  })

  it('retries a nonzero indexed key with its source, state and cached children', async () => {
    const originalError = new Error('network')
    const retryError = new Error('retry failed')
    let resolve!: (rows: Row[]) => void
    const load = vi
      .fn<TableTreeLoadData<Row>>()
      .mockRejectedValueOnce(originalError)
      .mockRejectedValueOnce(retryError)
      .mockImplementationOnce(
        () =>
          new Promise<Row[]>((done) => {
            resolve = done
          }),
      )
    const scope = effectScope()
    const roots: Row[] = [{ key: 'first', leaf: true }, { key: 'second' }]
    const source = roots[1]!
    const tree = scope.run(() =>
      useLazyTreeData({
        data: () => roots,
        loadData: () => load,
        isLeaf: () => (row: Row) => row.leaf === true,
        childrenColumnName: () => undefined,
        getRowKey: (_row: Row, index: number) => index,
      }),
    )!

    expect(await tree.load(source, 1)).toBe(false)
    expect(tree.getError(1)).toBe(originalError)
    expect(await tree.retry(1)).toBe(false)
    expect(tree.getError(1)).toBe(retryError)
    expect(tree.getError(0)).toBeUndefined()

    const retried = tree.retry(1)
    expect(tree.retry(1)).toBe(retried)
    expect(tree.load(source, 1)).toBe(retried)
    expect(tree.isLoading(1)).toBe(true)
    expect(tree.isLoading(0)).toBe(false)
    expect(tree.getError(1)).toBeUndefined()
    await nextTick()
    expect(load).toHaveBeenCalledTimes(3)
    expect(load.mock.calls.every(([record]) => record === source)).toBe(true)

    const children: Row[] = [{ key: 'child', leaf: true }]
    resolve(children)
    expect(await retried).toBe(true)
    expect(tree.isLoading(1)).toBe(false)
    expect(tree.getError(1)).toBeUndefined()
    expect(tree.data.value[0]?.children).toBeUndefined()
    expect(tree.data.value[1]?.children).toEqual(children)
    expect(source.children).toBeUndefined()
    expect(await tree.retry(1)).toBe(true)
    expect(await tree.load(tree.data.value[1]!, 1)).toBe(true)
    expect(load).toHaveBeenCalledTimes(3)
    scope.stop()
  })

  it('aborts replaced records and ignores their stale responses even when keys are reused', async () => {
    let resolve!: (rows: Row[]) => void
    let signal!: AbortSignal
    const { tree, roots, stop } = setup((_row, context) => {
      signal = context.signal
      return new Promise<Row[]>((done) => {
        resolve = done
      })
    })
    const old = tree.load(roots.value[0]!, 0)
    await nextTick()
    roots.value = [{ key: 'root', name: 'replacement' }]
    expect(signal.aborted).toBe(true)
    resolve([{ key: 'stale' }])
    expect(await old).toBe(false)
    expect(tree.data.value[0]?.children).toBeUndefined()
    stop()
  })

  it('cancels requests on disposal and preserves preloaded children', async () => {
    let resolve!: (rows: Row[]) => void
    const load = vi.fn<TableTreeLoadData<Row>>((_row, context) => {
      expect(context.signal.aborted).toBe(false)
      return new Promise<Row[]>((done) => {
        resolve = done
      })
    })
    const { tree, roots, stop } = setup(load)
    roots.value = [{ key: 'root', children: [{ key: 'existing', leaf: true }] }]
    expect(await tree.load(tree.data.value[0]!, 0)).toBe(true)
    expect(load).not.toHaveBeenCalled()
    roots.value = [{ key: 'root' }]
    const pending = tree.load(roots.value[0]!, 0)
    await nextTick()
    stop()
    resolve([{ key: 'late' }])
    expect(await pending).toBe(false)
    expect(tree.isLoading('root')).toBe(false)
  })
})
