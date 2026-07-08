import { computed, ref, watch, type Ref } from 'vue'
import type { Key, RowSelection } from '../types'

interface SelectionNode<TRecord extends Record<string, unknown>> {
  key: Key
  record: TRecord
  index: number
  level: number
  parentKey?: Key
  childrenKeys: Key[]
}

export interface SelectionState {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
}

export interface UseSelectionOptions<TRecord extends Record<string, unknown>> {
  rowSelection: () => RowSelection<TRecord> | undefined
  getRowKey: (record: TRecord, index: number) => Key
  data: () => TRecord[]
  visibleData: () => TRecord[]
  childrenColumnName?: () => string | undefined
  onSelectionChange?: () => void
}

function flattenSelectionNodes<TRecord extends Record<string, unknown>>(options: {
  data: TRecord[]
  childrenColumnName: string
  getRowKey: (record: TRecord, index: number) => Key
}): SelectionNode<TRecord>[] {
  const { data, childrenColumnName, getRowKey } = options
  const nodes: SelectionNode<TRecord>[] = []
  let flatIndex = 0

  function walk(records: TRecord[], level: number, parent?: SelectionNode<TRecord>) {
    records.forEach((record) => {
      const index = flatIndex
      const key = getRowKey(record, index)
      const children = record[childrenColumnName] as TRecord[] | undefined

      const node: SelectionNode<TRecord> = {
        key,
        record,
        index,
        level,
        parentKey: parent?.key,
        childrenKeys: [],
      }
      nodes.push(node)
      // 直接把自身 key 追加到父节点，避免递归返回后 findIndex 回查父节点（原实现是 O(n²)）
      parent?.childrenKeys.push(key)

      flatIndex += 1

      if (Array.isArray(children) && children.length > 0) {
        walk(children, level + 1, node)
      }
    })
  }

  walk(data, 0)

  return nodes
}

function flattenStrictSelectionNodes<TRecord extends Record<string, unknown>>(options: {
  data: TRecord[]
  getRowKey: (record: TRecord, index: number) => Key
}): SelectionNode<TRecord>[] {
  return options.data.map((record, index) => ({
    key: options.getRowKey(record, index),
    record,
    index,
    level: 0,
    childrenKeys: [],
  }))
}

