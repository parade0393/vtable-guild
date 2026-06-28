import { bench, describe } from 'vitest'
import { useTreeData } from './useTreeData'
import { makeTree, type BenchTreeRow } from './bench-fixtures'

// flattenData 是带缓存的 computed：循环读 .value 第二次起读缓存测不到东西。
// 因此每次迭代前改写 expandedKeys（其依赖）使其失效，再读 .value 强制重新展平。
function makeApi(tree: BenchTreeRow[]) {
  const api = useTreeData<BenchTreeRow>({
    data: () => tree,
    getRowKey: (record) => record.key,
    defaultExpandAllRows: () => true,
  })
  // 预热：触发首次展平 + 填充展开 keys。
  void api.flattenData.value
  return api
}

const api1k = makeApi(makeTree(50, 19))
const api10k = makeApi(makeTree(500, 19))

describe('useTreeData.flattenData (all expanded)', () => {
  bench('1k nodes', () => {
    api1k.expandedKeys.value = new Set(api1k.expandedKeys.value)
    void api1k.flattenData.value
  })

  bench('10k nodes', () => {
    api10k.expandedKeys.value = new Set(api10k.expandedKeys.value)
    void api10k.flattenData.value
  })
})
