<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue'

import {
  ANTDV_GUARD_CELLS,
  COLUMN_COUNTS,
  EXTRA_COLUMN_WIDTH,
  PERF_COLUMNS,
  ROW_COUNTS,
  ROW_HEIGHT,
  SUBJECT_IDS,
  SUBJECT_LABELS,
  TABLE_WIDTH,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  formatRowCount,
  tableWidth,
  type SubjectId,
} from './columns'
import { ensureRows, getRows } from './data'
import { collectEnv } from './env'
import { countDomNodes, readMemory, MEMORY_SOURCE_NOTE } from './metrics/memory'
import { createInteractionRecorder, createLongTaskRecorder } from './metrics/observers'
import { MEASURED_RUNS, WARMUP_RUNS } from './metrics/runner'
import {
  afterPaint,
  probeFrameRate,
  settle,
  stat,
  timeToFlush,
  type FrameHealth,
} from './metrics/runner'
import {
  SCENARIOS,
  toJson,
  toMarkdown,
  type InteractionResult,
  type RunResult,
  type ScenarioId,
  type ScenarioStats,
} from './results'
import type { SubjectExposed } from './subjects/types'
import { countRenderedColumns, measureRowHeight } from './utils/dom'
import EnvPanel from './components/EnvPanel.vue'
import ResultTable from './components/ResultTable.vue'

/** 单轮超过这个耗时就降为只跑 1 轮，避免非虚拟大表把标签页锁死几分钟。 */
const HEAVY_RUN_MS = 5_000
/** 单轮超过这个耗时直接记为「未完成」——跑不动本身就是结论。 */
const ABORT_RUN_MS = 60_000
/** 连续滚动场景的帧数与每帧步进。 */
const SCROLL_FRAMES = 30
const SCROLL_STEP = 400

const env = collectEnv()

const subject = ref<SubjectId>('vtable-guild')
const rowCount = ref<number>(ROW_COUNTS[0])
const columnCount = ref<number>(COLUMN_COUNTS[0])
const subjectComponent = shallowRef<unknown>(null)
const mounted = ref(false)
const mountKey = ref(0)
const busy = ref(false)
/** 交互测量的锁刻意用非响应式变量，避免在测量窗口里触发 App 重渲染。 */
let interactionBusy = false
const progress = ref('')

const hostRef = useTemplateRef<HTMLElement>('host')
const subjectRef = useTemplateRef<SubjectExposed>('subjectInstance')

const results = ref<RunResult[]>([])
const interactions = ref<InteractionResult[]>([])
const lastFrameHealth = ref<FrameHealth | null>(null)

const longTasks = createLongTaskRecorder()
const interactionRecorder = createInteractionRecorder()

onBeforeUnmount(() => {
  longTasks.dispose()
  interactionRecorder.dispose()
})

const rows = computed(() => getRows(rowCount.value))

/** 当前档位会进 DOM 的单元格总数——antdv 4.x 护栏按它判定。 */
const cellCount = computed(() => rowCount.value * columnCount.value)

const needsAntdvGuard = computed(
  () => subject.value === 'antdv' && cellCount.value > ANTDV_GUARD_CELLS,
)

const loaders: Record<SubjectId, () => Promise<{ default: unknown }>> = {
  'vtable-guild': () => import('./subjects/VtgSubject.vue'),
  'vtable-guild-fixed': () => import('./subjects/VtgFixedSubject.vue'),
  'vtable-guild-vcol': () => import('./subjects/VtgVirtualColumnSubject.vue'),
  antdv: () => import('./subjects/AntdvSubject.vue'),
  'antdv-next': () => import('./subjects/AntdvNextSubject.vue'),
  'el-table-v2': () => import('./subjects/ElTableV2Subject.vue'),
  'vxe-table': () => import('./subjects/VxeTableSubject.vue'),
}

/**
 * 预加载被测组件——**必须在计时窗口之外**。
 * 否则首次渲染的数字里会混进该库几百 KB 的模块求值耗时，
 * 那是加载成本不是渲染成本。
 */
