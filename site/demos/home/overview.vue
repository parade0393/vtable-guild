<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { Key, RowSelection, TableColumnsType } from '@vtable-guild/vtable-guild'

interface ReleaseRow {
  key: string
  pkg: string
  version: string
  channel: string
  size: number
  downloads: number
  publishedAt: string
}

const columns: TableColumnsType<ReleaseRow> = [
  { title: '包', dataIndex: 'pkg', key: 'pkg', width: 200, fixed: 'left', resizable: true },
  { title: '版本', dataIndex: 'version', key: 'version', width: 110 },
  {
    title: '通道',
    dataIndex: 'channel',
    key: 'channel',
    width: 110,
    filters: [
      { text: 'latest', value: 'latest' },
      { text: 'next', value: 'next' },
    ],
    onFilter: (value, record) => record.channel === value,
  },
  {
    title: 'gzip 体积',
    dataIndex: 'size',
    key: 'size',
    width: 130,
    align: 'right',
    sorter: (a, b) => a.size - b.size,
    customRender: ({ text }) => `${text} KB`,
  },
  {
    title: '周下载',
    dataIndex: 'downloads',
    key: 'downloads',
    width: 120,
    align: 'right',
    sorter: (a, b) => a.downloads - b.downloads,
    defaultSortOrder: 'descend',
  },
  { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 150 },
]

const dataSource: ReleaseRow[] = [
  {
    key: '1',
    pkg: '@vtable-guild/vtable-guild',
    version: '2.3.0',
    channel: 'latest',
    size: 56,
    downloads: 47,
    publishedAt: '2026-07-14',
  },
  {
    key: '2',
    pkg: 'core（内部）',
    version: '2.3.0',
    channel: 'latest',
    size: 18,
    downloads: 0,
    publishedAt: '2026-07-14',
  },
  {
    key: '3',
    pkg: 'theme（内部）',
    version: '2.3.0',
    channel: 'latest',
    size: 9,
    downloads: 0,
    publishedAt: '2026-07-14',
  },
  {
    key: '4',
    pkg: 'table（内部）',
    version: '2.4.0',
    channel: 'next',
    size: 31,
    downloads: 0,
    publishedAt: '2026-07-30',
  },
  {
    key: '5',
    pkg: 'icons（内部）',
    version: '2.3.0',
    channel: 'latest',
    size: 3,
    downloads: 0,
    publishedAt: '2026-07-14',
  },
]

const selectedRowKeys = ref<Key[]>(['1'])
const rowSelection = computed<RowSelection<ReleaseRow>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => (selectedRowKeys.value = keys),
}))
</script>

<template>
  <VTable
    row-key="key"
    bordered
    striped
    hoverable
    :columns="columns"
    :data-source="dataSource"
    :row-selection="rowSelection"
    :scroll="{ x: 920 }"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    这是一张真表格：点表头排序、点漏斗筛选、勾选行、拖第一列的分隔线改宽度。
  </p>
</template>
