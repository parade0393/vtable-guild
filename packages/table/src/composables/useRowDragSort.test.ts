import { describe, expect, it, vi } from 'vitest'
import { moveTreeNode, useRowDragSort } from './useRowDragSort'
import type { DropPosition, RowDragBindings } from './useRowDragSort'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
}

interface TreeRow extends Record<string, unknown> {
  key: string
  children?: TreeRow[]
}

const rows: DemoRow[] = [
  { key: 'a', name: 'Ada' },
  { key: 'b', name: 'Bob' },
  { key: 'c', name: 'Cid' },
  { key: 'd', name: 'Dan' },
]
const getKey = (record: DemoRow) => record.key

const treeData: TreeRow[] = [
  {
    key: 'p1',
    children: [{ key: 'c1' }, { key: 'c2' }, { key: 'c3' }],
  },
  {
    key: 'p2',
    children: [{ key: 'd1' }],
  },
]
const getTreeKey = (record: TreeRow) => record.key

function makeDragEvent(overrides: Partial<DragEvent> = {}): DragEvent {
  return {
    dataTransfer: undefined,
    preventDefault: vi.fn(),
    currentTarget: null,
    clientY: 0,
    ...overrides,
  } as unknown as DragEvent
}

describe('moveTreeNode（平铺数据）', () => {
  it('moves a row before the target from above', () => {
    expect(moveTreeNode(rows, getKey, 'a', 'c', 'before')).toEqual([
      rows[1],
      rows[0],
      rows[2],
      rows[3],
    ])
  })

  it('moves a row after the target from above', () => {
    expect(moveTreeNode(rows, getKey, 'a', 'c', 'after')).toEqual([
      rows[1],
      rows[2],
      rows[0],
      rows[3],
    ])
  })

  it('moves a row before the target from below', () => {
    expect(moveTreeNode(rows, getKey, 'd', 'b', 'before')).toEqual([
      rows[0],
      rows[3],
      rows[1],
      rows[2],
    ])
  })

  it('moves a row after the target from below', () => {
    expect(moveTreeNode(rows, getKey, 'd', 'a', 'after')).toEqual([
      rows[0],
      rows[3],
      rows[1],
      rows[2],
    ])
  })

  it('returns null when dropped back to the original position', () => {
    // b 拖到 c 的 before，即 b 的原位
    expect(moveTreeNode(rows, getKey, 'b', 'c', 'before')).toBeNull()
  })

  it('returns null when dragging onto itself or unknown keys', () => {
    expect(moveTreeNode(rows, getKey, 'b', 'b', 'before')).toBeNull()
    expect(moveTreeNode(rows, getKey, 'x', 'b', 'before')).toBeNull()
    expect(moveTreeNode(rows, getKey, 'b', 'x', 'after')).toBeNull()
  })

  it('does not mutate the source array', () => {
    const snapshot = [...rows]
    moveTreeNode(rows, getKey, 'a', 'd', 'after')
    expect(rows).toEqual(snapshot)
  })
})

describe('moveTreeNode（树形数据，跨父移动语义）', () => {
  const keysOf = (list: TreeRow[]) => list.map((row) => row.key)

  it('reorders among siblings within the same parent', () => {
    const result = moveTreeNode(treeData, getTreeKey, 'c1', 'c3', 'before')
    expect(result).not.toBeNull()
    expect(keysOf(result![0].children!)).toEqual(['c2', 'c1', 'c3'])
    expect(keysOf(result!)).toEqual(['p1', 'p2'])
  })

  it('returns null when dropping back to the original sibling position', () => {
    // c2 拖到 c3 的 before = 原位
    expect(moveTreeNode(treeData, getTreeKey, 'c2', 'c3', 'before')).toBeNull()
    // c2 拖到 c1 的 after = 原位
    expect(moveTreeNode(treeData, getTreeKey, 'c2', 'c1', 'after')).toBeNull()
  })

  it('moves a child to another parent when dropping beside its child', () => {
    const result = moveTreeNode(treeData, getTreeKey, 'c1', 'd1', 'before')
    expect(result).not.toBeNull()
    // c1 离开 p1，插入到 p2 的子级 d1 之前（跨父移动）
    expect(keysOf(result![0].children!)).toEqual(['c2', 'c3'])
    expect(keysOf(result![1].children!)).toEqual(['c1', 'd1'])
  })

  it('moves a root (with its whole subtree) into another parent when dropping beside a child', () => {
    const result = moveTreeNode(treeData, getTreeKey, 'p2', 'c1', 'before')
    expect(result).not.toBeNull()
    // p2 连同子树变成 p1 的子节点
    expect(keysOf(result!)).toEqual(['p1'])
    expect(keysOf(result![0].children!)).toEqual(['p2', 'c1', 'c2', 'c3'])
    const movedP2 = result![0].children![0]
    expect(keysOf(movedP2.children!)).toEqual(['d1'])
  })

  it('returns null when the target is inside the dragged node subtree (cycle guard)', () => {
    expect(moveTreeNode(treeData, getTreeKey, 'p1', 'c2', 'before')).toBeNull()
    expect(moveTreeNode(treeData, getTreeKey, 'p1', 'c3', 'after')).toBeNull()
  })

  it('keeps untouched node references stable and clones only the touched spine', () => {
    const result = moveTreeNode(treeData, getTreeKey, 'c1', 'd1', 'before')!
    // 未被修改的兄弟/子节点保持原引用
    expect(result[0].children![0]).toBe(treeData[0].children![1])
    expect(result[0].children![1]).toBe(treeData[0].children![2])
    expect(result[1].children![1]).toBe(treeData[1].children![0])
    // 被搬移的节点本身也是原引用
    expect(result[1].children![0]).toBe(treeData[0].children![0])
    // 被修改路径上的父对象是新对象
    expect(result[0]).not.toBe(treeData[0])
  })

  it('does not mutate the source tree', () => {
    const snapshot = JSON.parse(JSON.stringify(treeData))
    moveTreeNode(treeData, getTreeKey, 'p2', 'c1', 'before')
    expect(treeData).toEqual(snapshot)
  })
})

