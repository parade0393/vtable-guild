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

const freshData: DemoRow[] = [
  { key: 'a', name: 'Alpha' },
  { key: 'b', name: 'Beta' },
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
    // 精确断言：默认展开的 '2' 在前，新展开的 '1' 追加在后，且不得重复
    expect(onExpandedRowsChange).toHaveBeenCalledWith(['2', '1'])
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

  it('reports the expanded key only once on the first expansion', () => {
    const onExpand = vi.fn()
    const onExpandedRowsChange = vi.fn()
    const expandable = ref<Expandable>({
      expandedRowRender: (record) => (record as DemoRow).name,
      onExpand,
      onExpandedRowsChange,
    })

    const expand = useExpand({
      expandable: () => expandable.value,
      getRowKey: (record) => (record as DemoRow).key,
      data: () => freshData,
    })

    expand.toggleExpand(freshData[0], 0)

    // 修复前首次展开会收到 ['a', 'a']
    expect(onExpandedRowsChange).toHaveBeenCalledTimes(1)
    expect(onExpandedRowsChange).toHaveBeenCalledWith(['a'])
    expect(onExpand).toHaveBeenCalledWith(true, freshData[0])
    expect(Array.from(expand.expandedKeySet.value)).toEqual(['a'])
  })

  it('omits the collapsed key from the reported key list', () => {
    const onExpandedRowsChange = vi.fn()
    const expandable = ref<Expandable>({
      expandedRowRender: (record) => (record as DemoRow).name,
      onExpandedRowsChange,
    })

    const expand = useExpand({
      expandable: () => expandable.value,
      getRowKey: (record) => (record as DemoRow).key,
      data: () => freshData,
    })

    expand.toggleExpand(freshData[0], 0)
    expand.toggleExpand(freshData[1], 1)
    expect(onExpandedRowsChange).toHaveBeenLastCalledWith(['a', 'b'])

    expand.toggleExpand(freshData[0], 0)

    // 折叠后回调里不能再出现被折叠的 'a'
    expect(expand.isExpanded('a')).toBe(false)
    expect(onExpandedRowsChange).toHaveBeenLastCalledWith(['b'])
    expect(onExpandedRowsChange.mock.calls.at(-1)?.[0]).not.toContain('a')
  })
})
