import { describe, expect, it, vi } from 'vitest'
import { useSorter } from './useSorter'
import type { ColumnType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  age: number
  score: number
  name: string
}

const dataSource: DemoRow[] = [
  { key: '1', age: 30, score: 80, name: 'Charlie' },
  { key: '2', age: 24, score: 95, name: 'Alice' },
  { key: '3', age: 24, score: 70, name: 'Bob' },
]

describe('useSorter', () => {
  it('uses defaultSortOrder to sort data on first render', () => {
    const columns: ColumnType<DemoRow>[] = [
      { key: 'age', dataIndex: 'age', sorter: true, defaultSortOrder: 'ascend' },
    ]

    const { getSortOrder, sortData, sorterResult } = useSorter({
      columns: () => columns,
    })

    expect(getSortOrder(columns[0])).toBe('ascend')
    expect(sorterResult.value).toMatchObject({ columnKey: 'age', order: 'ascend', field: 'age' })
    expect(sortData(dataSource).map((row) => row.key)).toEqual(['2', '3', '1'])
  })

  it('toggles sorter state and clears previous non-multiple sorters', () => {
    const onSorterChange = vi.fn()
    const columns: ColumnType<DemoRow>[] = [
      { key: 'age', dataIndex: 'age', sorter: true },
      { key: 'score', dataIndex: 'score', sorter: true },
    ]

    const { getSortOrder, toggleSortOrder, sorterStates } = useSorter({
      columns: () => columns,
      onSorterChange,
    })

    toggleSortOrder(columns[0])
    expect(getSortOrder(columns[0])).toBe('ascend')
    expect(sorterStates.value.map((state) => state.columnKey)).toEqual(['age'])

    toggleSortOrder(columns[1])
    expect(getSortOrder(columns[0])).toBeNull()
    expect(getSortOrder(columns[1])).toBe('ascend')
    expect(sorterStates.value.map((state) => state.columnKey)).toEqual(['score'])
    expect(onSorterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ columnKey: 'score', order: 'ascend', field: 'score' }),
    )
  })

  it('supports multi-column sorting by multiple priority', () => {
    const columns: ColumnType<DemoRow>[] = [
      {
        key: 'age',
        dataIndex: 'age',
        sorter: { multiple: 2 },
      },
      {
        key: 'name',
        dataIndex: 'name',
        sorter: { multiple: 1 },
      },
    ]

    const { toggleSortOrder, sorterResult, sortData } = useSorter({
      columns: () => columns,
    })

    toggleSortOrder(columns[0])
    toggleSortOrder(columns[1])

    expect(sorterResult.value).toEqual([
      expect.objectContaining({ columnKey: 'age', order: 'ascend', field: 'age' }),
      expect.objectContaining({ columnKey: 'name', order: 'ascend', field: 'name' }),
    ])
    expect(sortData(dataSource).map((row) => row.key)).toEqual(['2', '3', '1'])
  })

  it('emits next sorter result for controlled columns without mutating local state', () => {
    const onSorterChange = vi.fn()
    const columns: ColumnType<DemoRow>[] = [
      { key: 'age', dataIndex: 'age', sorter: true, sortOrder: 'ascend' },
    ]

    const { getSortOrder, toggleSortOrder, sortData } = useSorter({
      columns: () => columns,
      onSorterChange,
    })

    toggleSortOrder(columns[0])

    expect(onSorterChange).toHaveBeenCalledWith(
      expect.objectContaining({ columnKey: 'age', order: 'descend', field: 'age' }),
    )
    expect(getSortOrder(columns[0])).toBe('ascend')
    expect(sortData(dataSource).map((row) => row.key)).toEqual(['2', '3', '1'])
  })
})
