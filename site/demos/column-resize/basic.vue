<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnType } from '@vtable-guild/vtable-guild'

interface DocRow {
  key: string
  title: string
  category: string
  updatedBy: string
  updatedAt: string
}

// resizable + minWidth/maxWidth 控制可拖拽范围；
// 拖拽需要一个确定的表格宽度，所以固定 tableLayout 并给列写死初始 width。
// 这里用 ColumnType[] 而不是 TableColumnsType，因为下面要按 key 回写 width——
// TableColumnsType 还包含多级表头和 EXPAND_COLUMN 这类哨兵，没有 key/width 字段。
// shallowRef + 整体替换：列配置里有 customRender 之类的函数，深层响应式没有意义。
const columns = shallowRef<ColumnType<DocRow>[]>([
  { title: '文档', dataIndex: 'title', key: 'title', width: 320, resizable: true, minWidth: 160 },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 160,
    resizable: true,
    minWidth: 100,
    maxWidth: 280,
  },
  { title: '最近编辑', dataIndex: 'updatedBy', key: 'updatedBy', width: 140, resizable: true },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
])

const dataSource: DocRow[] = [
  {
    key: '1',
    title: '三层主题覆盖设计说明',
    category: '架构',
    updatedBy: '陈嘉',
    updatedAt: '2026-07-14 10:22',
  },
  {
    key: '2',
    title: '虚拟滚动行高测量方案',
    category: '性能',
    updatedBy: '苏晚',
    updatedAt: '2026-07-12 16:40',
  },
  {
    key: '3',
    title: 'antdv 预设 token 对照表',
    category: '主题',
    updatedBy: '周野',
    updatedAt: '2026-07-09 09:05',
  },
  {
    key: '4',
    title: '筛选面板交互边界',
    category: '交互',
    updatedBy: '林悦',
    updatedAt: '2026-07-02 14:18',
  },
]

const lastResize = ref('（把鼠标移到表头分隔线上左右拖动）')

function handleResizeColumn(column: ColumnType<DocRow>, width: number) {
  // 宽度回写到列配置，拖拽结果才会持久生效
  columns.value = columns.value.map((item) => (item.key === column.key ? { ...item, width } : item))
  lastResize.value = `${String(column.key)} → ${Math.round(width)}px`
}
</script>

<template>
  <VTable
    row-key="key"
    bordered
    table-layout="fixed"
    :columns="columns"
    :data-source="dataSource"
    @resize-column="handleResizeColumn"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">最近一次调整：{{ lastResize }}</p>
</template>
