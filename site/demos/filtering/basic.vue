<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType, TableFiltersInfo } from '@vtable-guild/vtable-guild'

interface TaskRow {
  key: string
  title: string
  owner: string
  status: string
  priority: string
}

const columns: TableColumnsType<TaskRow> = [
  { title: '任务', dataIndex: 'title', key: 'title' },
  {
    title: '负责人',
    dataIndex: 'owner',
    key: 'owner',
    // filterSearch 在选项较多时给下拉加一个搜索框
    filterSearch: true,
    filters: [
      { text: '陈嘉', value: '陈嘉' },
      { text: '林悦', value: '林悦' },
      { text: '周野', value: '周野' },
      { text: '苏晚', value: '苏晚' },
    ],
    onFilter: (value, record) => record.owner === value,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: '进行中', value: '进行中' },
      { text: '待评审', value: '待评审' },
      { text: '已完成', value: '已完成' },
    ],
    defaultFilteredValue: ['进行中'],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    // filterMultiple: false → 单选筛选
    filterMultiple: false,
    filters: [
      { text: 'P0', value: 'P0' },
      { text: 'P1', value: 'P1' },
      { text: 'P2', value: 'P2' },
    ],
    onFilter: (value, record) => record.priority === value,
  },
]

const dataSource: TaskRow[] = [
  { key: '1', title: '虚拟滚动行高测量', owner: '陈嘉', status: '进行中', priority: 'P0' },
  { key: '2', title: '筛选面板滚动关闭', owner: '林悦', status: '已完成', priority: 'P1' },
  { key: '3', title: '固定列阴影对齐', owner: '周野', status: '进行中', priority: 'P1' },
  { key: '4', title: '主题 token 补齐', owner: '苏晚', status: '待评审', priority: 'P2' },
  { key: '5', title: '列宽拖拽最小宽度', owner: '陈嘉', status: '待评审', priority: 'P0' },
  { key: '6', title: '树形展开状态受控', owner: '林悦', status: '进行中', priority: 'P2' },
]

const activeFilters = ref('status: 进行中')

function handleChange(filters: TableFiltersInfo) {
  const entries = Object.entries(filters).filter(([, value]) => value?.length)
  activeFilters.value = entries.length
    ? entries.map(([key, value]) => `${key}: ${value!.join(' / ')}`).join('；')
    : '（无筛选）'
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" @change="handleChange" />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">当前筛选：{{ activeFilters }}</p>
</template>
