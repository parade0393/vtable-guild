<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType, VTableSorterResult } from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  team: string
  score: number
  reviews: number
}

// sorter: true 用默认比较（数字按数值、其余按字符串）
// sorter: { multiple } 开启多列排序，数值越大优先级越高
const columns: TableColumnsType<ScoreRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', sorter: true },
  { title: '团队', dataIndex: 'team', key: 'team', sorter: { multiple: 2 } },
  {
    title: '评分',
    dataIndex: 'score',
    key: 'score',
    align: 'right',
    sorter: { multiple: 1 },
    defaultSortOrder: 'descend',
  },
  {
    title: '评审数',
    dataIndex: 'reviews',
    key: 'reviews',
    align: 'right',
    sorter: (a, b) => a.reviews - b.reviews,
  },
]

const dataSource: ScoreRow[] = [
  { key: '1', name: '陈嘉', team: '平台', score: 92, reviews: 18 },
  { key: '2', name: '林悦', team: '交易', score: 88, reviews: 31 },
  { key: '3', name: '周野', team: '平台', score: 95, reviews: 12 },
  { key: '4', name: '苏晚', team: '设计系统', score: 88, reviews: 24 },
  { key: '5', name: '何川', team: '交易', score: 79, reviews: 27 },
]

const lastSorter = ref('（点击表头试试，按住 Shift 可叠加多列）')

function handleChange(_filters: unknown, sorter: VTableSorterResult<ScoreRow>) {
  const list = Array.isArray(sorter) ? sorter : [sorter]
  const active = list.filter((item) => item.order)
  lastSorter.value = active.length
    ? active.map((item) => `${String(item.columnKey)} ${item.order}`).join('，')
    : '（无排序）'
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" @change="handleChange" />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">当前排序：{{ lastSorter }}</p>
</template>