describe('useRowDragSort', () => {
  function setup(overrides: Partial<{ enabled: boolean; data: DemoRow[] }> = {}) {
    const onDrop = vi.fn()
    const drag = useRowDragSort<DemoRow>({
      enabled: () => overrides.enabled ?? true,
      getRowKey: getKey,
      dataSource: () => overrides.data ?? rows,
      onDrop,
    })
    return { drag, onDrop }
  }

  function rowOverEvent(clientY: number): DragEvent {
    const overrides = {
      clientY,
      currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) },
    }
    return makeDragEvent(overrides as unknown as Partial<DragEvent>)
  }

  it('is inert when disabled', () => {
    const { drag } = setup({ enabled: false })
    const bindings: RowDragBindings = drag.getBindings(rows[0], 0)
    expect(bindings.draggable).toBe(false)

    bindings.onDragstart?.(makeDragEvent())
    expect(drag.draggingKey.value).toBeNull()
  })

  it('tracks dragging state and emits drop with reordered data', () => {
    const { drag, onDrop } = setup()

    const startBindings = drag.getBindings(rows[0], 0)
    expect(startBindings.draggable).toBe(true)
    startBindings.onDragstart(makeDragEvent())
    expect(drag.draggingKey.value).toBe('a')

    // 拖到 c 行的上半部分 → before
    const overBindings = drag.getBindings(rows[2], 2)
    overBindings.onDragover(rowOverEvent(10))
    expect(drag.dropTarget.value).toEqual({ key: 'c', position: 'before' })

    overBindings.onDrop(makeDragEvent())
    expect(onDrop).toHaveBeenCalledTimes(1)
    const [newData, info] = onDrop.mock.calls[0]
    expect(newData.map((row: DemoRow) => row.key)).toEqual(['b', 'a', 'c', 'd'])
    expect(info).toEqual({ draggedKey: 'a', targetKey: 'c', orderedKeys: ['b', 'a', 'c', 'd'] })

    // drop 后状态已清理
    expect(drag.draggingKey.value).toBeNull()
    expect(drag.dropTarget.value).toBeNull()
  })

  it('computes after position when dropping at the lower half of the target row', () => {
    const { drag, onDrop } = setup()

    drag.getBindings(rows[0], 0).onDragstart(makeDragEvent())
    drag.getBindings(rows[2], 2).onDragover(rowOverEvent(90))
    expect(drag.dropTarget.value).toEqual({ key: 'c', position: 'after' })
    drag.getBindings(rows[2], 2).onDrop(makeDragEvent())
    expect(onDrop.mock.calls[0][0].map((row: DemoRow) => row.key)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('clears the indicator when hovering the dragged row itself', () => {
    const { drag } = setup()

    drag.getBindings(rows[1], 1).onDragstart(makeDragEvent())
    drag.getBindings(rows[0], 0).onDragover(rowOverEvent(0))
    expect(drag.dropTarget.value).toEqual({ key: 'a', position: 'before' })

    drag.getBindings(rows[1], 1).onDragover(makeDragEvent())
    expect(drag.dropTarget.value).toBeNull()
  })

  it('does not emit when the drop does not change the order', () => {
    const { drag, onDrop } = setup()

    drag.getBindings(rows[1], 1).onDragstart(makeDragEvent())
    // b 拖到 c 的 before = 原位
    drag.getBindings(rows[2], 2).onDragover(rowOverEvent(0))
    drag.getBindings(rows[2], 2).onDrop(makeDragEvent())
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('flattens orderedKeys across tree children in data order', () => {
    const onDrop = vi.fn()
    const drag = useRowDragSort<TreeRow>({
      enabled: () => true,
      getRowKey: getTreeKey,
      dataSource: () => treeData,
      onDrop,
    })

    // c1 拖到 d1 上半部 → before：跨父移动到 p2 名下
    drag.getBindings(treeData[0].children![0], 0).onDragstart(makeDragEvent())
    drag.getBindings(treeData[1].children![0], 0).onDragover(rowOverEvent(10))
    drag.getBindings(treeData[1].children![0], 0).onDrop(makeDragEvent())

    expect(onDrop).toHaveBeenCalledTimes(1)
    const info = onDrop.mock.calls[0][1]
    // DFS 先序：父节点在前、子节点紧随其后，子节点跨父移动后随之归位
    expect(info.orderedKeys).toEqual(['p1', 'c2', 'c3', 'p2', 'c1', 'd1'])
  })

  it('honors custom childrenColumnName when flattening', () => {
    interface OrgRow extends Record<string, unknown> {
      key: string
      items?: OrgRow[]
    }
    const data: OrgRow[] = [
      { key: 'root1', items: [{ key: 'leaf1' }, { key: 'leaf2' }] },
      { key: 'root2' },
    ]
    const onDrop = vi.fn()
    const drag = useRowDragSort<OrgRow>({
      enabled: () => true,
      getRowKey: (record) => record.key,
      dataSource: () => data,
      childrenColumnName: () => 'items',
      onDrop,
    })

    // leaf2 拖到 root2 下半部 → after：leaf2 升为顶层
    drag.getBindings(data[0].items![1], 1).onDragstart(makeDragEvent())
    drag.getBindings(data[1], 1).onDragover(rowOverEvent(90))
    drag.getBindings(data[1], 1).onDrop(makeDragEvent())

    const [newData, info] = onDrop.mock.calls[0]
    expect((newData as OrgRow[]).map((row) => row.key)).toEqual(['root1', 'root2', 'leaf2'])
    expect(info.orderedKeys).toEqual(['root1', 'leaf1', 'root2', 'leaf2'])
  })

  it('lets customRow draggable:false opt a row out of dragging', () => {
    const { drag, onDrop } = setup()

    const optedOut = drag.getBindings(rows[0], 0, { draggable: false })
    expect(optedOut.draggable).toBe(false)

    // 拖不起：dragstart 不建立拖拽状态
    optedOut.onDragstart(makeDragEvent())
    expect(drag.draggingKey.value).toBeNull()

    // 也不是放置目标：其他行拖拽时落点/放置在它上面均无效，且不误清拖拽状态
    const source = drag.getBindings(rows[1], 1)
    source.onDragstart(makeDragEvent())
    expect(drag.draggingKey.value).toBe('b')

    optedOut.onDragover(rowOverEvent(0))
    expect(drag.dropTarget.value).toBeNull()
    optedOut.onDrop(makeDragEvent())
    expect(onDrop).not.toHaveBeenCalled()
    expect(drag.draggingKey.value).toBe('b')

    source.onDragend(makeDragEvent())
  })

  it('still chains user handlers on an opted-out row', () => {
    const { drag } = setup()
    const userOnDragstart = vi.fn()

    const bindings = drag.getBindings(rows[0], 0, {
      draggable: false,
      onDragstart: userOnDragstart,
    })
    bindings.onDragstart(makeDragEvent())

    expect(userOnDragstart).toHaveBeenCalledTimes(1)
    expect(drag.draggingKey.value).toBeNull()
  })

  it('dragend resets all state without emitting', () => {
    const { drag, onDrop } = setup()

    drag.getBindings(rows[0], 0).onDragstart(makeDragEvent())
    drag.getBindings(rows[0], 0).onDragend(makeDragEvent())
    expect(drag.draggingKey.value).toBeNull()
    expect(drag.dropTarget.value).toBeNull()
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('chains user handlers after the internal ones', () => {
    const { drag } = setup()
    const userOnDragstart = vi.fn()
    const userOnDragend = vi.fn()

    const bindings = drag.getBindings(rows[0], 0, {
      onDragstart: userOnDragstart,
      onDragend: userOnDragend,
    })
    bindings.onDragstart(makeDragEvent())
    expect(drag.draggingKey.value).toBe('a')
    expect(userOnDragstart).toHaveBeenCalledTimes(1)

    bindings.onDragend(makeDragEvent())
    expect(userOnDragend).toHaveBeenCalledTimes(1)
    expect(drag.draggingKey.value).toBeNull()
  })
})

describe('DropPosition type', () => {
  it('restricts to before/after', () => {
    const positions: DropPosition[] = ['before', 'after']
    expect(positions).toHaveLength(2)
  })
})
