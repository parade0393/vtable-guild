<script setup lang="ts">
import { computed, nextTick, onMounted, ref, type ComponentPublicInstance, type Ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnsType, Key, RowSelection } from '@vtable-guild/vtable-guild'

interface VirtualRow {
  key: number
  name: string
  age: number
  score: number
  city: string
  region: string
  team: string
  manager: string
  office: string
  level: string
  notes: string
  description: string
  address: string
}

interface CaseMetric {
  label: string
  dataCount: number
  domRows: number
  renderMs: number | null
  scrollMs: number | null
}

type CaseKey = 'basic' | 'fixed' | 'dynamic' | 'switch' | 'combined' | 'baseline'

const ROW_COUNT_OPTIONS = [1000, 10000, 50000, 100000] as const
const TABLE_HEIGHT_OPTIONS = [300, 400, 600] as const
const MAX_ROWS = 100000

const cities = ['New York', 'Chicago', 'London', 'Paris', 'Sydney', 'Tokyo', 'Berlin', 'Toronto']
const regions = ['North America', 'Europe', 'APAC']
const teams = ['Platform', 'Commerce', 'Design Systems', 'Operations']
const managers = ['Ava Quinn', 'Noah Reed', 'Mila Hart', 'Ethan Cole', 'Ivy Stone']
const offices = ['Guild Tower', 'Harbour Lab', 'Pattern Block', 'Signal Hub']
const levels = ['L1', 'L2', 'L3', 'L4']

let cachedRows: VirtualRow[] | null = null

function buildNotes(index: number) {
  const base = `Row ${index + 1} validates virtual range, fixed column sync and table interaction state.`
  if (index % 29 === 0) {
    return `${base} This long note intentionally spans multiple visual lines so dynamic measurement has to update the estimated scroll range after the row has been mounted and measured.`
  }
  if (index % 13 === 0) {
    return `${base} Medium note with extra operational metadata and a stable deterministic length.`
  }
  if (index % 7 === 0) {
    return `${base} Short extra note.`
  }
  return base
}

function buildRows() {
  if (cachedRows) return cachedRows

  const rows: VirtualRow[] = []
  for (let i = 0; i < MAX_ROWS; i += 1) {
    rows.push({
      key: i,
      name: `User ${i + 1}`,
      age: 20 + (i % 40),
      score: 50 + (i % 50),
      city: cities[i % cities.length],
      region: regions[i % regions.length],
      team: teams[i % teams.length],
      manager: managers[i % managers.length],
      office: `${offices[i % offices.length]} ${(i % 12) + 1}`,
      level: levels[i % levels.length],
      notes: buildNotes(i),
      description:
        i % 17 === 0
          ? `Detailed description for ${i + 1}. The cell wraps naturally and should not break row measurement when users jump through the list.`
          : `Compact description ${i + 1}.`,
      address: `Address Line ${i + 1}, Building ${(i % 99) + 1}`,
    })
  }

  cachedRows = rows
  return rows
}

function createMetric(label: string): CaseMetric {
  return {
    label,
    dataCount: 0,
    domRows: 0,
    renderMs: null,
    scrollMs: null,
  }
}

function waitForFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

const allRows = computed(() => buildRows())
const rowCount = ref<(typeof ROW_COUNT_OPTIONS)[number]>(10000)
const tableHeight = ref<(typeof TABLE_HEIGHT_OPTIONS)[number]>(400)
const switchRowCount = ref<10000 | 100000>(10000)
const selectedRowKeys = ref<Key[]>([0, 2, 4])

const caseRefs: Record<CaseKey, Ref<HTMLElement | ComponentPublicInstance | null>> = {
  basic: ref(null),
  fixed: ref(null),
  dynamic: ref(null),
  switch: ref(null),
  combined: ref(null),
  baseline: ref(null),
}

const displayData = computed(() => allRows.value.slice(0, rowCount.value))
const switchData = computed(() => allRows.value.slice(0, switchRowCount.value))
const baselineData = computed(() => allRows.value.slice(0, 50))

const caseDataCounts = computed<Record<CaseKey, number>>(() => ({
  basic: displayData.value.length,
  fixed: displayData.value.length,
  dynamic: displayData.value.length,
  switch: switchData.value.length,
  combined: displayData.value.length,
  baseline: baselineData.value.length,
}))

