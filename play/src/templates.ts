/** 首次打开（没有 ?demo= 也没有分享 hash）时的默认示例 */
export const WELCOME_SFC = `<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { Key, RowSelection, TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  key: string
  name: string
  team: string
  score: number
  city: string
}

const columns: TableColumnsType<Row> = [
  { title: '成员', dataIndex: 'name', key: 'name', width: 160, sorter: true },
  {
    title: '团队',
    dataIndex: 'team',
    key: 'team',
    width: 140,
    filters: [
      { text: '平台', value: '平台' },
      { text: '交易', value: '交易' },
      { text: '设计系统', value: '设计系统' },
    ],
    onFilter: (value, record) => record.team === value,
  },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  {
    title: '评分',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.score - b.score,
    defaultSortOrder: 'descend',
  },
]

const dataSource: Row[] = [
  { key: '1', name: '陈嘉', team: '平台', score: 92, city: '杭州' },
  { key: '2', name: '林悦', team: '交易', score: 88, city: '上海' },
  { key: '3', name: '周野', team: '平台', score: 95, city: '成都' },
  { key: '4', name: '苏晚', team: '设计系统', score: 79, city: '深圳' },
  { key: '5', name: '何川', team: '交易', score: 84, city: '北京' },
]

const selectedRowKeys = ref<Key[]>([])
const rowSelection = computed<RowSelection<Row>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => (selectedRowKeys.value = keys),
}))
<\/script>

<template>
  <VTable
    row-key="key"
    bordered
    striped
    hoverable
    :columns="columns"
    :data-source="dataSource"
    :row-selection="rowSelection"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    已选 {{ selectedRowKeys.length }} 项 —— 改左边的代码，右边实时生效。
  </p>
</template>
`

/** 新建 .vue 文件时的骨架 */
export const NEW_SFC = `<script setup lang="ts">
import { VTable } from '@vtable-guild/vtable-guild'
<\/script>

<template>
  <VTable row-key="key" :columns="[]" :data-source="[]" />
</template>
`
