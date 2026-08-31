<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnType, RowDragSortInfo } from '@vtable-guild/vtable-guild'

interface TaskRow {
  key: string
  task: string
  owner: string
  due: string
}

const columns: ColumnType<TaskRow>[] = [
  { title: '任务', dataIndex: 'task', key: 'task', width: 240 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '截止日期', dataIndex: 'due', key: 'due', width: 140 },
]

const dataSource = ref<TaskRow[]>([
  { key: '1', task: '列宽拖拽回归测试', owner: '陈嘉', due: '2026-09-04' },
  { key: '2', task: '虚拟滚动长列表压测', owner: '苏晚', due: '2026-09-08' },
  { key: '3', task: '筛选面板空态文案', owner: '周野', due: '2026-09-12' },
  { key: '4', task: '树形数据展开动画', owner: '林悦', due: '2026-09-18' },
  { key: '5', task: '预设切换文档补全', owner: '陈嘉', due: '2026-09-22' },
])

const lastDrag = ref('（按住任意一行上下拖动）')

// 受控模式：拖拽结束返回排好序的新数组，由外部更新 dataSource
function handleRowDragEnd(newData: TaskRow[], info: RowDragSortInfo) {
  dataSource.value = newData
  const dragged = newData.find((row) => row.key === info.draggedKey)
  const target = newData.find((row) => row.key === info.targetKey)
  if (dragged && target) {
    lastDrag.value = `「${dragged.task}」已移动到「${target.task}」附近`
  }
}
</script>

<template>
  <VTable
    row-key="key"
    bordered
    row-draggable
    :columns="columns"
    :data-source="dataSource"
    @row-drag-end="handleRowDragEnd"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">最近一次拖拽：{{ lastDrag }}</p>
</template>
