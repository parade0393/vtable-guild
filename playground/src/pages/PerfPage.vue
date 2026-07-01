<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnsType, RowSelection, SortOrder } from '@vtable-guild/vtable-guild'

interface PerfRow {
  key: number
  name: string
  age: number
  score: number
  status: 'active' | 'paused' | 'archived'
  city: string
  address: string
}

const CITIES = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Toronto', 'Madrid']
const STATUSES = ['active', 'paused', 'archived'] as const

// 确定性生成（不依赖随机数），便于复现与前后对照。
const MAX_ROWS = 10000
const allRows: PerfRow[] = (() => {
  const rows: PerfRow[] = new Array(MAX_ROWS)
  for (let i = 0; i < MAX_ROWS; i++) {
    const scramble = (i * 2654435761) >>> 0
    rows[i] = {
      key: i,
      name: `User ${i + 1}`,
      age: 18 + (scramble % 60),
      score: scramble % 1000,
      status: STATUSES[scramble % STATUSES.length],
      city: CITIES[scramble % CITIES.length],
      address: `Block ${(i % 12) + 1} · Building ${(i % 99) + 1} · ${CITIES[scramble % CITIES.length]}`,
    }
  }
  return rows
})()

// ---- 配置项 ----
const ROW_COUNTS = [1000, 5000, 10000]
const SIZES = ['small', 'middle', 'large'] as const

const rowCount = ref(1000)
const virtual = ref(true)
const size = ref<'small' | 'middle' | 'large'>('middle')
const withSelection = ref(true)
const tableKey = ref(0)

const displayData = computed(() => allRows.slice(0, rowCount.value))

// ---- 受控排序 / 筛选 / 选择（供动作按钮程序化触发，便于 trace 复现）----
const scoreOrder = ref<SortOrder>(null)
const statusFilter = ref<(string | number | boolean)[] | null>(null)
const selectedKeys = ref<(string | number)[]>([])

const columns = computed<ColumnsType<PerfRow>>(() => [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right', sorter: true },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: true,
    sortOrder: scoreOrder.value,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    filters: [
      { text: 'active', value: 'active' },
      { text: 'paused', value: 'paused' },
      { text: 'archived', value: 'archived' },
    ],
    filteredValue: statusFilter.value,
    onFilter: (value, record) => record.status === value,
  },
  { title: 'City', dataIndex: 'city', key: 'city', width: 130 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
])

const rowSelection = computed<RowSelection<PerfRow> | undefined>(() =>
  withSelection.value
    ? {
        type: 'checkbox',
        selectedRowKeys: selectedKeys.value,
        onChange: (keys) => {
          selectedKeys.value = [...keys]
        },
      }
    : undefined,
)

// ---- 指示性耗时测量 ----
// 仅用于即时反馈：动作触发 → 等一帧渲染完成 → 记录差值。
// 权威数据请以 Chrome DevTools / MCP 的 performance trace 为准。
const wrapperRef = ref<HTMLElement | null>(null)
const lastAction = ref('—')
const lastMs = ref<number | null>(null)

function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function measure(label: string, mutate: () => void) {
  const t0 = performance.now()
  mutate()
  await nextTick()
  await afterPaint()
  lastMs.value = Math.round((performance.now() - t0) * 10) / 10
  lastAction.value = label
}

// ---- 配置动作 ----
function setRowCount(n: number) {
  void measure(`渲染 ${n.toLocaleString()} 行`, () => {
    rowCount.value = n
  })
}
function toggleVirtual() {
  void measure(`虚拟滚动 ${virtual.value ? '关闭' : '开启'}`, () => {
    virtual.value = !virtual.value
  })
}
function setSize(value: 'small' | 'middle' | 'large') {
  void measure(`密度 ${value}`, () => {
    size.value = value
  })
}
function toggleSelectionColumn() {
  void measure(`选择列 ${withSelection.value ? '关闭' : '开启'}`, () => {
    withSelection.value = !withSelection.value
  })
}

