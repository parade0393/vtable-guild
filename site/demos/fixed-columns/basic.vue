<script setup lang="ts">
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface AssetRow {
  key: string
  code: string
  name: string
  owner: string
  location: string
  vendor: string
  purchasedAt: string
  warranty: string
  price: number
  status: string
}

// fixed: 'left' / 'right' 把列钉在两侧；中间列靠 scroll.x 横向滚动
const columns: TableColumnsType<AssetRow> = [
  { title: '资产编号', dataIndex: 'code', key: 'code', width: 150, fixed: 'left' },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180, fixed: 'left' },
  { title: '责任人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '存放地', dataIndex: 'location', key: 'location', width: 160 },
  { title: '供应商', dataIndex: 'vendor', key: 'vendor', width: 180 },
  { title: '采购日期', dataIndex: 'purchasedAt', key: 'purchasedAt', width: 140 },
  { title: '保修至', dataIndex: 'warranty', key: 'warranty', width: 140 },
  {
    title: '采购价',
    dataIndex: 'price',
    key: 'price',
    width: 140,
    align: 'right',
    customRender: ({ text }) => `¥ ${Number(text).toLocaleString()}`,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110, fixed: 'right' },
]

const dataSource: AssetRow[] = [
  {
    key: '1',
    code: 'AS-2024-0311',
    name: 'MacBook Pro 14',
    owner: '陈嘉',
    location: '公会大厦 12F',
    vendor: '中远数码',
    purchasedAt: '2024-03-11',
    warranty: '2027-03-10',
    price: 16999,
    status: '在用',
  },
  {
    key: '2',
    code: 'AS-2024-0418',
    name: 'Dell U2723QE',
    owner: '林悦',
    location: '公会大厦 12F',
    vendor: '联启办公',
    purchasedAt: '2024-04-18',
    warranty: '2027-04-17',
    price: 4299,
    status: '在用',
  },
  {
    key: '3',
    code: 'AS-2023-1102',
    name: 'ThinkPad X1',
    owner: '周野',
    location: '海港实验室',
    vendor: '中远数码',
    purchasedAt: '2023-11-02',
    warranty: '2026-11-01',
    price: 12800,
    status: '维修中',
  },
  {
    key: '4',
    code: 'AS-2025-0107',
    name: 'iPad Pro 13',
    owner: '苏晚',
    location: '样式街区',
    vendor: '联启办公',
    purchasedAt: '2025-01-07',
    warranty: '2028-01-06',
    price: 9299,
    status: '闲置',
  },
]
</script>

<template>
  <VTable
    row-key="key"
    bordered
    :columns="columns"
    :data-source="dataSource"
    :scroll="{ x: 1320 }"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    横向拖动滚动条：左侧两列与右侧「状态」列保持固定
  </p>
</template>