async function preload(id: SubjectId): Promise<void> {
  progress.value = `加载 ${SUBJECT_LABELS[id]} …`
  const mod = await loaders[id]()
  subjectComponent.value = markRaw(mod.default as object)
}

async function unmountSubject(): Promise<void> {
  mounted.value = false
  await nextTick()
  await settle()
}

function exposed(): SubjectExposed | null {
  return subjectRef.value ?? null
}

/** 跑一个场景：开窗 → 动作 → 同步 flush → 等这一帧画完 → settle → 关窗。 */
async function runScenario(
  mutate: () => void,
): Promise<{ sync: number; wall: number; longTask: number }> {
  // 先把页面自身待刷新的状态（progress 文案等）冲干净，
  // 否则它们会和被测动作在同一次 flush 里，混进测量窗口。
  await nextTick()
  longTasks.start()
  const t0 = performance.now()
  const sync = await timeToFlush(mutate)
  await afterPaint()
  const wall = performance.now() - t0
  await settle()
  const sample = longTasks.stop()
  return { sync, wall, longTask: sample.totalMs }
}

async function scrollTo(top: number): Promise<void> {
  const el = exposed()?.getScroller()
  if (el) el.scrollTop = top
  await settle()
}

async function runBatch(): Promise<void> {
  if (busy.value) return
  if (needsAntdvGuard.value) {
    const ok = window.confirm(
      `ant-design-vue Table 4.x 没有虚拟滚动。\n\n` +
        `${rowCount.value.toLocaleString()} 行 × ${columnCount.value} 列 ≈ ` +
        `${cellCount.value.toLocaleString()} 个单元格会全部进 DOM，` +
        `标签页可能长时间无响应甚至崩溃。\n\n这正是对照要呈现的事实。确认继续？`,
    )
    if (!ok) return
  }

  busy.value = true
  try {
    // 数据与组件都在计时窗口之外准备好。
    progress.value = '准备数据 …'
    ensureRows(rowCount.value)
    await preload(subject.value)
    await unmountSubject()
    await settle(4)

    // 先自检 rAF 有没有被节流：窗口不可见 / 被遮挡时 rAF 会掉到约 1 次/秒，
    // 所有 paint 相关的墙钟都会退化成与库无关的常数。
    progress.value = '自检帧率 …'
    const frameHealth = await probeFrameRate()
    lastFrameHealth.value = frameHealth

    const sync: Record<ScenarioId, number[]> = {
      mount: [],
      sort: [],
      scrollJump: [],
      scrollContinuous: [],
    }
    const wall: Record<ScenarioId, number[]> = {
      mount: [],
      sort: [],
      scrollJump: [],
      scrollContinuous: [],
    }
    const longTask: Record<ScenarioId, number[]> = {
      mount: [],
      sort: [],
      scrollJump: [],
      scrollContinuous: [],
    }

    let totalRuns = WARMUP_RUNS + MEASURED_RUNS
    let aborted = false
    let note: string | undefined

    for (let run = 0; run < totalRuns; run++) {
      const measured = run >= WARMUP_RUNS
      const label = measured ? `第 ${run - WARMUP_RUNS + 1}/${MEASURED_RUNS} 轮` : '预热轮'
      progress.value = `${SUBJECT_LABELS[subject.value]} · ${formatRowCount(rowCount.value)}行 × ${columnCount.value}列 · ${label} · 首次渲染 …`

      await unmountSubject()

      // S1 首次渲染
      const mount = await runScenario(() => {
        mountKey.value += 1
        mounted.value = true
      })
      if (measured) {
        sync.mount.push(mount.sync)
        wall.mount.push(mount.wall)
        longTask.mount.push(mount.longTask)
      }

      // 单轮太重就只跑一轮，不要把标签页锁死几分钟。
      if (run === 0 && mount.wall > ABORT_RUN_MS) {
        aborted = true
        note =
          `单轮首次渲染 ${Math.round(mount.wall)} ms 超过 ${ABORT_RUN_MS / 1000}s 阈值，` +
          `判定为该数据量下不可用，其余场景未采集。`
        break
      }
      if (run === 0 && mount.wall > HEAVY_RUN_MS) {
        totalRuns = WARMUP_RUNS + 1
        note =
          `单轮首次渲染 ${Math.round(mount.wall)} ms 超过 ${HEAVY_RUN_MS} ms 阈值，` +
          `仅采集 1 轮（非中位数），数字仅表数量级。`
      }

      // S2 排序切换
      progress.value = `${SUBJECT_LABELS[subject.value]} · ${label} · 排序 …`
      const sortRun = await runScenario(() => exposed()?.sort('ascend'))
      if (measured) {
        sync.sort.push(sortRun.sync)
        wall.sort.push(sortRun.wall)
        longTask.sort.push(sortRun.longTask)
      }
      exposed()?.sort(null)
      await settle()

      // S3 滚动到底
      progress.value = `${SUBJECT_LABELS[subject.value]} · ${label} · 滚动到底 …`
      await scrollTo(0)
      const scroller = exposed()?.getScroller()
      const jump = await runScenario(() => {
        if (scroller) scroller.scrollTop = scroller.scrollHeight
      })
      if (measured) {
        sync.scrollJump.push(jump.sync)
        wall.scrollJump.push(jump.wall)
        longTask.scrollJump.push(jump.longTask)
      }

      // S4 连续滚动
      progress.value = `${SUBJECT_LABELS[subject.value]} · ${label} · 连续滚动 …`
      await scrollTo(0)
      longTasks.start()
      const t0 = performance.now()
      for (let f = 0; f < SCROLL_FRAMES; f++) {
        const el = exposed()?.getScroller()
        if (el) el.scrollTop = el.scrollTop + SCROLL_STEP
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
      }
      const continuousWall = performance.now() - t0
      await settle()
      const continuousLong = longTasks.stop().totalMs
      if (measured) {
        // 连续滚动没有「同步 flush」语义（每帧一次），sync 与 wall 记同一个值。
        sync.scrollContinuous.push(continuousWall)
        wall.scrollContinuous.push(continuousWall)
        longTask.scrollContinuous.push(continuousLong)
      }
      await scrollTo(0)
    }

    // 静态快照：DOM 规模、内存、实测行高。
    progress.value = '读取 DOM / 行高 …'
    await settle(4)
    const domNodes = countDomNodes(hostRef.value)
    const rowSelector = exposed()?.rowSelector ?? 'tr'
    const rowHeight = measureRowHeight(hostRef.value, rowSelector)
    const renderedRows = hostRef.value?.querySelectorAll(rowSelector).length ?? 0
    const renderedColumns = countRenderedColumns(hostRef.value, rowSelector)

    /**
     * 内存测的是**挂载增量**，不是会话堆总量。
     *
     * 直接读 `usedJSHeapSize` 会把之前所有档位的数据缓存和累积垃圾都算进来，
     * 跨库根本没法比。这里先卸载读一次基线，再挂载读一次，取差值——
     * 仍然受不能强制 GC 的限制，但至少量的是「这张表挂上去多占了多少」。
     */
    progress.value = '测量内存增量 …'
    await unmountSubject()
    await settle(6)
    const before = await readMemory()
    mountKey.value += 1
    mounted.value = true
    await nextTick()
    await settle(6)
    const after = await readMemory()
    const memoryBytes =
      before.bytes !== null && after.bytes !== null ? after.bytes - before.bytes : null

    const scenarios: Partial<Record<ScenarioId, ScenarioStats>> = {}
    for (const s of SCENARIOS) {
      scenarios[s.id] = {
        sync: stat(sync[s.id]),
        wall: stat(wall[s.id]),
        longTask: stat(longTask[s.id]),
      }
    }

    const entry: RunResult = {
      subject: subject.value,
      rowCount: rowCount.value,
      columnCount: columnCount.value,
      status: aborted ? 'aborted' : 'ok',
      note,
      scenarios,
      domNodes,
      renderedRows,
      renderedColumns,
      memoryBytes,
      memorySource: after.source,
      rowHeight,
      longTaskSupported: longTasks.supported,
      frameHealth,
    }

    const idx = results.value.findIndex(
      (r) =>
        r.subject === entry.subject &&
        r.rowCount === entry.rowCount &&
        r.columnCount === entry.columnCount,
    )
    if (idx >= 0) results.value.splice(idx, 1, entry)
    else results.value.push(entry)

    progress.value = '完成'
  } finally {
    busy.value = false
  }
}

