<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface Order {
  key: number
  name: string
  amount: number
  createdAt: string
  status: number
}

const columns: TableColumnsType<Order> = [
  { key: 'name', title: '订单', dataIndex: 'name' },
  {
    key: 'amount',
    title: '金额',
    dataIndex: 'amount',
    valueType: 'money',
  },
  {
    key: 'createdAt',
    title: '创建日期',
    dataIndex: 'createdAt',
    valueType: 'date',
  },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    valueType: 'tag',
    valueEnum: {
      0: { text: '待处理', status: 'processing' },
      1: { text: '已完成', status: 'success' },
    },
  },
]
const rows: Order[] = [
  { key: 1001, name: '年度订阅', amount: 12800, createdAt: '2026-10-25', status: 1 },
  { key: 1002, name: '技术服务', amount: 3680.5, createdAt: '2026-10-24', status: 0 },
]
</script>

<template>
  <VTable :columns="columns" :data-source="rows" row-key="key" />
</template>
