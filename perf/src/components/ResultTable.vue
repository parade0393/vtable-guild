<script setup lang="ts">
import { computed, ref } from 'vue'

import { ROW_HEIGHT, SUBJECT_LABELS, formatRowCount } from '../columns'
import { formatBytes } from '../metrics/memory'
import { SCENARIOS, type InteractionResult, type RunResult } from '../results'

const props = defineProps<{
  results: RunResult[]
  interactions: InteractionResult[]
  markdown: string
  json: string
  memoryNote: string | null
}>()

// 按「行数 × 列数」分组：宽表档与基准档的数字不能混在同一张表里读。
const grouped = computed(() => {
  const map = new Map<string, { rowCount: number; columnCount: number; list: RunResult[] }>()
  for (const r of props.results) {
    const key = `${r.rowCount}x${r.columnCount}`
    const group = map.get(key) ?? {
      rowCount: r.rowCount,
      columnCount: r.columnCount,
      list: [] as RunResult[],
    }
    group.list.push(r)
    map.set(key, group)
  }
  return [...map.entries()]
    .map(([key, g]) => ({ key, ...g }))
    .sort((a, b) => a.columnCount - b.columnCount || a.rowCount - b.rowCount)
})

function fmt(n: number): string {
  return n < 10 ? n.toFixed(1) : String(Math.round(n))
}

function cell(r: RunResult, id: (typeof SCENARIOS)[number]['id']): string {
  const s = r.scenarios[id]
  if (!s || s.sync.samples.length === 0) return '—'
  return `${fmt(s.sync.median)} / ${fmt(s.longTask.median)}`
}

function range(r: RunResult, id: (typeof SCENARIOS)[number]['id']): string {
  const s = r.scenarios[id]
  if (!s || s.sync.samples.length === 0) return ''
  const parts = [`min ${fmt(s.sync.min)} · max ${fmt(s.sync.max)}`]
  // 滚动类场景的更新发生在 scroll 事件里，不在同步 flush 内，sync 会接近 0；
  // 窗口没被节流时，paint 才是这两行有意义的数。
  if (!r.frameHealth.throttled) parts.unshift(`paint ${fmt(s.wall.median)}`)
  return parts.join(' · ')
}

const anyThrottled = computed(() => props.results.some((r) => r.frameHealth.throttled))

/** 行高偏离契约值就要红，这是公平性契约唯一能被外部核对的抓手。 */
function rowHeightOff(r: RunResult): boolean {
  return r.rowHeight !== null && Math.abs(r.rowHeight - ROW_HEIGHT) > 1
}

/**
 * 该库在这一档是否真的虚拟化了列。
 *
 * 判据是「首个可见行渲染的单元格数 < 总列数」。留 2 列余量：
 * 有的实现会多渲染一两列做缓冲，那仍然算虚拟化。
 */
function colVirtualized(r: RunResult): boolean {
  return r.renderedColumns > 0 && r.renderedColumns < r.columnCount - 2
}

const copied = ref('')

async function copy(text: string, what: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = `${what} 已复制`
  } catch {
    copied.value = `复制失败，请手动选中下方文本`
  }
  setTimeout(() => (copied.value = ''), 2400)
}

const showRaw = ref(false)
</script>

