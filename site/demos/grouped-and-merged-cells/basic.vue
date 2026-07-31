<script setup lang="ts">
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface QuarterRow {
  key: string
  region: string
  city: string
  q1: number
  q2: number
  q3: number
  q4: number
}

const dataSource: QuarterRow[] = [
  { key: '1', region: '华东', city: '杭州', q1: 320, q2: 410, q3: 388, q4: 502 },
  { key: '2', region: '华东', city: '上海', q1: 512, q2: 486, q3: 530, q4: 611 },
  { key: '3', region: '华东', city: '南京', q1: 214, q2: 268, q3: 240, q4: 299 },
  { key: '4', region: '华南', city: '深圳', q1: 466, q2: 498, q3: 521, q4: 570 },
  { key: '5', region: '华南', city: '广州', q1: 388, q2: 402, q3: 419, q4: 444 },
]

// 多级表头：children 嵌套即可
// 单元格合并：customCell 返回 rowSpan / colSpan（0 表示该单元格不渲染）
const columns: TableColumnsType<QuarterRow> = [
  {
    title: '区域',
    dataIndex: 'region',
    key: 'region',
    width: 100,
    customCell: (_record, index) => {
      if (index === 0) return { rowSpan: 3 }
      if (index === 3) return { rowSpan: 2 }
      if (index === 1 || index === 2 || index === 4) return { rowSpan: 0 }
      return {}
    },
  },
  { title: '城市', dataIndex: 'city', key: 'city', width: 100 },
  {
    title: '2026 财年',
    key: 'fy2026',
    children: [
      {
        title: '上半年',
        key: 'h1',
        children: [
          { title: 'Q1', dataIndex: 'q1', key: 'q1', width: 90, align: 'right' },
          { title: 'Q2', dataIndex: 'q2', key: 'q2', width: 90, align: 'right' },
        ],
      },
      {
        title: '下半年',
        key: 'h2',
        children: [
          { title: 'Q3', dataIndex: 'q3', key: 'q3', width: 90, align: 'right' },
          { title: 'Q4', dataIndex: 'q4', key: 'q4', width: 90, align: 'right' },
        ],
      },
    ],
  },
]
</script>

<template>
  <VTable row-key="key" bordered :columns="columns" :data-source="dataSource" />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    表头三层嵌套；「区域」列按 rowSpan 纵向合并
  </p>
</template>
