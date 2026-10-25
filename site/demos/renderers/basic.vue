<script setup lang="ts">
import { h } from 'vue'
import { VTable, createTableRenderers } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Order {
  key: number
  name: string
  amount: number
  createdAt: string
  status: number
}

const renderers = createTableRenderers<Order>({
  orderName: ({ displayValue, record }) => ({
    children: h('strong', String(displayValue)),
    tooltipText: `订单 ${record.key}：${record.name}`,
  }),
})
const columns: TableColumnsType<Order> = [
  { key: 'name', title: '订单', dataIndex: 'name', valueType: 'orderName', ellipsis: true },
  {
    key: 'amount',
    title: '金额',
    dataIndex: 'amount',
    valueType: 'money',
    fieldProps: { currency: 'CNY', locale: 'zh-CN' },
    copyable: true,
    sorter: true,
  },
  {
    key: 'createdAt',
    title: '创建日期',
    dataIndex: 'createdAt',
    valueType: 'date',
    fieldProps: { dateFormat: { dateStyle: 'medium', timeZone: 'UTC' } },
  },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    valueType: 'tag',
    valueEnum: new Map([
      [0, { text: '待处理', status: 'processing' as const }],
      [1, { text: '已完成', status: 'success' as const }],
    ]),
    filters: true,
  },
]
const rows: Order[] = [
  { key: 1001, name: '年度订阅', amount: 12800, createdAt: '2026-10-25T08:00:00Z', status: 1 },
  { key: 1002, name: '技术服务', amount: 3680.5, createdAt: '2026-10-24T08:00:00Z', status: 0 },
]
</script>

<template>
  <VTable :columns="columns" :data-source="rows" :renderers="renderers" row-key="key" />
</template>
