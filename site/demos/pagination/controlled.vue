<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  type TableColumnsType,
  type TablePaginationConfig,
  type VTableEventProps,
} from '@vtable-guild/vtable-guild'
const current = ref(1)
const pageSize = ref(5)
const data = Array.from({ length: 47 }, (_, i) => ({ key: i + 1, name: `Record ${i + 1}` }))
type Row = (typeof data)[number]
const columns: TableColumnsType<Row> = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  position: ['topRight', 'bottomRight'],
}))
const handleChange: NonNullable<VTableEventProps<Row>['onChange']> = (_filters, _sorter, extra) => {
  if (extra.action !== 'paginate' || !extra.pagination) return
  current.value = extra.pagination.current
  pageSize.value = extra.pagination.pageSize
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