const metrics = ref<Record<CaseKey, CaseMetric>>({
  basic: createMetric('Case 01'),
  fixed: createMetric('Case 02'),
  dynamic: createMetric('Case 03'),
  switch: createMetric('Case 04'),
  combined: createMetric('Case 05'),
  baseline: createMetric('Case 06'),
})

const basicColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'City', dataIndex: 'city', key: 'city', width: 120 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

const fixedColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'City', dataIndex: 'city', key: 'city', width: 140 },
  { title: 'Region', dataIndex: 'region', key: 'region', width: 180 },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 180 },
  { title: 'Manager', dataIndex: 'manager', key: 'manager', width: 220 },
  { title: 'Office', dataIndex: 'office', key: 'office', width: 220 },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', width: 420 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 320, fixed: 'right' },
]

const dynamicColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150, fixed: 'left' },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 150 },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', width: 360, className: 'virtual-wrap-cell' },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    width: 420,
    className: 'virtual-wrap-cell',
  },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 260 },
]

const combinedColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160, fixed: 'left', sorter: true },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.score - b.score,
  },
  {
    title: 'Region',
    dataIndex: 'region',
    key: 'region',
    width: 180,
    filters: regions.map((region) => ({ text: region, value: region })),
    onFilter: (value, record) => record.region === value,
  },
  {
    title: 'Team',
    dataIndex: 'team',
    key: 'team',
    width: 190,
    filters: teams.map((team) => ({ text: team, value: team })),
    onFilter: (value, record) => record.team === value,
  },
  { title: 'Level', dataIndex: 'level', key: 'level', width: 110, sorter: true },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 320 },
]

const rowSelection = computed<RowSelection<VirtualRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: selectedRowKeys.value,
  fixed: true,
  preserveSelectedRowKeys: true,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))

function setCaseRef(caseKey: CaseKey) {
  return (el: Element | ComponentPublicInstance | null) => {
    caseRefs[caseKey].value = el as HTMLElement | ComponentPublicInstance | null
  }
}

function getElement(target: HTMLElement | ComponentPublicInstance | null): HTMLElement | null {
  if (!target) return null
  return target instanceof HTMLElement ? target : (target.$el as HTMLElement | null)
}

function getCaseElement(caseKey: CaseKey) {
  return getElement(caseRefs[caseKey].value)
}

function countRenderedRows(caseKey: CaseKey) {
  const el = getCaseElement(caseKey)
  return el?.querySelectorAll('tbody tr').length ?? 0
}

function findVirtualHolder(caseKey: CaseKey) {
  const el = getCaseElement(caseKey)
  return el?.querySelector<HTMLElement>('.vtg-virtual-list-holder') ?? null
}

async function settle() {
  await nextTick()
  await waitForFrame()
  await waitForFrame()
}

async function measureCase(caseKey: CaseKey, mode: 'render' | 'scroll' = 'render') {
  const start = performance.now()
  await settle()
  const elapsed = performance.now() - start
  const current = metrics.value[caseKey]

  metrics.value = {
    ...metrics.value,
    [caseKey]: {
      ...current,
      dataCount: caseDataCounts.value[caseKey],
      domRows: countRenderedRows(caseKey),
      renderMs: mode === 'render' ? elapsed : current.renderMs,
      scrollMs: mode === 'scroll' ? elapsed : current.scrollMs,
    },
  }
}

async function setRowCount(count: (typeof ROW_COUNT_OPTIONS)[number]) {
  rowCount.value = count
  await measureCase('basic')
  await measureCase('fixed')
  await measureCase('dynamic')
  await measureCase('combined')
}

async function setTableHeight(height: (typeof TABLE_HEIGHT_OPTIONS)[number]) {
  tableHeight.value = height
  await measureCase('basic')
  await measureCase('fixed')
  await measureCase('dynamic')
  await measureCase('combined')
}

async function toggleSwitchData() {
  switchRowCount.value = switchRowCount.value === 10000 ? 100000 : 10000
  await measureCase('switch')
}