/**
 * 真实交互延迟：必须由**用户真的点击**触发。
 * Event Timing 只对可信输入分配 interactionId，程序化触发拿不到，
 * 所以这条路径与上面的批量跑分是分开的，口径也不同（单样本）。
 */
async function measureRealInteraction(scenario: ScenarioId): Promise<void> {
  // 用非响应式的锁：如果这里改 busy.value，App 自身会在被测窗口里
  // 跟着重渲染一次，把无关开销算进这次交互。
  if (interactionBusy || busy.value || !mounted.value) return
  interactionBusy = true
  interactionRecorder.arm()

  // 动作必须在这个 handler 里同步做掉。
  if (scenario === 'sort') {
    exposed()?.sort('descend')
  } else {
    const el = exposed()?.getScroller()
    if (el) el.scrollTop = el.scrollHeight
  }

  await settle(6)
  const sample = interactionRecorder.read()
  if (sample) {
    interactions.value.push({
      subject: subject.value,
      rowCount: rowCount.value,
      columnCount: columnCount.value,
      scenario,
      sample,
    })
  } else {
    progress.value = '这次点击没采到 Event Timing 条目——可能是延迟低于 16ms 阈值，或浏览器不支持。'
  }
  if (scenario === 'sort') exposed()?.sort(null)
  interactionBusy = false
}

