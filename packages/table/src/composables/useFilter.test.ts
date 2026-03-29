import { describe, expect, it, vi } from 'vitest'
import { useFilter } from './useFilter'
import type { ColumnType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  status: 'active' | 'paused'
  role: 'admin' | 'user'
}

const dataSource: DemoRow[] = [
  { key: '1', status: 'active', role: 'admin' },
  { key: '2', status: 'paused', role: 'user' },
  { key: '3', status: 'active', role: 'user' },
]

describe('useFilter', () => {
  it('initializes from defaultFilteredValue and filters data with AND across columns', () => {
    const columns: ColumnType<DemoRow>[] = [
      {
        key: 'status',
        dataIndex: 'status',
        defaultFilteredValue: ['active'],
        onFilter: (value, record) => record.status === value,
      },
      {
        key: 'role',
        dataIndex: 'role',
        defaultFilteredValue: ['user'],
        onFilter: (value, record) => record.role === value,
      },
    ]

    const normalizedColumns = columns as unknown as ColumnType<Record<string, unknown>>[]
    const statusColumn = columns[0] as unknown as ColumnType<Record<string, unknown>>

    const { getFilteredValue, getAllFilters, filterData } = useFilter({
      columns: () => normalizedColumns,
    })

    expect(getFilteredValue(statusColumn)).toEqual(['active'])
    expect(getAllFilters()).toEqual({
      status: ['active'],
      role: ['user'],
    })
    expect(filterData(dataSource).map((row) => row.key)).toEqual(['3'])
  })

  it('updates non-controlled filters and emits a fresh filters snapshot', () => {
    const onFilterChange = vi.fn()
    const columns: ColumnType<DemoRow>[] = [
      {
        key: 'status',
        dataIndex: 'status',
        onFilter: (value, record) => record.status === value,
      },
      {
        key: 'role',
        dataIndex: 'role',
        onFilter: (value, record) => record.role === value,
      },
    ]

    const normalizedColumns = columns as unknown as ColumnType<Record<string, unknown>>[]
    const statusColumn = columns[0] as unknown as ColumnType<Record<string, unknown>>
    const roleColumn = columns[1] as unknown as ColumnType<Record<string, unknown>>

    const { confirmFilter, getAllFilters, filterData } = useFilter({
      columns: () => normalizedColumns,
      onFilterChange,
    })

    confirmFilter(statusColumn, ['active'])
    confirmFilter(roleColumn, ['admin', 'user'])

    expect(getAllFilters()).toEqual({
      status: ['active'],
      role: ['admin', 'user'],
    })
    expect(onFilterChange).toHaveBeenLastCalledWith({
      status: ['active'],
      role: ['admin', 'user'],
    })
    expect(filterData(dataSource).map((row) => row.key)).toEqual(['1', '3'])
  })

  it('resets to defaultFilteredValue when filterResetToDefaultFilteredValue is enabled', () => {
    const columns: ColumnType<DemoRow>[] = [
      {
        key: 'status',
        dataIndex: 'status',
        defaultFilteredValue: ['paused'],
        filterResetToDefaultFilteredValue: true,
        onFilter: (value, record) => record.status === value,
      },
    ]

    const normalizedColumns = columns as unknown as ColumnType<Record<string, unknown>>[]
    const statusColumn = columns[0] as unknown as ColumnType<Record<string, unknown>>

    const { confirmFilter, resetFilter, getAllFilters } = useFilter({
      columns: () => normalizedColumns,
    })

    confirmFilter(statusColumn, ['active'])
    expect(getAllFilters()).toEqual({ status: ['active'] })

    resetFilter(statusColumn)
    expect(getAllFilters()).toEqual({ status: ['paused'] })
  })

  it('uses override values in callback snapshots for controlled filters', () => {
    const onFilterChange = vi.fn()
    const columns: ColumnType<DemoRow>[] = [
      {
        key: 'status',
        dataIndex: 'status',
        filteredValue: ['paused'],
        onFilter: (value, record) => record.status === value,
      },
    ]

    const normalizedColumns = columns as unknown as ColumnType<Record<string, unknown>>[]
    const statusColumn = columns[0] as unknown as ColumnType<Record<string, unknown>>

    const { confirmFilter, getAllFilters } = useFilter({
      columns: () => normalizedColumns,
      onFilterChange,
    })

    confirmFilter(statusColumn, ['active'])

    expect(onFilterChange).toHaveBeenCalledWith({ status: ['active'] })
    expect(getAllFilters()).toEqual({ status: ['paused'] })
  })
})
