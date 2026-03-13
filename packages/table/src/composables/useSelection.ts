import { computed, ref, type Ref } from 'vue'
import type { Key, RowSelection } from '../types'

export interface UseSelectionOptions {
  rowSelection: () => RowSelection | undefined
  getRowKey: (record: Record<string, unknown>, index: number) => Key
  data: () => Record<string, unknown>[]
  onSelectionChange?: () => void
}

export function useSelection(options: UseSelectionOptions) {
  const { rowSelection, getRowKey, data, onSelectionChange } = options

  // ---- 非受控状态 ----
  const innerSelectedKeys = ref<Set<Key>>(new Set()) as Ref<Set<Key>>

  // 初始化 defaultSelectedRowKeys
  const initKeys = rowSelection()?.defaultSelectedRowKeys
  if (initKeys?.length) {
    innerSelectedKeys.value = new Set(initKeys)
  }

  function isControlled(): boolean {
    return rowSelection()?.selectedRowKeys !== undefined
  }

  const selectedKeySet = computed<Set<Key>>(() => {
    const sel = rowSelection()
    if (!sel) return new Set()
    if (sel.selectedRowKeys !== undefined) return new Set(sel.selectedRowKeys)
    return innerSelectedKeys.value
  })

  function isSelected(key: Key): boolean {
    return selectedKeySet.value.has(key)
  }

  function isDisabled(record: Record<string, unknown>): boolean {
    return rowSelection()?.getCheckboxProps?.(record)?.disabled ?? false
  }

  function getSelectableRows(): Record<string, unknown>[] {
    return data().filter((r) => !isDisabled(r))
  }

  function getSelectedRows(keys: Set<Key>): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = []
    data().forEach((record, index) => {
      if (keys.has(getRowKey(record, index))) rows.push(record)
    })
    return rows
  }

  function applyKeys(nextKeys: Set<Key>, triggerChange: boolean) {
    if (!isControlled()) {
      innerSelectedKeys.value = nextKeys
    }
    if (triggerChange) {
      const keysArray = Array.from(nextKeys)
      const selectedRows = getSelectedRows(nextKeys)
      rowSelection()?.onChange?.(keysArray, selectedRows)
      onSelectionChange?.()
    }
  }

  function toggleRow(record: Record<string, unknown>, index: number): void {
    if (isDisabled(record)) return
    const sel = rowSelection()
    if (!sel) return

    const key = getRowKey(record, index)
    const isRadio = sel.type === 'radio'

    if (isRadio) {
      const nextKeys = new Set<Key>([key])
      const selected = !isSelected(key)
      applyKeys(nextKeys, true)
      sel.onSelect?.(record, selected, getSelectedRows(nextKeys))
      return
    }

    const nextKeys = new Set(selectedKeySet.value)
    const selected = !isSelected(key)
    if (selected) {
      nextKeys.add(key)
    } else {
      nextKeys.delete(key)
    }
    applyKeys(nextKeys, true)
    sel.onSelect?.(record, selected, getSelectedRows(nextKeys))
  }

  function toggleAll(selected: boolean): void {
    const sel = rowSelection()
    if (!sel) return

    const selectableRows = getSelectableRows()
    const nextKeys = new Set(selectedKeySet.value)
    const changeRows: Record<string, unknown>[] = []

    if (selected) {
      selectableRows.forEach((record, _i) => {
        const realIndex = data().indexOf(record)
        const key = getRowKey(record, realIndex)
        if (!nextKeys.has(key)) {
          nextKeys.add(key)
          changeRows.push(record)
        }
      })
    } else {
      selectableRows.forEach((record, _i) => {
        const realIndex = data().indexOf(record)
        const key = getRowKey(record, realIndex)
        if (nextKeys.has(key)) {
          nextKeys.delete(key)
          changeRows.push(record)
        }
      })
    }

    applyKeys(nextKeys, true)
    sel.onSelectAll?.(selected, getSelectedRows(nextKeys), changeRows)
  }

  const allCheckedState = computed<'all' | 'partial' | 'none'>(() => {
    const selectableRows = getSelectableRows()
    if (selectableRows.length === 0) return 'none'

    let checkedCount = 0
    selectableRows.forEach((record) => {
      const realIndex = data().indexOf(record)
      const key = getRowKey(record, realIndex)
      if (selectedKeySet.value.has(key)) checkedCount++
    })

    if (checkedCount === 0) return 'none'
    if (checkedCount === selectableRows.length) return 'all'
    return 'partial'
  })

  return {
    selectedKeySet,
    isSelected,
    isDisabled,
    toggleRow,
    toggleAll,
    allCheckedState,
  }
}
