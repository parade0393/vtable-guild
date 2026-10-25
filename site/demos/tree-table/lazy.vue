<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type TableColumnsType, type TableInstance } from '@vtable-guild/vtable-guild'

interface Node {
  key: string
  name: string
  leaf?: boolean
}
const table = ref<TableInstance>()
const message = ref('第一次展开模拟失败，再点击图标重试。')
const attempts = new Map<string, number>()
const data: Node[] = [{ key: 'team', name: '产品团队' }]
const columns: TableColumnsType<Node> = [{ dataIndex: 'name', title: '部门', width: 280 }]
async function loadData(record: Node, { signal }: { signal: AbortSignal }): Promise<Node[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 400))
  if (signal.aborted) return []
  const count = (attempts.get(record.key) ?? 0) + 1
  attempts.set(record.key, count)
  if (count === 1) throw new Error('模拟网络错误')
  return Array.from({ length: 30 }, (_, index) => ({
    key: `${record.key}-${index}`,
    name: `设计小组 ${index + 1}`,
    leaf: true,
  }))
}
async function locate() {
  const found = await table.value?.scrollTo({ key: 'team-20', align: 'top' })
  message.value = found ? '已定位到设计小组 21' : '请先展开并加载团队节点'
}
</script>

<template>
  <button type="button" @click="locate">定位到设计小组 21</button>
  <p role="status">{{ message }}</p>
  <VTable
    ref="table"
    row-key="key"
    :columns="columns"
    :data-source="data"
    :load-data="loadData"
    :is-leaf="(record: Node) => !!record.leaf"
    :row-selection="{ checkStrictly: false }"
    :scroll="{ y: 240 }"
    virtual
  />
</template>
