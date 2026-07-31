<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
  team: string
  city: string
  score: number
  level: string
  updatedAt: string
}

const TEAMS = ['平台', '交易', '设计系统', '基础设施']
const CITIES = ['杭州', '上海', '成都', '深圳', '北京']
const LEVELS = ['L1', 'L2', 'L3', 'L4']

// 10 万行在运行时确定性生成——不要把数据字面量写进模块
function buildRows(count: number): Row[] {
  const rows: Row[] = new Array(count)
  for (let i = 0; i < count; i += 1) {
    rows[i] = {
      key: i,
      name: `成员 ${i + 1}`,
      team: TEAMS[i % TEAMS.length],
      city: CITIES[i % CITIES.length],
      score: 40 + ((i * 17) % 60),
      level: LEVELS[i % LEVELS.length],
      updatedAt: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    }
  }
  return rows
}

const columns: TableColumnsType<Row> = [
  { title: '#', dataIndex: 'key', key: 'key', width: 90, fixed: 'left' },
  { title: '成员', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: '团队', dataIndex: 'team', key: 'team', width: 140 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  { title: '职级', dataIndex: 'level', key: 'level', width: 100 },
  { title: '评分', dataIndex: 'score', key: 'score', width: 110, align: 'right', sorter: true },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
]

const rowCount = ref(0)
const dataSource = shallowRef<Row[]>([])
const buildMs = ref(0)

function regenerate(count: number) {
  const start = performance.now()
  const rows = buildRows(count)
  buildMs.value = Math.round(performance.now() - start)
  rowCount.value = count
  dataSource.value = rows
}

regenerate(100_000)

const summary = computed(
  () =>
    `${rowCount.value.toLocaleString()} 行 · 生成耗时 ${buildMs.value} ms · DOM 里只有可视区的十几行`,
)
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap">
    <button
      v-for="count in [1000, 10000, 100000]"
      :key="count"
      type="button"
      :style="{
        padding: '4px 12px',
        fontSize: '13px',
        borderRadius: '6px',
        border: '1px solid currentColor',
        opacity: rowCount === count ? 1 : 0.55,
      }"
      @click="regenerate(count)"
    >
      {{ count.toLocaleString() }} 行
    </button>
    <span style="font-size: 13px; opacity: 0.7">{{ summary }}</span>
  </div>

  <!-- virtual 需要和 scroll.y 一起用，只写 virtual 不会生效 -->
  <VTable
    row-key="key"
    bordered
    virtual
    :columns="columns"
    :data-source="dataSource"
    :scroll="{ x: 880, y: 400 }"
  />
</template>
