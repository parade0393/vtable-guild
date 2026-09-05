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

// 5000 行在运行时确定性生成
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

const dataSource = shallowRef<Row[]>(buildRows(5000))

// 拖动滑杆改变父容器高度，表体高度自动跟随——等价于浏览器缩放 / 窗口变化
const parentHeight = ref(320)
</script>

<template>
  <div
    style="
      margin-bottom: 12px;
      font-size: 13px;
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    "
  >
    <label style="display: inline-flex; gap: 6px; align-items: center">
      父容器高度
      <input v-model.number="parentHeight" type="range" min="160" max="560" step="20" />
      <span style="font-variant-numeric: tabular-nums">{{ parentHeight }}px</span>
    </label>
    <span style="opacity: 0.7">
      scroll.y 传 'auto'：表体自动充满父容器，无需自己监听 resize、扣减表头高度
    </span>
  </div>

  <!-- 父容器是普通块级元素，需要确定高度；VTable 是它的专用填充子项 -->
  <div
    :style="{
      height: `${parentHeight}px`,
      padding: '12px',
      border: '1px dashed rgba(128, 128, 128, 0.45)',
      borderRadius: '8px',
    }"
  >
    <VTable
      row-key="key"
      virtual
      :columns="columns"
      :data-source="dataSource"
      :scroll="{ y: 'auto' }"
    />
  </div>
</template>
