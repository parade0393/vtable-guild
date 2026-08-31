import { computed, ref, type Ref } from 'vue'
import type { Key, RowDragSortInfo } from '../types'

/** 拖拽放置位置：目标行的前 / 后 */
export type DropPosition = 'before' | 'after'

export interface RowDragDropTarget {
  key: Key
  position: DropPosition
}

/** 行拖拽状态对应的 class（trDragging / trDropAbove / trDropBelow） */
export function resolveRowDragClass(
  rowDrag:
    | {
        draggingKey: Ref<Key | null>
        dropTarget: Ref<RowDragDropTarget | null>
      }
    | undefined,
  key: Key,
  slots:
    | { trDragging: () => string; trDropAbove: () => string; trDropBelow: () => string }
    | undefined,
): string {
  if (!rowDrag || !slots) return ''
  if (rowDrag.draggingKey.value === key) return slots.trDragging()
  const target = rowDrag.dropTarget.value
  if (!target || target.key !== key) return ''
  return target.position === 'before' ? slots.trDropAbove() : slots.trDropBelow()
}

export interface UseRowDragSortOptions<TRecord extends Record<string, unknown>> {
  /** 是否启用行拖拽（对应 rowDraggable prop） */
  enabled: () => boolean
  /** 行 key 解析器（与表格 getRowKey 同源） */
  getRowKey: (record: TRecord, index: number) => Key
  /** 数据源（拖放后在它上面搬移，重排结果交给外部更新） */
  dataSource: () => TRecord[]
  /** 树形数据子节点字段名；缺省 'children' */
  childrenColumnName?: () => string | undefined
  /** 拖放完成且顺序有变化时回调 */
  onDrop?: (newData: TRecord[], info: RowDragSortInfo) => void
}

/**
 * 在树结构中按 key 定位节点：返回包含它的数组从根起的下标路径（[] 表示顶层）、
 * 在该数组中的下标与节点引用。找不到返回 null。
 */
export interface TreeLocation<TRecord> {
  listPath: number[]
  index: number
  node: TRecord
}

function locateNode<TRecord extends Record<string, unknown>>(
  records: readonly TRecord[],
  key: Key,
  getKey: (record: TRecord, index: number) => Key,
  childrenColumnName: string,
): TreeLocation<TRecord> | null {
  const walk = (list: readonly TRecord[], listPath: number[]): TreeLocation<TRecord> | null => {
    for (let index = 0; index < list.length; index += 1) {
      if (getKey(list[index], index) === key) {
        return { listPath, index, node: list[index] }
      }
      const children = (list[index] as Record<string, unknown>)[childrenColumnName]
      if (Array.isArray(children)) {
        const found = walk(children, [...listPath, index])
        if (found) return found
      }
    }
    return null
  }
  return walk(records, [])
}

function isInSubtree<TRecord extends Record<string, unknown>>(
  node: TRecord,
  key: Key,
  getKey: (record: TRecord, index: number) => Key,
  childrenColumnName: string,
): boolean {
  const children = node[childrenColumnName]
  if (!Array.isArray(children)) return false
  return children.some(
    (child, index) =>
      getKey(child, index) === key || isInSubtree(child, key, getKey, childrenColumnName),
  )
}

/**
 * 按 childrenColumnName 递归展平（DFS 先序：父节点在前、子节点紧随其后），
 * 平铺数据退化为一次 map。getKey 的 index 参数取节点所在列表内的下标，
 * 与 locateNode 的约定一致。
 */
function flattenRowKeys<TRecord extends Record<string, unknown>>(
  records: readonly TRecord[],
  getKey: (record: TRecord, index: number) => Key,
  childrenColumnName: string,
): Key[] {
  const keys: Key[] = []
  const walk = (list: readonly TRecord[]) => {
    list.forEach((record, index) => {
      keys.push(getKey(record, index))
      const children = record[childrenColumnName]
      if (Array.isArray(children)) walk(children as TRecord[])
    })
  }
  walk(records)
  return keys
}

/**
 * 沿 listPath（[] 表示根列表本身）找到目标 children 数组并做替换；
 * 路径上的每一层 children 数组与父节点对象都被浅拷贝，其余节点保持原引用。
 */
