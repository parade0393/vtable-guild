<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  type TableColumnsType,
  type TablePaginationConfig,
} from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
}

const current = ref(1)
const pageSize = ref(5)
const data: Row[] = Array.from({ length: 23 }, (_, index) => ({
  key: index + 1,
  name: `Record ${index + 1}`,
}))
const columns: TableColumnsType<Row> = [{ key: 'name', dataIndex: 'name', title: 'Name' }]

const handlePageChange: NonNullable<TablePaginationConfig['onChange']> = (page, size) => {
  current.value = page
  pageSize.value = size
}

const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  onChange: handlePageChange,
}))
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="data" :pagination="pagination" />
  <p role="status" aria-live="polite">当前第 {{ current }} 页，每页 {{ pageSize }} 条</p>
</template>
