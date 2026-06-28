import { bench, describe } from 'vitest'
import { useFilter } from './useFilter'
import { makeRows } from './bench-fixtures'
import type { ColumnType } from '../types'

// 受控筛选（filteredValue）+ onFilter，使该列处于 active 状态。
const columns: ColumnType<Record<string, unknown>>[] = [
  {
    key: 'status',
    dataIndex: 'status',
    filteredValue: ['active', 'paused'],
    onFilter: (value, record) => record.status === value,
  },
]

const filter = useFilter({ columns: () => columns })

const rows1k = makeRows(1000)
const rows10k = makeRows(10000)

describe('useFilter.filterData', () => {
  bench('single column · 1k rows', () => {
    filter.filterData(rows1k)
  })

  bench('single column · 10k rows', () => {
    filter.filterData(rows10k)
  })
})
