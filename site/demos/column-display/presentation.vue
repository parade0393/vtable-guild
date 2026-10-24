<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type TableColumnsType, type ColumnValueEnum } from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  order: string
  status: boolean
  amount: number | null
}

const notice = ref('')
const status: ColumnValueEnum = new Map([
  [true, { text: 'Enabled', status: 'success' }],
  [false, { text: 'Disabled', status: 'default' }],
])
const columns: TableColumnsType<Row> = [
  {
    key: 'order',
    dataIndex: 'order',
    title: 'Order',
    tooltip: { title: 'Copy the complete order number', placement: 'top' },
    copyable: {
      text: ({ record }) => record.order,
      onCopy: (text) => {
        notice.value = `Copied: ${text}`
      },
      onError: () => {
        notice.value = 'Copy is unavailable in this browser context'
      },
    },
  },
  { key: 'status', dataIndex: 'status', title: 'Status', valueEnum: status, filters: true },
  { key: 'amount', dataIndex: 'amount', title: 'Amount', sorter: true, align: 'right' },
]
const data: Row[] = [
  { key: 1, order: 'ORDER-001', status: true, amount: 120 },
  { key: 2, order: 'ORDER-002', status: false, amount: 0 },
  { key: 3, order: 'ORDER-003', status: true, amount: null },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="data" column-empty-text="—" />
  <p role="status">{{ notice || 'Copy an order number or filter by status.' }}</p>
</template>
