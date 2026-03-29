import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useExpand } from './useExpand'
import type { Expandable } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
}

const dataSource: DemoRow[] = [
  { key: '1', name: 'Alpha' },
  { key: '2', name: 'Beta' },
  { key: '3', name: 'Gamma' },
]

describe('useExpand', () => {
  it('initializes from defaultExpandedRowKeys and toggles uncontrolled state', () => {
    const onExpand = vi.fn()
    const onExpandedRowsChange = vi.fn()

    const expandable = ref<Expandable>({
      expandedRowRender: (record) => (record as DemoRow).name,
      defaultExpandedRowKeys: ['2'],
      onExpand,
      onExpandedRowsChange,
    })

    const expand = useExpand({
      expandable: () => expandable.value,
      getRowKey: (record) => (record as DemoRow).key,
      data: () => dataSource,
    })

    expect(Array.from(expand.expandedKeySet.value)).toEqual(['2'])

    expand.toggleExpand(dataSource[0], 0)

    expect(Array.from(expand.expandedKeySet.value).sort()).toEqual(['1', '2'])
    expect(onExpand).toHaveBeenCalledWith(true, dataSource[0])
    expect(onExpandedRowsChange).toHaveBeenCalledWith(expect.arrayContaining(['1', '2']))
  })

  it('expands all rows by default when defaultExpandAllRows is enabled', () => {
    const expandable = ref<Expandable>({
      expandedRowRender: (record) => (record as DemoRow).name,
      defaultExpandAllRows: true,
    })

    const expand = useExpand({
      expandable: () => expandable.value,
      getRowKey: (record) => (record as DemoRow).key,
      data: () => dataSource,
    })

    expect(Array.from(expand.expandedKeySet.value).sort()).toEqual(['1', '2', '3'])
    expect(expand.isExpanded('2')).toBe(true)
  })

  it('emits next keys in controlled mode without mutating local state', () => {
    const onExpand = vi.fn()
    const onExpandedRowsChange = vi.fn()
    const expandable = ref<Expandable>({
      expandedRowRender: (record) => (record as DemoRow).name,
      expandedRowKeys: ['1'],
      onExpand,
      onExpandedRowsChange,
    })

    const expand = useExpand({
      expandable: () => expandable.value,
      getRowKey: (record) => (record as DemoRow).key,
      data: () => dataSource,
    })

    expand.toggleExpand(dataSource[1], 1)

    expect(Array.from(expand.expandedKeySet.value)).toEqual(['1'])
    expect(onExpand).toHaveBeenCalledWith(true, dataSource[1])
    expect(onExpandedRowsChange).toHaveBeenCalledWith(['1', '2'])
  })
})
