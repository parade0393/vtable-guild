<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface BuildRow {
  key: string
  pipeline: string
  branch: string
  status: 'success' | 'failed' | 'running'
  duration: string
}

const columns: TableColumnsType<BuildRow> = [
  { title: '流水线', dataIndex: 'pipeline', key: 'pipeline' },
  { title: '分支', dataIndex: 'branch', key: 'branch' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '耗时', dataIndex: 'duration', key: 'duration', width: 100, align: 'right' },
]

const dataSource: BuildRow[] = [
  { key: '1', pipeline: 'ci / verify', branch: 'master', status: 'success', duration: '3m 12s' },
  { key: '2', pipeline: 'deploy-site', branch: 'master', status: 'running', duration: '—' },
  { key: '3', pipeline: 'ci / verify', branch: 'feat/repl', status: 'failed', duration: '1m 48s' },
  { key: '4', pipeline: 'release', branch: 'master', status: 'success', duration: '5m 03s' },
]

const STATUS_STYLE: Record<BuildRow['status'], string> = {
  success: 'color:#389e0d;background:#f6ffed;border-color:#b7eb8f',
  failed: 'color:#cf1322;background:#fff1f0;border-color:#ffa39e',
  running: 'color:#0958d9;background:#e6f4ff;border-color:#91caff',
}

const STATUS_TEXT: Record<BuildRow['status'], string> = {
  success: '成功',
  failed: '失败',
  running: '运行中',
}

const clickedRow = ref('（点击任意一行）')

// customRow 注入行级属性与事件；rowClassName 按数据返回 class
function customRow(record: BuildRow) {
  return {
    style: { cursor: 'pointer' },
    onClick: () => (clickedRow.value = `${record.pipeline} @ ${record.branch}`),
  }
}
</script>

<template>
  <VTable
    row-key="key"
    hoverable
    :columns="columns"
    :data-source="dataSource"
    :custom-row="customRow"
  >
    <!-- headerCell：只改内容，排序/筛选等表头交互仍由组件负责 -->
    <template #headerCell="{ title, column }">
      <span v-if="column.key === 'duration'">{{ title }}（P95）</span>
      <template v-else>{{ title }}</template>
    </template>

    <!-- bodyCell：把状态文本换成徽标，其余列走默认渲染 -->
    <template #bodyCell="{ text, column }">
      <span
        v-if="column.key === 'status'"
        :style="`display:inline-block;padding:0 8px;line-height:20px;font-size:12px;border:1px solid;border-radius:4px;${STATUS_STYLE[text as BuildRow['status']]}`"
      >
        {{ STATUS_TEXT[text as BuildRow['status']] }}
      </span>
      <template v-else>{{ text }}</template>
    </template>
  </VTable>
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">最近点击：{{ clickedRow }}</p>
</template>