// ---- 交互动作（热路径） ----
function cycleSort() {
  const next: SortOrder =
    scoreOrder.value === null ? 'ascend' : scoreOrder.value === 'ascend' ? 'descend' : null
  void measure(`排序 Score → ${next ?? '无'}`, () => {
    scoreOrder.value = next
  })
}
function toggleFilter() {
  void measure('筛选 Status', () => {
    statusFilter.value = statusFilter.value ? null : ['active']
  })
}
function selectAll() {
  void measure('全选当前数据', () => {
    selectedKeys.value = displayData.value.map((row) => row.key)
  })
}
function clearSelection() {
  void measure('清空选择', () => {
    selectedKeys.value = []
  })
}
function toggleFirstRow() {
  // 只改一行的选中态：用于度量「未变行是否被跳过重渲染」。
  void measure('选中/取消首行', () => {
    selectedKeys.value = selectedKeys.value.length === 1 && selectedKeys.value[0] === 0 ? [] : [0]
  })
}
function remount() {
  void measure('强制重新挂载', () => {
    tableKey.value += 1
  })
}
function scrollBody(toBottom: boolean) {
  void measure(toBottom ? '滚动到底' : '滚动到顶', () => {
    const root = wrapperRef.value
    if (!root) return
    // 行是 table 元素，可滚动容器是 div，数量很少，遍历 div 成本可忽略。
    root.querySelectorAll<HTMLElement>('div').forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 4) {
        el.scrollTop = toBottom ? el.scrollHeight : 0
      }
    })
  })
}

const heavyWarning = computed(() => !virtual.value && rowCount.value > 1000)
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Performance Lab</p>
        <h1>性能演练台</h1>
        <p class="play-summary">
          可配置行数 / 虚拟滚动 / 密度 /
          选择列，并用动作按钮程序化触发排序、筛选、全选、滚动等热路径。 配合 Chrome DevTools 或 MCP
          的 performance trace 抓真实 scripting / INP / 帧率。
        </p>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Rows</span>
        <strong>{{ displayData.length.toLocaleString() }}</strong>
        <p>
          虚拟滚动 {{ virtual ? '开' : '关' }} · 密度 {{ size }} · 选择列
          {{ withSelection ? '开' : '关' }}
        </p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Last action</span>
        <strong>{{ lastMs === null ? '—' : `${lastMs} ms` }}</strong>
        <p>{{ lastAction }}（指示值，权威以 DevTools trace 为准）</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Selected</span>
        <strong>{{ selectedKeys.length.toLocaleString() }}</strong>
        <p>当前选中行数</p>
      </article>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Console</p>
          <h2>配置与动作</h2>
        </div>
        <p class="play-case__desc">
          先用「配置」选定场景，再用「动作」在 trace 录制期间触发对应热路径。
        </p>
      </header>

      <p class="perf-group-label">配置 · 行数</p>
      <div class="play-toolbar">
        <button
          v-for="n in ROW_COUNTS"
          :key="n"
          type="button"
          :class="rowCount === n ? 'play-solid-button' : 'play-ghost-button'"
          @click="setRowCount(n)"
        >
          {{ n.toLocaleString() }} 行
        </button>
      </div>

      <p class="perf-group-label">配置 · 渲染</p>
      <div class="play-toolbar">
        <button
          type="button"
          :class="virtual ? 'play-solid-button' : 'play-ghost-button'"
          @click="toggleVirtual"
        >
          虚拟滚动：{{ virtual ? '开' : '关' }}
        </button>
        <button
          v-for="value in SIZES"
          :key="value"
          type="button"
          :class="size === value ? 'play-solid-button' : 'play-ghost-button'"
          @click="setSize(value)"
        >
          {{ value }}
        </button>
        <button
          type="button"
          :class="withSelection ? 'play-solid-button' : 'play-ghost-button'"
          @click="toggleSelectionColumn"
        >
          选择列：{{ withSelection ? '开' : '关' }}
        </button>
      </div>

      <p class="perf-group-label">动作 · 热路径</p>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="cycleSort">排序 Score</button>
        <button type="button" class="play-ghost-button" @click="toggleFilter">筛选 Status</button>
        <button type="button" class="play-ghost-button" @click="selectAll">全选</button>
        <button type="button" class="play-ghost-button" @click="toggleFirstRow">选中首行</button>
        <button type="button" class="play-ghost-button" @click="clearSelection">清空</button>
        <button type="button" class="play-ghost-button" @click="scrollBody(true)">滚动到底</button>
        <button type="button" class="play-ghost-button" @click="scrollBody(false)">滚动到顶</button>
        <button type="button" class="play-ghost-button" @click="remount">重新挂载</button>
      </div>

      <p v-if="heavyWarning" class="play-inline-note">
        ⚠ 非虚拟模式下渲染 {{ rowCount.toLocaleString() }} 行会产生大量
        DOM，可能明显卡顿——这正是与虚拟滚动的对照项。
      </p>

      <div ref="wrapperRef" class="perf-table-host">
        <VTable
          :key="tableKey"
          :columns="columns as any"
          :data-source="displayData"
          :row-selection="rowSelection as any"
          :scroll="{ y: 460 }"
          :virtual="virtual"
          :size="size"
          row-key="key"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.perf-group-label {
  margin: 14px 0 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary, #6b7280);
}

.perf-table-host {
  margin-top: 12px;
}
</style>
