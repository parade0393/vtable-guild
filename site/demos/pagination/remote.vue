<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  VTable,
  type RowSelection,
  type TableColumnsType,
  type TablePaginationConfig,
  type VTableEventProps,
} from '@vtable-guild/vtable-guild'
type Row = { key: number; name: string }
const current = ref(1)
const pageSize = ref(5)
const total = ref(123)
const data = ref<Row[]>([])
const loading = ref(false)
const selectedCount = ref(0)
const selectedRecords = ref<Row[]>([])
const rowSelection: RowSelection<Row> = {
  preserveSelectedRowKeys: true,
  selections: true,
  onChange: (keys, records) => {
    selectedCount.value = keys.length
    selectedRecords.value = records
  },
}
let requestId = 0
const columns: TableColumnsType<Row> = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  total: total.value,
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  showTotal: (count, range) => `${range[0]}–${range[1]} / ${count}`,
}))
// Replace this mock with your API call. Keep total while loading another page.
async function fetchPage(page: number, size: number) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    total: 123,
    rows: Array.from({ length: Math.min(size, 123 - (page - 1) * size) }, (_, i) => ({
      key: (page - 1) * size + i + 1,
      name: `Remote record ${(page - 1) * size + i + 1}`,
    })),
  }
}
watch(
  [current, pageSize],
  async ([page, size]) => {
    const id = ++requestId
    loading.value = true
    try {
      const response = await fetchPage(page, size)
      if (id !== requestId) return
      data.value = response.rows
      total.value = response.total
    } finally {
      if (id === requestId) loading.value = false
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  requestId++
})
const handleChange: NonNullable<VTableEventProps<Row>['onChange']> = (_filters, _sorter, extra) => {
  if (extra.action !== 'paginate' || !extra.pagination) return
  current.value = extra.pagination.current
  pageSize.value = extra.pagination.pageSize
}
</script>

<template>
  <p>切换页码后继续选择，已选记录会跨页保留。“全选所有”仅选择当前已加载的数据。</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="data"
    :pagination="pagination"
    :loading="loading"
    :row-selection="rowSelection"
    @change="handleChange"
  />
  <p role="status" aria-live="polite">
    已选 {{ selectedCount }} 条（跨页保留）：
    {{
      selectedRecords
        .slice(0, 6)
        .map((record) => record.name)
        .join('、') || '暂无'
    }}
    <template v-if="selectedRecords.length > 6">…</template>
  </p>
</template>
