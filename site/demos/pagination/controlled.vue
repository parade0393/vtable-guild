<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  type TableChangeExtra,
  type TablePaginationConfig,
} from '@vtable-guild/vtable-guild'
const current = ref(1)
const pageSize = ref(5)
const data = Array.from({ length: 47 }, (_, i) => ({ key: i + 1, name: `Record ${i + 1}` }))
const columns = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  position: ['topRight', 'bottomRight'],
}))
function handleChange(_filters: unknown, _sorter: unknown, extra: TableChangeExtra) {
  if (extra.pagination) {
    current.value = extra.pagination.current
    pageSize.value = extra.pagination.pageSize
  }
}
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="data"
    :pagination="pagination"
    @change="handleChange"
  />
</template>
