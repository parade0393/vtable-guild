import { describe, expect, it, vi } from 'vitest'
import { useSelection } from './useSelection'
import type { RowSelection } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  disabled?: boolean
}

interface TreeRow extends DemoRow {
  children?: TreeRow[]
}

const strictData: DemoRow[] = [
  { key: '1', name: 'Alpha' },
  { key: '2', name: 'Beta' },
  { key: '3', name: 'Gamma', disabled: true },
]

const treeData: TreeRow[] = [
  {
    key: 'parent',
    name: 'Parent',
    children: [
      { key: 'child-1', name: 'Child 1' },
      { key: 'child-2', name: 'Child 2' },
    ],
  },
]

describe('useSelection', () => {
  it('toggles rows and batch operations in strict checkbox mode', () => {
    const onChange = vi.fn()
    const onSelectAll = vi.fn()
    const onSelectInvert = vi.fn()
    const onSelectNone = vi.fn()
    const selection: RowSelection<DemoRow> = {
      onChange,
      onSelectAll,
      onSelectInvert,
      onSelectNone,
      getCheckboxProps: (record) => ({ disabled: record.disabled }),
    }

    const api = useSelection<DemoRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => strictData,
      visibleData: () => strictData,
    })

    api.toggleRow(strictData[0], 0)
    expect(Array.from(api.selectedKeySet.value)).toEqual(['1'])
    expect(api.getSelectionState(strictData[0], 0)).toMatchObject({
      checked: true,
      indeterminate: false,
    })

    api.toggleAll(true)
    expect(Array.from(api.selectedKeySet.value).sort()).toEqual(['1', '2'])
    expect(api.allCheckedState.value).toBe('all')
    expect(onSelectAll).toHaveBeenCalledWith(true, expect.any(Array), expect.any(Array))

    api.invertSelection()
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
    expect(api.allCheckedState.value).toBe('none')
    expect(onSelectInvert).toHaveBeenCalledWith([])

    api.clearSelection()
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
    expect(onSelectNone).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalled()
    expect(api.isDisabled(strictData[2])).toBe(true)
  })

  it('normalizes parent-child selection when checkStrictly is false', () => {
    const selection: RowSelection<TreeRow> = {
      checkStrictly: false,
      getCheckboxProps: () => ({}),
    }

    const api = useSelection<TreeRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => treeData,
    })

    api.toggleRow(treeData[0].children![0], 1)

    expect(Array.from(api.selectedKeySet.value)).toEqual(['child-1'])
    expect(api.getSelectionState(treeData[0], 0)).toMatchObject({
      checked: false,
      indeterminate: true,
      disabled: false,
    })

    api.toggleRow(treeData[0].children![1], 2)

    expect(Array.from(api.selectedKeySet.value).sort()).toEqual(['child-1', 'child-2', 'parent'])
    expect(api.getSelectionState(treeData[0], 0)).toMatchObject({
      checked: true,
      indeterminate: false,
      disabled: false,
    })
  })

  it('emits next keys in controlled radio mode without mutating local state', () => {
    const onChange = vi.fn()
    const selection: RowSelection<DemoRow> = {
      type: 'radio',
      selectedRowKeys: ['2'],
      getCheckboxProps: (record) => ({ disabled: record.disabled }),
      onChange,
    }

    const api = useSelection<DemoRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => strictData,
      visibleData: () => strictData,
    })

    api.toggleRow(strictData[0], 0)

    expect(onChange).toHaveBeenCalledWith(['1'], [strictData[0]])
    expect(Array.from(api.selectedKeySet.value)).toEqual(['2'])
    expect(api.getChangeableRowKeys()).toEqual(['1', '2'])
  })
})
