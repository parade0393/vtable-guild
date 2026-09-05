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
  updatedAt: string
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
  { title: '评分', dataIndex: 'score', key: 'score', width: 110, align: 'right', sorter: true },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
]

const rowCount = ref(10_000)
const dataSource = shallowRef<Row[]>(buildRows(rowCount.value))

function regenerate(count: number) {
  rowCount.value = count
  dataSource.value = buildRows(count)
}

// scroll.y: 'auto'——表体高度自动 = 父容器 − 表头 − 固定 summary
const virtual = ref(true)
const parentHeight = ref(420)

const summary = computed(
  () => `${rowCount.value.toLocaleString()} 行 · 父容器 ${parentHeight.value}px`,
)
</script>

<template>
  <section class="auto-page">
    <header class="auto-page__controls">
      <button
        type="button"
        class="auto-page__toggle"
        :style="{ opacity: virtual ? 1 : 0.55 }"
        @click="virtual = !virtual"
      >
        virtual：{{ virtual ? '开' : '关' }}
      </button>
      <button
        v-for="count in [1000, 10000, 100000]"
        :key="count"
        type="button"
        class="auto-page__toggle"
        :style="{ opacity: rowCount === count ? 1 : 0.55 }"
        @click="regenerate(count)"
      >
        {{ count.toLocaleString() }} 行
      </button>
      <label class="auto-page__slider">
        父容器高度
        <input v-model.number="parentHeight" type="range" min="160" max="720" step="20" />
        <span>{{ parentHeight }}px</span>
      </label>
      <span class="auto-page__hint">{{ summary }} · 拖动滑杆或缩放窗口，表体自动跟随</span>
    </header>

    <div class="auto-page__frame" :style="{ height: `${parentHeight}px` }">
      <VTable
        row-key="key"
        bordered
        :virtual="virtual"
        :columns="columns"
        :data-source="dataSource"
        :scroll="{ x: 880, y: 'auto' }"
      />
    </div>

    <p class="auto-page__note">
      scroll.y 传 'auto' 时表格充满父容器：块级父容器需要有确定高度；flex 布局下可收缩祖先需要
      min-height: 0。表头与固定 summary 的高度由组件内部扣减，浏览器缩放（Ctrl+滚轮）同样自动跟随。
    </p>
  </section>
</template>

<style scoped>
.auto-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.auto-page__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.auto-page__toggle {
  padding: 4px 12px;
  border: 1px solid currentcolor;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}

.auto-page__slider {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.auto-page__hint {
  font-size: 13px;
  opacity: 0.7;
}

.auto-page__frame {
  padding: 12px;
  border: 1px dashed rgb(128 128 128 / 45%);
  border-radius: 8px;
}

.auto-page__note {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.7;
}
</style>
