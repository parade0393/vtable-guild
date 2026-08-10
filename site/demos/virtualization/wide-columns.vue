<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
  status: string
  score: number
  cost: number
  city: string
  level: string
}

const CITIES = ['杭州', '上海', '成都', '深圳', '北京']
const LEVELS = ['L1', 'L2', 'L3', 'L4']
const STATUSES = ['正常', '待审核', '已归档']

const ROW_COUNT = 10_000
/** 中间可滚动的列数。加上两端固定列共 200 个叶子列。 */
const SYNTHETIC_COUNT = 197
const LEAF_COUNT = SYNTHETIC_COUNT + 3
const TABLE_WIDTH = 80 + 160 + SYNTHETIC_COUNT * 100 + 120

// 200 列 × 1 万行的数据在运行时生成。注意每行只有 7 个字段：
// 197 个合成列复用同一批数据源，否则光造数据就要 200 万个字段。
function buildRows(count: number): Row[] {
  const rows: Row[] = new Array(count)
  for (let i = 0; i < count; i += 1) {
    rows[i] = {
      key: i,
      name: `成员 ${i + 1}`,
      status: STATUSES[i % STATUSES.length],
      score: 40 + ((i * 17) % 60),
      cost: 100 + ((i * 31) % 900),
      city: CITIES[i % CITIES.length],
      level: LEVELS[i % LEVELS.length],
    }
  }
  return rows
}

const dataSource = shallowRef<Row[]>(buildRows(ROW_COUNT))

const SOURCES = ['score', 'cost', 'city', 'level'] as const

// 注意：这里没有任何 customRender / customCell。
// 它们可能返回 colSpan / rowSpan，只要出现一个，virtualColumn 就会被忽略。
const columns: TableColumnsType<Row> = [
  { title: '#', dataIndex: 'key', key: 'key', width: 80, fixed: 'left' },
  { title: '成员', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  ...Array.from({ length: SYNTHETIC_COUNT }, (_, i) => ({
    title: `C${i + 1}`,
    dataIndex: SOURCES[i % SOURCES.length],
    key: `c-${i}`,
    width: 100,
    // 排序仍然可用，窗口化不影响它
    sorter: i === 0,
  })),
  { title: '状态', dataIndex: 'status', key: 'status', width: 120, fixed: 'right' },
]

const virtualColumn = ref(true)

// ---- 实时统计表体里真正渲染了几列 ----

const hostRef = ref<HTMLElement | null>(null)
const renderedCells = ref(0)
let observer: MutationObserver | null = null
let rafId = 0

/** 第一行里真实渲染的单元格数。补齐总宽的占位格带 aria-hidden，不算数。 */
function countRenderedCells() {
  const row = hostRef.value?.querySelector('tbody tr')
  if (!row) return 0
  return Array.from(row.children).filter((cell) => cell.getAttribute('aria-hidden') !== 'true')
    .length
}

/** 滚动时单元格增删非常频繁，按帧合并一次统计。 */
function scheduleCount() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    renderedCells.value = countRenderedCells()
  })
}

onMounted(() => {
  if (!hostRef.value) return
  observer = new MutationObserver(scheduleCount)
  observer.observe(hostRef.value, { childList: true, subtree: true })
  scheduleCount()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  if (rafId) cancelAnimationFrame(rafId)
})

const summary = computed(() =>
  virtualColumn.value
    ? `渲染列数 ${renderedCells.value} / ${LEAF_COUNT}`
    : `渲染列数 ${renderedCells.value} / ${LEAF_COUNT}（未窗口化）`,
)
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap">
    <button
      type="button"
      :style="{
        padding: '4px 12px',
        fontSize: '13px',
        borderRadius: '6px',
        border: '1px solid currentColor',
      }"
      @click="virtualColumn = !virtualColumn"
    >
      virtualColumn：{{ virtualColumn ? '开' : '关' }}
    </button>
    <span style="font-size: 13px; opacity: 0.7">
      {{ ROW_COUNT.toLocaleString() }} 行 × {{ LEAF_COUNT }} 列 · {{ summary }}
    </span>
  </div>

  <p style="margin: 0 0 12px; font-size: 13px; opacity: 0.7">
    在表格上按住 Shift 滚动滚轮（触控板直接左右滑）横向滚动，注意上面的「渲染列数」。
    关掉开关后它会立刻跳回 {{ LEAF_COUNT }}——那才是每行真正要重建的单元格数。
  </p>

  <!-- virtualColumn 依赖 virtual，而 virtual 依赖 scroll.y，三者缺一不可 -->
  <div ref="hostRef">
    <VTable
      row-key="key"
      bordered
      virtual
      size="middle"
      :columns="columns"
      :data-source="dataSource"
      :scroll="{ x: TABLE_WIDTH, y: 380 }"
      :virtual-column="virtualColumn"
    />
  </div>
</template>
