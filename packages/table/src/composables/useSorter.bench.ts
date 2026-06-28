import { bench, describe } from 'vitest'
import { useSorter } from './useSorter'
import { makeRows, type BenchRow } from './bench-fixtures'
import type { ColumnType } from '../types'

// 准确性铁律：数据在 bench() 外生成一次，组合式实例复用，回调内只跑 sortData。
const columns: ColumnType<BenchRow>[] = [
  { key: 'age', dataIndex: 'age', sorter: true, defaultSortOrder: 'ascend' },
]

const sorter = useSorter<BenchRow>({ columns: () => columns })

const rows1k = makeRows(1000)
const rows10k = makeRows(10000)

describe('useSorter.sortData', () => {
  bench('single column · 1k rows', () => {
    sorter.sortData(rows1k)
  })

  bench('single column · 10k rows', () => {
    sorter.sortData(rows10k)
  })
})
