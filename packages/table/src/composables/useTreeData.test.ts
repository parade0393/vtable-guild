import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useTreeData } from './useTreeData'

interface TreeRow extends Record<string, unknown> {
  key: string
  name: string
  children?: TreeRow[]
}

const treeData: TreeRow[] = [
  {
    key: 'parent-1',
    name: 'Parent 1',
    children: [
      { key: 'child-1', name: 'Child 1' },
      { key: 'child-2', name: 'Child 2' },
    ],
  },
  {
    key: 'parent-2',
    name: 'Parent 2',
    children: [{ key: 'child-3', name: 'Child 3' }],
  },
]

describe('useTreeData', () => {
  it('returns flat rows when the data is not tree-structured', () => {
    const data = ref<TreeRow[]>([
      { key: '1', name: 'Alpha' },
      { key: '2', name: 'Beta' },
    ])

    const tree = useTreeData({
      data: () => data.value,
      getRowKey: (record) => record.key,
    })

    expect(tree.isTreeData.value).toBe(false)
    expect(tree.flattenData.value).toEqual([
      expect.objectContaining({
        record: data.value[0],
        level: 0,
        expanded: false,
        hasChildren: false,
      }),
      expect.objectContaining({
        record: data.value[1],
        level: 0,
        expanded: false,
        hasChildren: false,
      }),
    ])
    expect(tree.indentSize.value).toBe(15)
  })

  it('expands all parent rows by default when defaultExpandAllRows is enabled', () => {
    const data = ref(treeData)

    const tree = useTreeData({
      data: () => data.value,
      getRowKey: (record) => record.key,
      defaultExpandAllRows: () => true,
      indentSize: () => 24,
    })

    expect(tree.isTreeData.value).toBe(true)
    expect(tree.isTreeExpanded('parent-1')).toBe(true)
    expect(tree.isTreeExpanded('parent-2')).toBe(true)
    expect(tree.indentSize.value).toBe(24)
    expect(tree.flattenData.value.map((row) => `${row.level}:${row.record.key}`)).toEqual([
      '0:parent-1',
      '1:child-1',
      '1:child-2',
      '0:parent-2',
      '1:child-3',
    ])
  })

  it('fires callbacks in controlled mode without mutating internal expanded keys', () => {
    const expandedRowKeys = ref<string[]>(['parent-1'])
    const onExpand = vi.fn()
    const onExpandedRowsChange = vi.fn()

    const tree = useTreeData({
      data: () => treeData,
      getRowKey: (record) => record.key,
      expandedRowKeys: () => expandedRowKeys.value,
      onExpand,
      onExpandedRowsChange,
    })

    tree.toggleTreeExpand(treeData[0], 0)

    expect(onExpand).toHaveBeenCalledWith(false, treeData[0])
    expect(onExpandedRowsChange).toHaveBeenCalledWith([])
    expect(tree.isTreeExpanded('parent-1')).toBe(true)
    expect(Array.from(tree.expandedKeys.value)).toEqual([])
  })
})
