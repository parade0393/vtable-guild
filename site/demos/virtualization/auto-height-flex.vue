<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
  team: string
  city: string
  score: number
}

const TEAMS = ['平台', '交易', '设计系统', '基础设施']
const CITIES = ['杭州', '上海', '成都', '深圳', '北京']

function buildRows(count: number): Row[] {
  const rows: Row[] = new Array(count)
  for (let i = 0; i < count; i += 1) {
    rows[i] = {
      key: i,
      name: `成员 ${i + 1}`,
      team: TEAMS[i % TEAMS.length],
      city: CITIES[i % CITIES.length],
      score: 40 + ((i * 17) % 60),
    }
  }
  return rows
}

const columns: TableColumnsType<Row> = [
  { title: '#', dataIndex: 'key', key: 'key', width: 90, fixed: 'left' },
  { title: '成员', dataIndex: 'name', key: 'name', width: 160 },
  { title: '团队', dataIndex: 'team', key: 'team', width: 140 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  { title: '评分', dataIndex: 'score', key: 'score', width: 110, align: 'right', sorter: true },
]

const dataSource = shallowRef<Row[]>(buildRows(1000))

// 正确写法：可收缩祖先（VTable 的直接父级）必须带 min-height: 0。
// 取消勾选可复现高度链断裂——flex 子项默认 min-height: auto，会拒绝收缩，
// 表体把父容器撑破。
const minHeightZero = ref(true)
const parentHeight = ref(420)
</script>

<template>
  <div
    style="
      margin-bottom: 12px;
      font-size: 13px;
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    "
  >
    <label style="display: inline-flex; gap: 6px; align-items: center">
      父容器高度
      <input v-model.number="parentHeight" type="range" min="240" max="560" step="20" />
      <span style="font-variant-numeric: tabular-nums">{{ parentHeight }}px</span>
    </label>
    <label style="display: inline-flex; gap: 6px; align-items: center">
      <input v-model="minHeightZero" type="checkbox" />
      可收缩祖先带 <code>min-height: 0</code>
    </label>
    <span style="opacity: 0.7"
      >取消勾选后拖动高度滑杆，复现「容器缩了表格不跟随、撑破容器」——flex 子项默认 min-height:
      auto，拒绝收缩</span
    >
  </div>

  <!-- flex 布局：VTable 与兄弟节点共存。高度链 = flex 容器确定高度 →
       section（flex: 1 1 0 + min-height: 0）→ VTable root（h-full） -->
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: `${parentHeight}px`,
      padding: '12px',
      border: '1px dashed rgba(128, 128, 128, 0.45)',
      borderRadius: '8px',
    }"
  >
    <div style="flex-shrink: 0; font-size: 13px; opacity: 0.75">
      ▦ 兄弟节点：统计栏（flex-shrink: 0）
    </div>
    <div :style="{ flex: '1 1 0', minHeight: minHeightZero ? '0' : 'auto' }">
      <VTable
        row-key="key"
        virtual
        :columns="columns"
        :data-source="dataSource"
        :scroll="{ y: 'auto' }"
      />
    </div>
    <div style="flex-shrink: 0; font-size: 13px; opacity: 0.75">▦ 兄弟节点：底部摘要栏</div>
  </div>
</template>