<template>
  <section class="perf-card">
    <h2>3 · 结果</h2>

    <p v-if="results.length === 0" class="perf-placeholder">
      还没有结果。选一个库和数据量，点「批量跑分」。
    </p>

    <template v-else>
      <p class="perf-note">
        单元格格式：<strong>同步 render+patch / longtask 总时长</strong>（ms，中位数）。
        前者是库自己控制的 vdom diff + DOM patch 工作量，<strong>不受 rAF 节流影响</strong>；
        后者是主线程被真正阻塞的时长。 <strong>「连续滚动」一列只看 longtask</strong>——它的耗时受
        rAF 节奏支配。
      </p>
      <p v-if="anyThrottled" class="perf-note perf-note--warn">
        ⚠ 本批结果采集时窗口被节流，paint 相关的墙钟不可用；上表两个数均为不受影响的口径。
      </p>

      <div v-for="g in grouped" :key="g.key" class="perf-result-block">
        <h3>
          {{ formatRowCount(g.rowCount) }}行 × {{ g.columnCount }}列（{{
            (g.rowCount * g.columnCount).toLocaleString()
          }}
          单元格）
        </h3>
        <div class="perf-table-scroll">
          <table class="perf-matrix">
            <thead>
              <tr>
                <th>库</th>
                <th v-for="s in SCENARIOS" :key="s.id" :title="s.desc">{{ s.label }}</th>
                <th>DOM 节点数</th>
                <th>可视行数</th>
                <th title="首个可见行里实际渲染的单元格数">可视列数</th>
                <th>内存增量</th>
                <th>实测行高</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in g.list" :key="r.subject">
                <td>{{ SUBJECT_LABELS[r.subject] }}</td>
                <template v-if="r.status === 'aborted'">
                  <td v-for="s in SCENARIOS" :key="s.id" class="no">未完成</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </template>
                <template v-else>
                  <td v-for="s in SCENARIOS" :key="s.id">
                    <span class="perf-num">{{ cell(r, s.id) }}</span>
                    <small v-if="range(r, s.id)">{{ range(r, s.id) }}</small>
                  </td>
                  <td>
                    <span class="perf-num">{{ r.domNodes.toLocaleString() }}</span>
                  </td>
                  <td>
                    <span class="perf-num">{{ r.renderedRows.toLocaleString() }}</span>
                  </td>
                  <td :class="colVirtualized(r) ? 'ok' : ''">
                    <span class="perf-num">{{ r.renderedColumns.toLocaleString() }}</span>
                    <small v-if="g.columnCount > 6">
                      {{ colVirtualized(r) ? '列已虚拟化' : `= 全部 ${g.columnCount} 列` }}
                    </small>
                  </td>
                  <td>{{ formatBytes(r.memoryBytes) }}</td>
                  <td :class="rowHeightOff(r) ? 'no' : 'ok'">
                    {{ r.rowHeight === null ? '—' : `${r.rowHeight.toFixed(1)}px` }}
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="g.columnCount > 6" class="perf-note">
          <strong>可视列数</strong>是这一档的关键判据：等于 {{ g.columnCount }}
          说明该库<strong>没有横向虚拟化</strong>，可见单元格数随列数线性增长；
          明显更小才说明列也被虚拟化了。
        </p>
        <p
          v-for="r in g.list.filter((x) => x.note)"
          :key="`n-${r.subject}`"
          class="perf-note perf-note--warn"
        >
          {{ SUBJECT_LABELS[r.subject] }}：{{ r.note }}
        </p>
        <p v-if="g.list.some(rowHeightOff)" class="perf-note perf-note--warn">
          ⚠ 有实测行高偏离契约值 {{ ROW_HEIGHT }}px 超过 1px —— 可视行数因此不同，
          这一档的对照<strong>不成立</strong>，需要先修配置再重跑。
        </p>
      </div>

      <template v-if="interactions.length">
        <h3>真实交互延迟（Event Timing）</h3>
        <p class="perf-note">
          单样本，来自一次<strong>真实点击</strong>，不是多轮中位数——口径与上表不同。
        </p>
        <div class="perf-table-scroll">
          <table class="perf-matrix">
            <thead>
              <tr>
                <th>库</th>
                <th>规模</th>
                <th>场景</th>
                <th>总延迟</th>
                <th>input / processing / presentation</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(i, idx) in interactions" :key="idx">
                <td>{{ SUBJECT_LABELS[i.subject] }}</td>
                <td>{{ i.rowCount.toLocaleString() }} × {{ i.columnCount }}</td>
                <td>{{ SCENARIOS.find((s) => s.id === i.scenario)?.label }}</td>
                <td>
                  <span class="perf-num">{{ fmt(i.sample.durationMs) }} ms</span>
                </td>
                <td>
                  {{ fmt(i.sample.inputDelayMs) }} / {{ fmt(i.sample.processingMs) }} /
                  {{ fmt(i.sample.presentationMs) }} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <p v-if="memoryNote" class="perf-note">内存读数来源：{{ memoryNote }}</p>

      <div class="perf-toolbar">
        <button type="button" class="perf-btn perf-btn--solid" @click="copy(markdown, 'Markdown')">
          复制为 Markdown
        </button>
        <button type="button" class="perf-btn" @click="copy(json, 'JSON')">导出 JSON</button>
        <button type="button" class="perf-btn" @click="showRaw = !showRaw">
          {{ showRaw ? '收起' : '查看' }}原文
        </button>
        <span v-if="copied" class="perf-copied">{{ copied }}</span>
      </div>
      <pre v-if="showRaw" class="perf-raw">{{ markdown }}</pre>
    </template>
  </section>
</template>