async function mountCurrent(): Promise<void> {
  if (busy.value) return
  if (needsAntdvGuard.value) {
    const ok = window.confirm(
      `ant-design-vue Table 4.x 没有虚拟滚动，${rowCount.value.toLocaleString()} 行 × ` +
        `${columnCount.value} 列 ≈ ${cellCount.value.toLocaleString()} 个单元格会全部进 DOM，` +
        `标签页可能长时间无响应。确认继续？`,
    )
    if (!ok) return
  }
  busy.value = true
  try {
    ensureRows(rowCount.value)
    await preload(subject.value)
    await unmountSubject()
    mountKey.value += 1
    mounted.value = true
    await nextTick()
    await settle()
    progress.value = '已挂载'
  } finally {
    busy.value = false
  }
}

async function selectSubject(id: SubjectId): Promise<void> {
  if (busy.value) return
  subject.value = id
  await unmountSubject()
  progress.value = ''
}

async function selectRowCount(n: number): Promise<void> {
  if (busy.value) return
  rowCount.value = n
  await unmountSubject()
  progress.value = ''
}

async function selectColumnCount(n: number): Promise<void> {
  if (busy.value) return
  columnCount.value = n
  await unmountSubject()
  progress.value = ''
}

const memoryNote = computed(() => {
  const src = results.value.find((r) => r.memorySource !== 'unavailable')?.memorySource
  return src ? MEMORY_SOURCE_NOTE[src] : null
})

const markdown = computed(() => toMarkdown(env, results.value, interactions.value))
const json = computed(() => toJson(env, results.value, interactions.value))

function clearResults(): void {
  results.value = []
  interactions.value = []
}
</script>

