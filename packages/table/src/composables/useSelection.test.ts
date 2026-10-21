import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
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

/** 树形数据展开后的可见行（父 + 两个子），用于喂 visibleData */
const treeVisibleRows: TreeRow[] = [treeData[0], treeData[0].children![0], treeData[0].children![1]]

describe('useSelection', () => {
  it('preserves controlled off-page records until the parent accepts a clear request', async () => {
    const scope = effectScope()
    const data = shallowRef([strictData[0]])
    const selectedRowKeys = ref(['1'])
    const onChange = vi.fn()
    const api = scope.run(() =>
      useSelection<DemoRow>({
        rowSelection: () => ({
          selectedRowKeys: selectedRowKeys.value,
          preserveSelectedRowKeys: true,
          onChange,
        }),
        getRowKey: (record) => record.key,
        data: () => data.value,
        visibleData: () => data.value,
        paginate: () => true,
      }),
    )!
    try {
      data.value = [strictData[1]]
      await nextTick()
      api.clearSelection()
      expect(onChange).toHaveBeenLastCalledWith([], [])
      expect(api.isSelected('1')).toBe(true)

      // The parent has not accepted the clear request, so row 1 is still selected.
      api.toggleRow(strictData[1], 0)
      expect(onChange).toHaveBeenLastCalledWith(
        ['1', '2'],
        expect.arrayContaining([strictData[0], strictData[1]]),
      )

      selectedRowKeys.value = ['1', '2']
      data.value = []
      await nextTick()
      api.toggleAll(true)
      expect(onChange).toHaveBeenLastCalledWith(
        ['1', '2'],
        expect.arrayContaining([strictData[0], strictData[1]]),
      )

      // Once the parent accepts clearing, old off-page records must be evicted.
      api.clearSelection()
      selectedRowKeys.value = []
      await nextTick()
      selectedRowKeys.value = ['1']
      await nextTick()
      api.toggleAll(true)
      expect(onChange).toHaveBeenLastCalledWith(['1'], [])
    } finally {
      scope.stop()
    }
  })

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

  it('does not cascade tree children in strict checkbox mode', () => {
    const onChange = vi.fn()
    const selection: RowSelection<TreeRow> = {
      checkStrictly: true,
      onChange,
    }

    const api = useSelection<TreeRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => treeData,
    })

    api.toggleRow(treeData[0], 0)

    expect(Array.from(api.selectedKeySet.value)).toEqual(['parent'])
    expect(onChange).toHaveBeenCalledWith(['parent'], [treeData[0]])
    expect(api.getSelectionState(treeData[0], 0)).toMatchObject({
      checked: true,
      indeterminate: false,
    })
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

    api.toggleRow(treeData[0], 0)
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
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

  it('propagates indeterminate state across deep trees and skips disabled descendants', () => {
    const deepTree: TreeRow[] = [
      {
        key: 'root',
        name: 'Root',
        children: [
          {
            key: 'branch',
            name: 'Branch',
            children: [
              { key: 'leaf-1', name: 'Leaf 1' },
              { key: 'leaf-2', name: 'Leaf 2' },
              { key: 'leaf-disabled', name: 'Leaf Disabled', disabled: true },
            ],
          },
        ],
      },
    ]
    const selection: RowSelection<TreeRow> = {
      checkStrictly: false,
      getCheckboxProps: (record) => ({ disabled: record.disabled }),
    }

    const api = useSelection<TreeRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => deepTree,
      visibleData: () => deepTree,
    })

    const branch = deepTree[0].children![0]
    api.toggleRow(branch.children![0], 2)

    // 只选一个叶子：branch 和 root 都应为半选（禁用叶子不参与统计）
    expect(api.getSelectionState(branch, 1)).toMatchObject({ checked: false, indeterminate: true })
    expect(api.getSelectionState(deepTree[0], 0)).toMatchObject({
      checked: false,
      indeterminate: true,
    })

    api.toggleRow(branch.children![1], 3)

    // 两个可选叶子全选：branch/root 级联为选中，禁用叶子保持未选
    expect(Array.from(api.selectedKeySet.value).sort()).toEqual([
      'branch',
      'leaf-1',
      'leaf-2',
      'root',
    ])
    expect(api.getSelectionState(deepTree[0], 0)).toMatchObject({
      checked: true,
      indeterminate: false,
    })
    expect(api.isSelected('leaf-disabled')).toBe(false)
  })

  it('indexes every descendant for tree data with default checkStrictly', () => {
    const onChange = vi.fn()
    // 不传 checkStrictly（默认 true）：只应关掉父子联动，不该丢掉子孙节点
    const selection: RowSelection<TreeRow> = { onChange }

    const api = useSelection<TreeRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => treeVisibleRows,
    })

    // 选子行：keys 与 selectedRows 都必须包含该子记录（修复前 selectedRows 是 []）
    api.toggleRow(treeData[0].children![0], 1)
    expect(onChange).toHaveBeenCalledWith(['child-1'], [treeData[0].children![0]])
    expect(api.isSelected('child-1')).toBe(true)

    // 全选：子孙键全部入选，表头状态为 all，每个子行复选框都是勾选
    api.toggleAll(true)
    expect(Array.from(api.selectedKeySet.value).sort()).toEqual(['child-1', 'child-2', 'parent'])
    expect(api.allCheckedState.value).toBe('all')
    // keys 顺序是「先已选中的 child-1，再全选补上 parent / child-2」，这里只校验集合
    const lastKeys = onChange.mock.calls.at(-1)![0]
    expect(lastKeys.slice().sort()).toEqual(['child-1', 'child-2', 'parent'])
    // selectedRows 按建索引的前序返回：父 → 子1 → 子2
    expect(onChange).toHaveBeenLastCalledWith(lastKeys, [
      treeData[0],
      treeData[0].children![0],
      treeData[0].children![1],
    ])
    treeVisibleRows.forEach((record, index) => {
      expect(api.getSelectionState(record, index).checked).toBe(true)
    })

    // 反选：子孙键跟着一起翻转
    api.invertSelection()
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
    api.invertSelection()
    expect(Array.from(api.selectedKeySet.value).sort()).toEqual(['child-1', 'child-2', 'parent'])
  })

  it('keeps flat-data strict behavior unchanged with default checkStrictly', () => {
    const onChange = vi.fn()
    const selection: RowSelection<DemoRow> = {
      onChange,
      getCheckboxProps: (record) => ({ disabled: record.disabled }),
    }

    const api = useSelection<DemoRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => strictData,
      visibleData: () => strictData,
    })

    api.toggleRow(strictData[0], 0)
    expect(onChange).toHaveBeenCalledWith(['1'], [strictData[0]])

    // 纯平铺数据仍然只有根级记录，禁用行不参与全选
    api.toggleAll(true)
    expect(Array.from(api.selectedKeySet.value)).toEqual(['1', '2'])
    expect(api.allCheckedState.value).toBe('all')
    expect(onChange).toHaveBeenLastCalledWith(['1', '2'], [strictData[0], strictData[1]])

    api.invertSelection()
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
    expect(api.getChangeableRowKeys()).toEqual(['1', '2'])
  })

  it('counts collapsed descendants in the unpaginated select-all state', () => {
    const api = useSelection<TreeRow>({
      rowSelection: () => ({}),
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => treeData,
    })

    api.toggleRow(treeData[0], 0)
    expect(api.allCheckedState.value).toBe('partial')

    api.toggleAll(true)
    expect(api.allCheckedState.value).toBe('all')
    api.toggleRow(treeData[0], 0)
    expect(Array.from(api.selectedKeySet.value)).toEqual(['child-1', 'child-2'])
    expect(api.allCheckedState.value).toBe('partial')

    api.toggleAll(false)
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
    expect(api.allCheckedState.value).toBe('none')
  })

  it('ignores disabled descendants and off-page rows in the select-all state', () => {
    const paginate = ref(false)
    const visible = shallowRef<TreeRow[]>(treeData)
    const api = useSelection<TreeRow>({
      rowSelection: () => ({
        getCheckboxProps: (record) => ({ disabled: record.key === 'child-2' }),
      }),
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => visible.value,
      paginate: () => paginate.value,
    })

    api.toggleAll(true)
    expect(Array.from(api.selectedKeySet.value)).toEqual(['parent', 'child-1'])
    expect(api.allCheckedState.value).toBe('all')

    paginate.value = true
    visible.value = [treeData[0].children![0]]
    api.toggleAll(false)
    expect(Array.from(api.selectedKeySet.value)).toEqual(['parent'])
    expect(api.allCheckedState.value).toBe('none')

    api.toggleAll(true)
    expect(api.allCheckedState.value).toBe('all')
  })

  it('keeps checkStrictly:false tree linkage unchanged without pagination', () => {
    const selection: RowSelection<TreeRow> = { checkStrictly: false }

    const api = useSelection<TreeRow>({
      rowSelection: () => selection,
      getRowKey: (record) => record.key,
      data: () => treeData,
      visibleData: () => treeVisibleRows,
    })

    // 勾父节点级联到子孙
    api.toggleRow(treeData[0], 0)
    expect(Array.from(api.selectedKeySet.value).sort()).toEqual(['child-1', 'child-2', 'parent'])
    expect(api.getSelectionState(treeData[0].children![0], 1)).toMatchObject({
      checked: true,
      indeterminate: false,
    })

    // 取消父节点级联取消子孙
    api.toggleRow(treeData[0], 0)
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
  })

  it('builds no nodes when rowSelection is disabled', () => {
    const api = useSelection<DemoRow>({
      rowSelection: () => undefined,
      getRowKey: (record) => record.key,
      data: () => strictData,
      visibleData: () => strictData,
    })

    // 未启用行选择时 allNodes 为空：没有可选节点、没有勾选态、切换无效
    expect(api.getChangeableRowKeys()).toEqual([])
    expect(api.allCheckedState.value).toBe('none')
    expect(api.getSelectionState(strictData[0], 0)).toMatchObject({
      checked: false,
      indeterminate: false,
    })

    api.toggleRow(strictData[0], 0)
    expect(Array.from(api.selectedKeySet.value)).toEqual([])
  })
})