function updateListAlongPath<TRecord extends Record<string, unknown>>(
  list: readonly TRecord[],
  listPath: readonly number[],
  childrenColumnName: string,
  update: (cloned: TRecord[]) => TRecord[],
): TRecord[] {
  if (listPath.length === 0) return update([...list])

  const [head, ...rest] = listPath
  const cloned = [...list]
  const node = cloned[head] as Record<string, unknown>
  const children = node[childrenColumnName]
  if (!Array.isArray(children)) return cloned
  // 仅在节点副本上覆写 childrenColumnName 字段,其余字段保持原值
  cloned[head] = {
    ...node,
    [childrenColumnName]: updateListAlongPath(
      children as TRecord[],
      rest,
      childrenColumnName,
      update,
    ),
  } as TRecord
  return cloned
}

/**
 * 树感知的节点搬移：把 draggedKey 节点搬到 targetKey 节点的前 / 后，
 * 即插入到目标节点的**同级位置**——目标在顶层就回到顶层，目标是某父的子节点
 * 就变成该父的子节点（跨父移动）。节点自身携带整棵子树；平铺数据自然退化为
 * 普通的前后插入。
 *
 * 返回 null 表示不需要更新：找不到节点、拖到自己 / 自己的子树里、或插回原位。
 * 纯函数不修改入参；仅拖拽路径上的 children 数组与父节点对象被克隆，其余节点
 * 保持原引用，选择 / 展开等按 record 引用或 key 记录的状态因此不受影响。
 */
export function moveTreeNode<TRecord extends Record<string, unknown>>(
  records: readonly TRecord[],
  getKey: (record: TRecord, index: number) => Key,
  draggedKey: Key,
  targetKey: Key,
  position: DropPosition,
  childrenColumnName: string = 'children',
): TRecord[] | null {
  if (draggedKey === targetKey) return null

  const draggedLoc = locateNode(records, draggedKey, getKey, childrenColumnName)
  const targetLoc = locateNode(records, targetKey, getKey, childrenColumnName)
  if (!draggedLoc || !targetLoc) return null

  // 环防护：目标不能位于拖拽节点的子树内
  if (isInSubtree(draggedLoc.node, targetKey, getKey, childrenColumnName)) return null

  // 同一父列表下拖到相邻位置 = 插回原位
  const sameList =
    draggedLoc.listPath.length === targetLoc.listPath.length &&
    draggedLoc.listPath.every((value, index) => value === targetLoc.listPath[index])
  if (
    sameList &&
    ((position === 'after' && targetLoc.index === draggedLoc.index - 1) ||
      (position === 'before' && targetLoc.index === draggedLoc.index + 1))
  ) {
    return null
  }

  // 1) 从原位置移除（沿路径克隆）
  const removed = updateListAlongPath(
    records as TRecord[],
    draggedLoc.listPath,
    childrenColumnName,
    (list) => list.filter((_, index) => index !== draggedLoc.index),
  )

  // 2) 在新树上重新定位目标再插入，避免移除造成的下标失效
  const freshTargetLoc = locateNode(removed, targetKey, getKey, childrenColumnName)
  if (!freshTargetLoc) return null

  return updateListAlongPath(removed, freshTargetLoc.listPath, childrenColumnName, (list) => {
    const inserted = [...list]
    inserted.splice(freshTargetLoc.index + (position === 'after' ? 1 : 0), 0, draggedLoc.node)
    return inserted
  })
}

/** 拖拽行绑到 <tr> 上的 props。禁用时 draggable 为 false、事件仅透传用户 handler。 */
export interface RowDragBindings {
  draggable: boolean
  onDragstart: (event: DragEvent) => void
  onDragover: (event: DragEvent) => void
  onDragleave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
  onDragend: (event: DragEvent) => void
}

/**
 * 行拖拽排序（原生 HTML5 拖放）。
 *
 * 仅负责交互状态与拖放结果计算：drop 时在 dataSource 上搬移行并通过
 * onDrop 交给外部更新（受控模式，与 dataSource 为 prop 的数据流一致）。
 * 拖拽态 class（trDragging / trDropAbove / trDropBelow）由行组件根据
 * draggingKey / dropTarget 拼进 rowClass。
 */