export function useSelection<TRecord extends Record<string, unknown>>(
  options: UseSelectionOptions<TRecord>,
) {
  const { rowSelection, getRowKey, data, visibleData, childrenColumnName, onSelectionChange } =
    options

  const innerSelectedKeys = ref<Set<Key>>(new Set()) as Ref<Set<Key>>
  const hasInitializedDefaultKeys = ref(false)
  const lastShiftAnchorKey = ref<Key | null>(null)

  watch(
    () => rowSelection()?.defaultSelectedRowKeys,
    (keys) => {
      if (hasInitializedDefaultKeys.value || !keys?.length) return
      innerSelectedKeys.value = new Set(keys)
      hasInitializedDefaultKeys.value = true
    },
    { immediate: true },
  )

  function isControlled(): boolean {
    return rowSelection()?.selectedRowKeys !== undefined
  }

  const isTreeSelectionEnabled = computed(() => rowSelection()?.checkStrictly === false)

  const allNodes = computed(() =>
    isTreeSelectionEnabled.value
      ? flattenSelectionNodes({
          data: data(),
          childrenColumnName: childrenColumnName?.() ?? 'children',
          getRowKey,
        })
      : flattenStrictSelectionNodes({
          data: data(),
          getRowKey,
        }),
  )

  const nodeMap = computed(() => {
    const map = new Map<Key, SelectionNode<TRecord>>()
    allNodes.value.forEach((node) => map.set(node.key, node))
    return map
  })

  const rootNodeKeys = computed(() =>
    allNodes.value.filter((node) => node.parentKey === undefined).map((node) => node.key),
  )

  function isDisabled(record: TRecord): boolean {
    return rowSelection()?.getCheckboxProps?.(record)?.disabled ?? false
  }

  function getChildrenKeys(key: Key): Key[] {
    return nodeMap.value.get(key)?.childrenKeys ?? []
  }

  /**
   * 每个节点 → 其全部「可选中后代」key（跳过 disabled 子树，与原 collectDescendants 语义一致）。
   *
   * 一次性自底向上构建（allNodes 为前序，逆序遍历即可保证后代先于祖先处理），
   * 取代原先 getSelectionState 里逐单元格逐行的子树 DFS —— 把整表 O(n²) 降为构建期 O(n)、
   * 读取期 O(1)。依赖 allNodes（树拓扑）与 isDisabled（经 rowSelection），Vue 自动管理失效。
   */
  const selectableDescendantsMap = computed(() => {
    const nm = nodeMap.value
    const memo = new Map<Key, Key[]>()
    const list = allNodes.value
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const node = list[i]
      const acc: Key[] = []
      for (const childKey of node.childrenKeys) {
        const child = nm.get(childKey)
        if (!child || isDisabled(child.record)) continue
        acc.push(childKey)
        const childDesc = memo.get(childKey)
        if (childDesc) acc.push(...childDesc)
      }
      memo.set(node.key, acc)
    }
    return memo
  })

  function normalizeTreeSelection(inputKeys: Set<Key>): Set<Key> {
    if (rowSelection()?.checkStrictly !== false) {
      return new Set(inputKeys)
    }

    const nextKeys = new Set(inputKeys)

    const visit = (key: Key) => {
      const childKeys = getChildrenKeys(key)
      childKeys.forEach(visit)

      const node = nodeMap.value.get(key)
      if (!node || isDisabled(node.record)) return

      const selectableChildren = childKeys
        .map((childKey) => nodeMap.value.get(childKey))
        .filter((child): child is SelectionNode<TRecord> => !!child && !isDisabled(child.record))

      if (selectableChildren.length === 0) return

      const allSelected = selectableChildren.every((child) => nextKeys.has(child.key))
      if (allSelected) {
        nextKeys.add(key)
      } else {
        nextKeys.delete(key)
      }
    }

    rootNodeKeys.value.forEach(visit)

    return nextKeys
  }

  const selectedKeySet = computed<Set<Key>>(() => {
    const sel = rowSelection()
    const base =
      sel?.selectedRowKeys !== undefined ? new Set(sel.selectedRowKeys) : innerSelectedKeys.value
    return normalizeTreeSelection(base)
  })

  watch(
    [allNodes, () => rowSelection()?.preserveSelectedRowKeys],
    () => {
      if (isControlled() || rowSelection()?.preserveSelectedRowKeys) return

      const currentKeys = new Set(allNodes.value.map((node) => node.key))
      const nextKeys = new Set(
        Array.from(innerSelectedKeys.value).filter((key) => currentKeys.has(key)),
      )

      if (nextKeys.size !== innerSelectedKeys.value.size) {
        innerSelectedKeys.value = nextKeys
      }
    },
    { immediate: true },
  )

  function isSelected(key: Key): boolean {
    return selectedKeySet.value.has(key)
  }

  function getSelectedRows(keys: Set<Key>): TRecord[] {
    return allNodes.value.filter((node) => keys.has(node.key)).map((node) => node.record)
  }

  function getVisibleNodes(): SelectionNode<TRecord>[] {
    return visibleData()
      .map((record, index) => nodeMap.value.get(getRowKey(record, index)) ?? null)
      .filter((node): node is SelectionNode<TRecord> => node !== null)
  }

  function getVisibleSelectableNodes(): SelectionNode<TRecord>[] {
    return getVisibleNodes().filter((node) => !isDisabled(node.record))
  }

  function getSelectableNodes(): SelectionNode<TRecord>[] {
    return allNodes.value.filter((node) => !isDisabled(node.record))
  }

  function getSelectionState(record: TRecord, index: number): SelectionState {
    const key = getRowKey(record, index)
    const checked = isSelected(key)
    const disabled = isDisabled(record)

    if (rowSelection()?.checkStrictly !== false) {
      return {
        checked,
        indeterminate: false,
        disabled,
      }
    }

    const descendants = selectableDescendantsMap.value.get(key) ?? []

    if (descendants.length === 0) {
      return {
        checked,
        indeterminate: false,
        disabled,
      }
    }

    const checkedCount = descendants.filter((childKey) => selectedKeySet.value.has(childKey)).length

    return {
      checked,
      indeterminate: checkedCount > 0 && checkedCount < descendants.length,
      disabled,
    }
  }

  function applyKeys(nextKeys: Set<Key>, triggerChange: boolean) {
    const normalizedKeys = normalizeTreeSelection(nextKeys)

    if (!isControlled()) {
      innerSelectedKeys.value = normalizedKeys
    }

    if (triggerChange) {
      const keysArray = Array.from(normalizedKeys)
      const selectedRows = getSelectedRows(normalizedKeys)
      rowSelection()?.onChange?.(keysArray, selectedRows)
      onSelectionChange?.()
    }
  }

  function toggleSubtree(key: Key, nextKeys: Set<Key>, selected: boolean, changedRows: TRecord[]) {
    const node = nodeMap.value.get(key)
    if (!node || isDisabled(node.record)) return

    const hadKey = nextKeys.has(key)
    if (selected) {
      nextKeys.add(key)
    } else {
      nextKeys.delete(key)
    }

    if (hadKey !== selected) {
      changedRows.push(node.record)
    }

    getChildrenKeys(key).forEach((childKey) =>
      toggleSubtree(childKey, nextKeys, selected, changedRows),
    )
  }

  function toggleStrictRow(record: TRecord, index: number, nativeEvent?: MouseEvent) {
    const sel = rowSelection()
    if (!sel) return

    const key = getRowKey(record, index)
    const selected = !isSelected(key)

    if (
      sel.type !== 'radio' &&
      nativeEvent?.shiftKey &&
      lastShiftAnchorKey.value !== null &&
      rowSelection()?.checkStrictly !== false
    ) {
      const visibleSelectableNodes = getVisibleSelectableNodes()
      const currentIndex = visibleSelectableNodes.findIndex((node) => node.key === key)
      const anchorIndex = visibleSelectableNodes.findIndex(
        (node) => node.key === lastShiftAnchorKey.value,
      )

      if (currentIndex !== -1 && anchorIndex !== -1) {
        const [start, end] =
          currentIndex > anchorIndex ? [anchorIndex, currentIndex] : [currentIndex, anchorIndex]
        const nextKeys = new Set(selectedKeySet.value)
        const changedRows: TRecord[] = []

        visibleSelectableNodes.slice(start, end + 1).forEach((node) => {
          const hadKey = nextKeys.has(node.key)

          if (selected) {
            nextKeys.add(node.key)
          } else {
            nextKeys.delete(node.key)
          }

          if (hadKey !== selected) {
            changedRows.push(node.record)
          }
        })

        applyKeys(nextKeys, true)
        sel.onSelectMultiple?.(selected, getSelectedRows(nextKeys), changedRows)
        lastShiftAnchorKey.value = key
        return
      }
    }

    if (sel.type === 'radio') {
      const nextKeys = selected ? new Set<Key>([key]) : new Set<Key>()
      applyKeys(nextKeys, true)
      sel.onSelect?.(record, selected, getSelectedRows(nextKeys))
      lastShiftAnchorKey.value = key
      return
    }

    const nextKeys = new Set(selectedKeySet.value)
    if (selected) {
      nextKeys.add(key)
    } else {
      nextKeys.delete(key)
    }

    applyKeys(nextKeys, true)
    sel.onSelect?.(record, selected, getSelectedRows(nextKeys))
    lastShiftAnchorKey.value = key
  }

  function toggleTreeRow(record: TRecord, index: number) {
    const sel = rowSelection()
    if (!sel) return

    const key = getRowKey(record, index)
    const selected = !isSelected(key)
    const nextKeys = new Set(selectedKeySet.value)
    const changedRows: TRecord[] = []

    toggleSubtree(key, nextKeys, selected, changedRows)
    applyKeys(nextKeys, true)
    sel.onSelect?.(record, selected, getSelectedRows(nextKeys))
    lastShiftAnchorKey.value = key
  }

  function toggleRow(record: TRecord, index: number, nativeEvent?: MouseEvent): void {
    if (isDisabled(record)) return
    const sel = rowSelection()
    if (!sel) return

    if (sel.checkStrictly === false && sel.type !== 'radio') {
      toggleTreeRow(record, index)
      return
    }

    toggleStrictRow(record, index, nativeEvent)
  }

  function toggleAll(selected: boolean): void {
    const sel = rowSelection()
    if (!sel) return

    const selectableNodes = getSelectableNodes()
    const nextKeys = new Set(selectedKeySet.value)
    const changeRows: TRecord[] = []

    selectableNodes.forEach((node) => {
      const hadKey = nextKeys.has(node.key)

      if (selected) {
        nextKeys.add(node.key)
      } else {
        nextKeys.delete(node.key)
      }

      if (hadKey !== selected) {
        changeRows.push(node.record)
      }
    })

    applyKeys(nextKeys, true)
    sel.onSelectAll?.(selected, getSelectedRows(nextKeys), changeRows)
  }

  const allCheckedState = computed<'all' | 'partial' | 'none'>(() => {
    const selectableNodes = getVisibleSelectableNodes()
    if (selectableNodes.length === 0) return 'none'

    const checkedCount = selectableNodes.filter((node) => selectedKeySet.value.has(node.key)).length

    if (checkedCount === 0) return 'none'
    if (checkedCount === selectableNodes.length) return 'all'
    return 'partial'
  })

  function invertSelection(): void {
    const sel = rowSelection()
    if (!sel) return

    const selectableNodes = getVisibleSelectableNodes()
    const nextKeys = new Set(selectedKeySet.value)

    selectableNodes.forEach((node) => {
      if (nextKeys.has(node.key)) {
        nextKeys.delete(node.key)
      } else {
        nextKeys.add(node.key)
      }
    })

    applyKeys(nextKeys, true)
    sel.onSelectInvert?.(Array.from(normalizeTreeSelection(nextKeys)))
  }

  function clearSelection(): void {
    const sel = rowSelection()
    if (!sel) return

    applyKeys(new Set<Key>(), true)
    sel.onSelectNone?.()
  }

  function getChangeableRowKeys(): Key[] {
    return getVisibleSelectableNodes().map((node) => node.key)
  }

  return {
    selectedKeySet,
    isSelected,
    isDisabled,
    getSelectionState,
    toggleRow,
    toggleAll,
    allCheckedState,
    invertSelection,
    clearSelection,
    getChangeableRowKeys,
  }
}
