<script setup lang="ts">
import { h } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { Expandable, TableColumnsType } from '@vtable-guild/vtable-guild'

interface OrderRow {
  key: string
  no: string
  customer: string
  amount: number
  note: string
  refundable: boolean
}

const columns: TableColumnsType<OrderRow> = [
  { title: '订单号', dataIndex: 'no', key: 'no' },
  { title: '客户', dataIndex: 'customer', key: 'customer' },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    customRender: ({ text }) => `¥ ${Number(text).toLocaleString()}`,
  },
]

const dataSource: OrderRow[] = [
  {
    key: '1',
    no: 'SO-20260712-001',
    customer: '云图科技',
    amount: 128400,
    note: '客户要求分两批发货，第二批等对方仓库腾空后再排期。',
    refundable: true,
  },
  {
    key: '2',
    no: 'SO-20260712-002',
    customer: '衡石数据',
    amount: 42600,
    note: '已开票，发票号 25017788。',
    refundable: true,
  },
  {
    key: '3',
    no: 'SO-20260713-004',
    customer: '南岭制造',
    amount: 9800,
    note: '（此行不可展开）',
    refundable: false,
  },
]

const expandable: Expandable<OrderRow> = {
  defaultExpandedRowKeys: ['1'],
  // rowExpandable 返回 false 的行不显示展开图标
  rowExpandable: (record) => record.refundable,
  expandedRowRender: (record) =>
    h('div', { style: 'padding: 4px 0; font-size: 13px; line-height: 1.7' }, [
      h('div', `备注：${record.note}`),
      h('div', { style: 'opacity: 0.65' }, `可退款：${record.refundable ? '是' : '否'}`),
    ]),
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :expandable="expandable" />
</template>