export function useRowDragSort<TRecord extends Record<string, unknown>>(
  options: UseRowDragSortOptions<TRecord>,
) {
  const draggingKey: Ref<Key | null> = ref(null)
  const dropTarget = ref<RowDragDropTarget | null>(null)

  /** 拖拽进行中（供 hover 高亮抑制等场景读取） */
  const isDragging = computed(() => draggingKey.value !== null)

  function handleDragStart(record: TRecord, index: number, event: DragEvent) {
    if (!options.enabled()) return
    draggingKey.value = options.getRowKey(record, index)
    // Firefox 要求 setData 才会真正发起拖拽；测试环境可能没有 dataTransfer
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(draggingKey.value))
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(record: TRecord, index: number, event: DragEvent) {
    if (draggingKey.value === null) return
    // 允许放置的必要条件
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    const key = options.getRowKey(record, index)
    if (key === draggingKey.value) {
      dropTarget.value = null
      return
    }

    const rowEl = event.currentTarget as HTMLElement | null
    const rect = rowEl?.getBoundingClientRect()
    const position: DropPosition =
      rect && event.clientY >= rect.top + rect.height / 2 ? 'after' : 'before'

    const current = dropTarget.value
    if (!current || current.key !== key || current.position !== position) {
      dropTarget.value = { key, position }
    }
  }

  function handleDragLeave(record: TRecord, index: number) {
    if (draggingKey.value === null) return
    const key = options.getRowKey(record, index)
    if (dropTarget.value?.key === key) {
      dropTarget.value = null
    }
  }

  function handleDrop(event: DragEvent) {
    if (draggingKey.value === null) return
    event.preventDefault()

    const draggedKey = draggingKey.value
    const target = dropTarget.value
    // drop 之后不会再有 dragover，先清掉行内高亮；dragend 兜底重置（幂等）
    draggingKey.value = null
    dropTarget.value = null

    if (!target) return

    const childrenColumn = options.childrenColumnName?.() || 'children'
    const source = options.dataSource()
    const newData = moveTreeNode(
      source,
      options.getRowKey,
      draggedKey,
      target.key,
      target.position,
      childrenColumn,
    )
    if (!newData) return

    options.onDrop?.(newData, {
      draggedKey,
      targetKey: target.key,
      orderedKeys: flattenRowKeys(newData, options.getRowKey, childrenColumn),
    })
  }

  function handleDragEnd() {
    draggingKey.value = null
    dropTarget.value = null
  }

  /**
   * 生成拖拽行 props（draggable + 拖拽事件）。
   *
   * 传入用户 customRow 产物时，同名事件先走内部逻辑再链式调用用户 handler
   * （与 TableCell 的 chainEnter/chainLeave 惯例一致）。未启用时 draggable 为
   * false 且内部逻辑全部短路，仅保留用户 handler 的透传。
   *
   * 行级退出：userProps.draggable === false 的行不参与拖拽——不可拖起、也不作为
   * 放置目标，用户 handler 照常透传。
   */
  function getBindings(
    record: TRecord,
    index: number,
    userProps?: Record<string, unknown>,
  ): RowDragBindings {
    const enabled = options.enabled()
    const rowEnabled = enabled && userProps?.draggable !== false

    const callUser = (name: string, event: Event) => {
      const handler = userProps?.[name]
      if (typeof handler === 'function') handler(event)
    }

    return {
      draggable: rowEnabled,
      onDragstart: (event) => {
        if (rowEnabled) handleDragStart(record, index, event)
        callUser('onDragstart', event)
      },
      onDragover: (event) => {
        if (rowEnabled) handleDragOver(record, index, event)
        callUser('onDragover', event)
      },
      onDragleave: (event) => {
        if (rowEnabled) handleDragLeave(record, index)
        callUser('onDragleave', event)
      },
      onDrop: (event) => {
        if (rowEnabled) handleDrop(event)
        callUser('onDrop', event)
      },
      onDragend: (event) => {
        if (rowEnabled) handleDragEnd()
        callUser('onDragend', event)
      },
    }
  }

  return {
    draggingKey,
    dropTarget,
    isDragging,
    getBindings,
  }
}