async function sampleScrollToBottom(caseKey: CaseKey) {
  const holder = findVirtualHolder(caseKey)
  if (!holder) {
    await measureCase(caseKey, 'scroll')
    return
  }

  const start = performance.now()
  holder.scrollTop = Number.MAX_SAFE_INTEGER
  holder.dispatchEvent(new Event('scroll', { bubbles: true }))
  await settle()

  const current = metrics.value[caseKey]
  metrics.value = {
    ...metrics.value,
    [caseKey]: {
      ...current,
      dataCount: caseDataCounts.value[caseKey],
      domRows: countRenderedRows(caseKey),
      scrollMs: performance.now() - start,
    },
  }
}

function formatMs(value: number | null) {
  return value === null ? '-' : `${value.toFixed(1)} ms`
}

onMounted(async () => {
  await measureCase('basic')
  await measureCase('fixed')
  await measureCase('dynamic')
  await measureCase('switch')
  await measureCase('combined')
  await measureCase('baseline')
})
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Phase 6 Virtual Scrolling</p>
        <h1>虚拟滚动验证</h1>
        <p class="play-summary">
          覆盖大数据、动态行高、固定列、排序筛选选择组合与高频数据切换。指标只用于 playground
          手动观察，不作为跨机器 benchmark。
        </p>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Current data</span>
        <strong>{{ rowCount.toLocaleString() }} rows</strong>
        <p>默认 10,000 行，可切到 100,000 行观察可见行渲染规模。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Table height</span>
        <strong>{{ tableHeight }} px</strong>
        <p>切换纵向 viewport 高度，验证虚拟可见范围和 overscan。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Selected keys</span>
        <strong>{{ selectedRowKeys.length }}</strong>
        <p>组合 case 中测试 rowSelection 与虚拟列表的状态稳定性。</p>
      </article>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Controls</p>
          <h2>全局虚拟滚动参数</h2>
        </div>
        <p class="play-case__desc">行数和高度会影响 Case 01、02、03、05。</p>
      </header>
      <div class="virtual-toolbar-group">
        <div class="play-toolbar" aria-label="Row count">
          <button
            v-for="count in ROW_COUNT_OPTIONS"
            :key="count"
            type="button"
            class="play-ghost-button"
            :class="{ 'is-virtual-active': rowCount === count }"
            @click="setRowCount(count)"
          >
            {{ count.toLocaleString() }} 行
          </button>
        </div>
        <div class="play-toolbar" aria-label="Table height">
          <button
            v-for="height in TABLE_HEIGHT_OPTIONS"
            :key="height"
            type="button"
            class="play-ghost-button"
            :class="{ 'is-virtual-active': tableHeight === height }"
            @click="setTableHeight(height)"
          >
            {{ height }} px
          </button>
        </div>
      </div>
    </section>

    <section :ref="setCaseRef('basic')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 01</p>
          <h2>基础大数据虚拟滚动</h2>
        </div>
        <p class="play-case__desc">virtual + scroll.y，仅渲染可见行，支持全局行数和高度切换。</p>
      </header>
      <div class="virtual-case-tools">
        <button type="button" class="play-ghost-button" @click="measureCase('basic')">
          重新采集渲染
        </button>
        <button type="button" class="play-solid-button" @click="sampleScrollToBottom('basic')">
          滚动到底部采样
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.basic.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.basic.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.basic.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.basic.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="displayData"
        :columns="basicColumns"
        :scroll="{ y: tableHeight }"
        :virtual="true"
        size="middle"
        row-key="key"
      />
    </section>

    <section :ref="setCaseRef('fixed')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 02</p>
          <h2>虚拟滚动 + 固定列 + 横向滚动</h2>
        </div>
        <p class="play-case__desc">
          固定左右列并强制宽表，纵向虚拟滚动时同步横向滚动和固定列阴影状态。
        </p>
      </header>
      <div class="virtual-case-tools">
        <button type="button" class="play-ghost-button" @click="measureCase('fixed')">
          重新采集渲染
        </button>
        <button type="button" class="play-solid-button" @click="sampleScrollToBottom('fixed')">
          滚动到底部采样
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.fixed.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.fixed.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.fixed.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.fixed.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="displayData"
        :columns="fixedColumns"
        :scroll="{ x: 2130, y: tableHeight }"
        :virtual="true"
        size="middle"
        row-key="key"
      />
    </section>

    <section :ref="setCaseRef('dynamic')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 03</p>
          <h2>动态行高内容</h2>
        </div>
        <p class="play-case__desc">
          每 7/13/29 行生成不同长度文本，验证动态高度测量和滚动范围计算。
        </p>
      </header>
      <div class="virtual-case-tools">
        <button type="button" class="play-ghost-button" @click="measureCase('dynamic')">
          重新采集渲染
        </button>
        <button type="button" class="play-solid-button" @click="sampleScrollToBottom('dynamic')">
          滚动到底部采样
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.dynamic.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.dynamic.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.dynamic.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.dynamic.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="displayData"
        :columns="dynamicColumns"
        :scroll="{ x: 1340, y: tableHeight }"
        :virtual="true"
        size="middle"
        row-key="key"
      />
    </section>

    <section :ref="setCaseRef('switch')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 04</p>
          <h2>高频数据切换</h2>
        </div>
        <p class="play-case__desc">在 10,000 与 100,000 行之间切换，观察重算和重挂载稳定耗时。</p>
      </header>
      <div class="virtual-case-tools">
        <button type="button" class="play-solid-button" @click="toggleSwitchData">
          切换到 {{ switchRowCount === 10000 ? '100,000' : '10,000' }} 行
        </button>
        <button type="button" class="play-ghost-button" @click="measureCase('switch')">
          重新采集渲染
        </button>
        <button type="button" class="play-ghost-button" @click="sampleScrollToBottom('switch')">
          滚动到底部采样
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.switch.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.switch.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.switch.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.switch.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="switchData"
        :columns="basicColumns"
        :scroll="{ y: tableHeight }"
        :virtual="true"
        size="middle"
        row-key="key"
      />
    </section>

    <section :ref="setCaseRef('combined')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 05</p>
          <h2>虚拟滚动 + 排序/筛选/选择</h2>
        </div>
        <p class="play-case__desc">
          sorter、filters、rowSelection 叠加，筛选或排序后继续滚动观察状态和性能指标。
        </p>
      </header>
      <p class="play-inline-note">selectedRowKeys = [{{ selectedRowKeys.join(', ') || 'none' }}]</p>
      <div class="virtual-case-tools">
        <button type="button" class="play-ghost-button" @click="selectedRowKeys = []">
          清空选择
        </button>
        <button type="button" class="play-ghost-button" @click="measureCase('combined')">
          重新采集渲染
        </button>
        <button type="button" class="play-solid-button" @click="sampleScrollToBottom('combined')">
          滚动到底部采样
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.combined.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.combined.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.combined.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.combined.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="displayData"
        :columns="combinedColumns"
        :row-selection="rowSelection as any"
        :scroll="{ x: 1070, y: tableHeight }"
        :virtual="true"
        size="middle"
        row-key="key"
      />
    </section>

    <section :ref="setCaseRef('baseline')" class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 06</p>
          <h2>非虚拟基线对照 (50 行)</h2>
        </div>
        <p class="play-case__desc">不开启 virtual 的小数据表格，作为功能和视觉回归对照。</p>
      </header>
      <div class="virtual-case-tools">
        <button type="button" class="play-ghost-button" @click="measureCase('baseline')">
          重新采集渲染
        </button>
      </div>
      <div class="virtual-metrics">
        <span>数据量 {{ metrics.baseline.dataCount.toLocaleString() }}</span>
        <span>DOM 行 {{ metrics.baseline.domRows }}</span>
        <span>渲染 {{ formatMs(metrics.baseline.renderMs) }}</span>
        <span>滚动 {{ formatMs(metrics.baseline.scrollMs) }}</span>
      </div>
      <VTable
        :data-source="baselineData"
        :columns="basicColumns"
        :scroll="{ y: 300 }"
        size="middle"
        row-key="key"
      />
    </section>
  </main>
</template>

<style scoped>
.virtual-toolbar-group {
  display: grid;
  gap: 2px;
}

.virtual-case-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.virtual-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.virtual-metrics span {
  min-height: 38px;
  padding: 9px 10px;
  border: 1px solid var(--play-line);
  border-radius: 12px;
  background: rgb(255 255 255 / 58%);
  color: var(--play-muted);
  font-size: 0.84rem;
  line-height: 1.35;
}

.play-ghost-button.is-virtual-active {
  border-color: rgb(186 91 50 / 42%);
  background: var(--play-accent-soft);
  color: var(--play-accent);
}

:deep(.virtual-wrap-cell) {
  white-space: normal;
  line-height: 1.55;
}

@media (width <= 720px) {
  .virtual-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
