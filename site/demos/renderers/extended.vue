<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'
type Row = {
  key: number
  period: [string, string | null]
  updated: string
  share: number
  progress: number
}
const columns: TableColumnsType<Row> = [
  { dataIndex: 'period', title: '计划区间', valueType: 'dateRange', width: 240 },
  { dataIndex: 'updated', title: '更新时间', valueType: 'dateTime', width: 200 },
  {
    dataIndex: 'share',
    title: '占比',
    valueType: 'percent',
    fieldProps: { percentScale: 'ratio' },
    width: 100,
  },
  { dataIndex: 'progress', title: '进度', valueType: 'progress', width: 200 },
]
const rows: Row[] = [
  {
    key: 1,
    period: ['2026-10-26', '2026-10-30'],
    updated: '2026-10-26T08:30:00Z',
    share: 0.125,
    progress: 35,
  },
  {
    key: 2,
    period: ['2026-10-26', null],
    updated: '2026-10-26T09:30:00Z',
    share: 0.875,
    progress: 100,
  },
]
</script>
<template><VTable :columns="columns" :data-source="rows" :scroll="{ x: 740 }" /></template>