<template>
  <main class="perf-page">
    <p v-if="env.isDev" class="perf-banner perf-banner--danger">
      ⚠ 当前是 <strong>dev 构建</strong>，所有数字会被放大 3–5×，<strong>不可作为基线</strong>。
      报数请用 <code>pnpm perf:build &amp;&amp; pnpm perf:preview</code>。
    </p>

    <header class="perf-hero">
      <p class="perf-kicker">Performance Comparison</p>
      <h1>表格性能对照</h1>
      <p class="perf-summary">
        在<strong>同一批数据、同一套列配置</strong>下对照 vtable-guild、ant-design-vue Table、
        antdv-next、el-table-v2 与 vxe-table。采集方法与环境全部公开，你可以在自己的机器上跑出
        自己的数字，并一键导出对照结果。
      </p>
      <p class="perf-summary perf-summary--muted">
        这个页面的价值在于它敢报出对 vtable-guild 不利的数字。el-table-v2 是纯 div
        定高虚拟化，挂载本就更快；vxe-table 在宽表档有横向虚拟化，我们的
        <code>virtualColumn</code> 也要开了才追得上。差异来源写在下方的能力边界表里。
      </p>
    </header>

    <EnvPanel :env="env" />

    <section class="perf-card">
      <h2>1 · 选择对照项</h2>
      <p class="perf-group-label">被测库</p>
      <div class="perf-toolbar">
        <button
          v-for="id in SUBJECT_IDS"
          :key="id"
          type="button"
          :disabled="busy"
          :class="subject === id ? 'perf-btn perf-btn--solid' : 'perf-btn'"
          @click="selectSubject(id)"
        >
          {{ SUBJECT_LABELS[id] }}
        </button>
      </div>

      <p class="perf-group-label">数据量</p>
      <div class="perf-toolbar">
        <button
          v-for="n in ROW_COUNTS"
          :key="n"
          type="button"
          :disabled="busy"
          :class="rowCount === n ? 'perf-btn perf-btn--solid' : 'perf-btn'"
          @click="selectRowCount(n)"
        >
          {{ formatRowCount(n) }}行
        </button>
      </div>

      <p class="perf-group-label">列数</p>
      <div class="perf-toolbar">
        <button
          v-for="n in COLUMN_COUNTS"
          :key="n"
          type="button"
          :disabled="busy"
          :class="columnCount === n ? 'perf-btn perf-btn--solid' : 'perf-btn'"
          @click="selectColumnCount(n)"
        >
          {{ n }}列
        </button>
      </div>

      <p v-if="columnCount > PERF_COLUMNS.length" class="perf-note">
        宽表档：列总宽 {{ tableWidth(columnCount).toLocaleString() }}px，可视区夹到
        <strong>{{ VIEWPORT_WIDTH }}px</strong>，超出部分由表格自己横向滚动。 对照的是
        antdv-next#427 那类「列多到卡死」的场景——结果表里的
        <strong>可视列数</strong>一列就是判据：等于 {{ columnCount }} 说明该库
        <strong>没有横向虚拟化</strong>。
      </p>

      <p v-if="needsAntdvGuard" class="perf-note perf-note--warn">
        ⚠ ant-design-vue Table 4.x 没有虚拟滚动：{{ rowCount.toLocaleString() }} 行 ×
        {{ columnCount }} 列 ≈ {{ cellCount.toLocaleString() }} 个单元格会全部进
        DOM。点击运行时会二次确认。
      </p>
    </section>

    <section class="perf-card">
      <h2>2 · 跑分</h2>
      <div class="perf-toolbar">
        <button type="button" class="perf-btn perf-btn--solid" :disabled="busy" @click="runBatch">
          批量跑分（预热 {{ WARMUP_RUNS }} + 正式 {{ MEASURED_RUNS }} 轮）
        </button>
        <button type="button" class="perf-btn" :disabled="busy" @click="mountCurrent">
          仅挂载（不跑分）
        </button>
        <button type="button" class="perf-btn" :disabled="busy" @click="clearResults">
          清空结果
        </button>
      </div>
      <p v-if="progress" class="perf-progress">{{ busy ? '⏳' : '✅' }} {{ progress }}</p>

      <p v-if="lastFrameHealth?.throttled" class="perf-banner perf-banner--danger">
        ⚠ 采集时窗口被浏览器<strong>节流</strong>了（rAF 中位帧间隔
        {{ lastFrameHealth.medianFrameMs.toFixed(1) }}ms，正常约 16.7ms）。
        窗口被最小化、被其他窗口完全遮挡、或处于后台标签页时都会这样。
        <strong>「墙钟」列因此不可用</strong>；表里给出的是不受节流影响的
        <strong>同步 render+patch</strong> 与 <strong>longtask</strong>。
        要拿完整数字，请把窗口置于前台且完整可见后重跑。
      </p>

      <p class="perf-group-label">真实交互延迟（需要你亲自点击）</p>
      <p class="perf-note">
        Event Timing 只对<strong>真实用户输入</strong>分配
        <code>interactionId</code>，程序化触发拿不到。
        所以这两个按钮是单独的：点一次，采一个样本，口径与上面的多轮中位数<strong>不同</strong>。
      </p>
      <div class="perf-toolbar">
        <button
          type="button"
          class="perf-btn"
          :disabled="busy || !mounted"
          @click="measureRealInteraction('sort')"
        >
          真实点击 · 排序
        </button>
        <button
          type="button"
          class="perf-btn"
          :disabled="busy || !mounted"
          @click="measureRealInteraction('scrollJump')"
        >
          真实点击 · 滚动到底
        </button>
      </div>
    </section>

    <ResultTable
      :results="results"
      :interactions="interactions"
      :markdown="markdown"
      :json="json"
      :memory-note="memoryNote"
    />

    <section class="perf-card">
      <h2>能力边界（数字要和这张表一起读）</h2>
      <p class="perf-note">
        只比耗时不比能力是不诚实的。el-table-v2 挂载更快、vxe-table 宽表更快，代价写在这里。
      </p>
      <div class="perf-table-scroll">
        <table class="perf-matrix">
          <thead>
            <tr>
              <th>能力</th>
              <th>vtable-guild</th>
              <th>ant-design-vue Table 4.x</th>
              <th>antdv-next Table</th>
              <th>el-table-v2</th>
              <th>vxe-table</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>虚拟滚动（行）</td>
              <td class="ok">✅</td>
              <td class="no">❌ 无</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>横向虚拟化（列）</td>
              <td class="ok">✅ 需开 <code>virtualColumn</code></td>
              <td class="no">❌</td>
              <td class="no">❌</td>
              <td class="no">❌</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>不定行高</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌ 必须定高</td>
              <td class="no">❌ 开纵向虚拟滚动后不支持</td>
            </tr>
            <tr>
              <td>内置排序</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌ 应用侧自己排</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>内置筛选面板</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>多级表头</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>单元格合并</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌ 虚拟模式下无效</td>
              <td class="no">❌</td>
              <td class="ok">✅</td>
            </tr>
            <tr>
              <td>语义化 <code>&lt;table&gt;</code> 表体</td>
              <td class="ok">✅</td>
              <td class="ok">✅</td>
              <td class="no">❌ 纯 div</td>
              <td class="no">❌ 纯 div</td>
              <td class="ok">✅</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="perf-note">
        这张表不靠印象填。「横向虚拟化」看结果表的<strong>可视列数</strong>（200 列档只有 vxe-table
        与开了 <code>virtualColumn</code> 的我们会窗口化）；「语义化
        <code>&lt;table&gt;</code>」直接看表体 DOM（vxe-table 的 <code>.vxe-body--row</code> 是真
        <code>&lt;tr&gt;</code>，antdv-next 与 el-table-v2 都是 div）；其余各项查的是<strong
          >各库自己 npm 包里的类型声明</strong
        >，版本与上方「采集环境」一致。
      </p>
      <p class="perf-note">
        两处值得单独说明：vxe-table 的
        <code>scroll-y.gt</code>
        在它自己的类型注释里写明「启用纵向虚拟滚动之后将不能支持动态行高」，所以大数据档它和
        el-table-v2 一样要定高；antdv-next 的虚拟表体基于 <code>@v-c/virtual-list</code>（用
        ResizeObserver 实测行高，<code>listItemHeight</code> 只是估算值），所以不定行高成立，
        但它在虚拟模式下不支持单元格合并。
      </p>
    </section>

    <section class="perf-card">
      <h2>被测表格</h2>
      <p class="perf-note">
        同一时刻只挂载一个库——这样 longtask 窗口与内存读数里就不会掺进其他几家的 JS。
      </p>
      <div ref="host" class="perf-host">
        <component
          :is="subjectComponent"
          v-if="mounted && subjectComponent"
          :key="mountKey"
          ref="subjectInstance"
          :rows="rows"
          :column-count="columnCount"
        />
        <p v-else class="perf-placeholder">未挂载。点「批量跑分」或「仅挂载」。</p>
      </div>
    </section>

    <section class="perf-card perf-card--method">
      <h2>方法论（请连同数字一起复核）</h2>

      <h3>公平性契约</h3>
      <ul>
        <li>
          <strong>同一个数组引用</strong>传给所有被测库；数据用下标 + 乘法散列
          <code>(i * 2654435761) &gt;&gt;&gt; 0</code> 确定性生成，<strong>不用</strong>
          <code>Math.random()</code>——随机数会让排序命中「已有序」最优路径。
        </li>
        <li>
          基准档 6 列<strong>全部定宽</strong>（{{
            PERF_COLUMNS.map((c) => `${c.title} ${c.width}`).join(' / ')
          }}， 合计 {{ TABLE_WIDTH }}px）。el-table-v2 不支持 flex 宽度，为对齐各家也全部定宽。
        </li>
        <li>
          <strong>列数维度</strong>：50/200 列档在 6 个基础列之后追加合成列（每列
          {{ EXTRA_COLUMN_WIDTH }}px，与 antdv-next#427 的复现用例一致）。
          合成列<strong>轮流复用</strong>那 6 个数据字段，不新建字段——单元格取值来自
          <code>row.city</code> 还是 <code>row.col_37</code> 对渲染开销没有可测量的影响， 而真给 10
          万行各配 200 个字段会产生约 1GB 常驻数据，GC 压力反过来会污染 内存与 longtask
          读数。复用还保证了所有列数档吃到<strong>同一个数组引用</strong>， 唯一的自变量就是列数。
        </li>
        <li>
          <strong>宿主宽度必须夹住</strong>：宿主若按列总宽撑开（200 列约
          {{ tableWidth(200).toLocaleString() }}px），表格内部就不会横向滚动，各家只是把
          全宽画出来——那测的不是横向虚拟化。所以宽表档把可视区夹到 {{ VIEWPORT_WIDTH }}px。6
          列档总宽 {{ TABLE_WIDTH }}px 小于它，宿主宽度与加
          列数维度之前<strong>完全一致</strong>，历史数字不受影响。
        </li>
        <li>
          vxe-table 的 <code>scroll-x</code> 与 <code>scroll-y</code>
          都<strong>显式打开</strong>。它是这几家里唯一内置横向虚拟滚动的，
          不打开就等于藏掉它在宽表档的看家本领，对照会系统性地对它不利。
        </li>
        <li>
          可视区高度统一 <strong>{{ VIEWPORT_HEIGHT }}px</strong>，行高统一
          <strong>{{ ROW_HEIGHT }}px</strong>。行高不一致会直接改变可视行数与 DOM
          节点数，是最容易失真的一处——结果表里有<strong>实测行高</strong>与
          <strong>可视行数</strong>两列供你核对。
        </li>
        <li>
          注意各家「高度」的语义不同：vtable-guild 与 antdv 的
          <code>scroll.y</code> 是<strong>表体</strong>高度，el-table-v2 的
          <code>height</code> 是<strong>含表头的总高</strong>， 所以传给它的是
          {{ VIEWPORT_HEIGHT }} + {{ ROW_HEIGHT }}。校准后 vtable-guild 与 el-table-v2 的表体都是
          {{ VIEWPORT_HEIGHT }}px、 可视行数都是 12 行。
        </li>
        <li>
          <strong>已知残留不对等</strong>：antdv 的表体实测约 445px（它给横向滚动条预留了空间），
          比另两家少约 15px。但 antdv 无虚拟滚动、本来就把全部行放进 DOM， 这 15px
          对它的数字影响可忽略。
        </li>
        <li>
          排序各家用<strong>同一个比较函数</strong>。特别注意：vtable-guild 的
          <code>sorter: true</code> 会真的排数据，而 antdv 的
          <code>sorter: true</code> 表示「交给服务端排」、本地什么都不做——两边都写 <code>true</code>
          会让 antdv 因为没干活而白赢。所以一律显式传比较函数。
        </li>
        <li>
          el-table-v2 <strong>不内置排序</strong>，应用侧的 sort 耗时<strong>计入它</strong>——
          这是用它时必须写的代码，不计等于让它免费跳过一个环节。
        </li>
        <li>
          被测组件在<strong>计时窗口之外</strong>预加载，避免几百 KB 的模块求值 混进「首次渲染」。
        </li>
      </ul>

      <h3>指标口径</h3>
      <ul>
        <li>
          <strong>墙钟</strong>：动作 → <code>nextTick</code> → 双
          <code>requestAnimationFrame</code>，即「这一帧真的画完」。
        </li>
        <li>
          <strong>longtask</strong>：<code>PerformanceObserver({ type: 'longtask' })</code>
          在动作窗口内的 <code>duration</code> 总和，即主线程被真正阻塞多久。
        </li>
        <li>
          <strong>交互延迟</strong>：Event Timing 的
          <code>input delay / processing / presentation</code> 三段拆解。
          <strong>它不叫 INP</strong>——INP 的定义是整个会话交互延迟的 p98， 单次交互叫 INP 是错的。
        </li>
        <li>
          <strong>内存</strong>：优先 <code>measureUserAgentSpecificMemory()</code>（需跨源隔离，
          GitHub Pages 给不了 COOP/COEP 头），回落到 Chrome 独有的
          <code>performance.memory</code>。测的是<strong>挂载增量</strong>——先卸载读基线、
          再挂载读一次、取差值；直接读堆总量会把之前所有档位的数据缓存和累积垃圾都算进来，
          跨库没法比。即便如此，它仍受<strong>无法强制 GC</strong>
          的限制，<strong>只能作数量级参考</strong>。
        </li>
        <li>
          <strong>DOM 节点数</strong>：整套指标里唯一零噪声、跨浏览器一致、无辩驳空间的数字。
          虚拟滚动到底有没有生效，看这一个数就够了。
        </li>
        <li>
          预热 {{ WARMUP_RUNS }} 轮丢弃 + 正式 {{ MEASURED_RUNS }} 轮取<strong>中位数</strong>，
          同时给出 min/max。
        </li>
      </ul>

      <h3>已知的不对等与取舍</h3>
      <ul>
        <li>
          <strong>宽表档不测固定列</strong>：antdv-next#427 的复现用例带 2 个左固定 + 1
          个右固定列，这里刻意不加。固定列的 sticky 定位开销会和列数开销混在一起， 而且各家固定列
          API 差异很大，加进来会同时引入混淆变量与不对等。 先把「列数 →
          渲染开销」这条主轴测干净，固定列留作后续单独一档。
        </li>
        <li>
          <strong>不测筛选与行选择</strong>：各家 API 差异过大（el-table-v2 两者都没有内置），
          硬测只是凑数。
        </li>
        <li>
          antdv 的 10w 行对照的是<strong>不分页直出</strong>场景。它的常规解法是分页， 或改用
          el-table-v2——这一点必须说清楚，否则就是稻草人。
        </li>
        <li>
          <strong>不引</strong> <code>ant-design-vue/dist/reset.css</code>：它是 unlayered 的， 按
          CSS Cascade Layers 规范会压过所有 layer 内规则。antdv 4.x 是 cssinjs 运行时注入样式，不引
          reset 不影响 Table 自身渲染。
        </li>
        <li>
          各家滚动都用同一个 DOM 操作 <code>el.scrollTop = …</code>， 不使用各自的
          <code>scrollTo</code> API。
        </li>
      </ul>

      <h3>怎么复现</h3>
      <ol>
        <li>克隆仓库，<code>pnpm install</code></li>
        <li><code>pnpm build</code></li>
        <li>
          <code>pnpm perf:preview</code>（<strong>必须是 production 构建</strong>，dev 会放大 3–5×）
        </li>
        <li>关掉其他标签页与扩展，跑完后点「复制为 Markdown」把结果发出来</li>
      </ol>
    </section>

    <footer class="perf-footer">
      <a href="https://github.com/parade0393/vtable-guild">GitHub</a>
      <span>·</span>
      <a href="https://parade0393.github.io/vtable-guild/">文档</a>
      <span>·</span>
      <a href="https://parade0393.github.io/vtable-guild/play/">Playground</a>
    </footer>
  </main>
</template>
