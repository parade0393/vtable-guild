import { bench, describe } from 'vitest'
import { useSelection } from './useSelection'
import { collectKeys, flattenRecords, makeTree, type BenchTreeRow } from './bench-fixtures'
import type { Key, RowSelection } from '../types'

// 命中 checkStrictly:false 的逐行子树遍历热点：
// 用树形数据 + 预置选中态，逐行调用 getSelectionState 测 indeterminate 计算成本。
function setup(tree: BenchTreeRow[]) {
  const allKeys = collectKeys(tree)
  // 确定性选中一半（偶数下标），制造 indeterminate 分支。
  const selectedRowKeys: Key[] = allKeys.filter((_key, i) => i % 2 === 0)
  const selection: RowSelection<BenchTreeRow> = {
    checkStrictly: false,
    selectedRowKeys,
  }
  const api = useSelection<BenchTreeRow>({
    rowSelection: () => selection,
    getRowKey: (record) => record.key,
    data: () => tree,
    visibleData: () => tree,
    childrenColumnName: () => 'children',
  })
  // 预热：触发 allNodes / nodeMap / selectedKeySet 计算并缓存。
  void api.selectedKeySet.value
  return { api, records: flattenRecords(tree) }
}

// 1k / 10k 节点（50×20、500×20）。
const s1k = setup(makeTree(50, 19))
const s10k = setup(makeTree(500, 19))

describe('useSelection.getSelectionState (checkStrictly: false)', () => {
  bench('all rows · 1k nodes', () => {
    const { api, records } = s1k
    for (let i = 0; i < records.length; i++) {
      api.getSelectionState(records[i], i)
    }
  })

  bench('all rows · 10k nodes', () => {
    const { api, records } = s10k
    for (let i = 0; i < records.length; i++) {
      api.getSelectionState(records[i], i)
    }
  })
})
