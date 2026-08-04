import type { SubjectId } from './columns'
import { SUBJECT_LABELS, formatRowCount } from './columns'
import type { MemorySource } from './metrics/memory'
import { MEMORY_SOURCE_NOTE, formatBytes } from './metrics/memory'
import type { InteractionSample } from './metrics/observers'
import type { Stat, FrameHealth } from './metrics/runner'
import { MEASURED_RUNS, WARMUP_RUNS } from './metrics/runner'
import type { EnvInfo } from './env'
import { shortBrowser, shortOs } from './env'

export const SCENARIOS = [
  { id: 'mount', label: '首次渲染', desc: '挂载 N 行到首帧' },
  { id: 'sort', label: '排序切换', desc: '按 Score 升序，三家用同一个比较函数' },
  { id: 'scrollJump', label: '滚动到底', desc: 'scrollTop = scrollHeight，大跳转' },
  {
    id: 'scrollContinuous',
    label: '连续滚动',
    desc: '连续 30 帧、每帧 400px。墙钟受 rAF 节奏支配（≈30 帧的时长），这一行请看 longtask',
  },
] as const

export type ScenarioId = (typeof SCENARIOS)[number]['id']

export interface ScenarioStats {
  /**
   * 同步 render+patch：动作 → Vue 完成 vdom diff 与 DOM patch（不含 paint）。
   * 主指标——不受 rAF 节流影响。
   */
  sync: Stat
  /** 墙钟：动作 → 这一帧画完。窗口被节流时该值失真，仅作参考。 */
  wall: Stat
  /** 窗口内 longtask 总时长。主线程被真正阻塞多久。 */
  longTask: Stat
}

export interface RunResult {
  subject: SubjectId
  rowCount: number
  status: 'ok' | 'aborted'
  /** status 非 ok 时说明原因；ok 时也可能带备注（例如护栏提示）。 */
  note?: string
  scenarios: Partial<Record<ScenarioId, ScenarioStats>>
  domNodes: number
  /** 可视区实际渲染的行数——和实测行高一起，构成公平性契约的对外校验口。 */
  renderedRows: number
  memoryBytes: number | null
  memorySource: MemorySource
  /** 实测行高，用于校验公平性契约是否真的成立。 */
  rowHeight: number | null
  longTaskSupported: boolean
  /** 采集时窗口是否被节流——被节流则 wall 列无意义。 */
  frameHealth: FrameHealth
}

export interface InteractionResult {
  subject: SubjectId
  rowCount: number
  scenario: ScenarioId
  sample: InteractionSample
}

function fmt(n: number): string {
  return n < 10 ? n.toFixed(1) : String(Math.round(n))
}

function statCell(s: ScenarioStats | undefined, throttled: boolean): string {
  if (!s) return '—'
  const base = `${fmt(s.sync.median)} / ${fmt(s.longTask.median)}`
  return throttled ? base : `${base}（paint ${fmt(s.wall.median)}）`
}

/**
 * 导出成可直接贴进 issue / 文章 / PR 的 Markdown。
 *
 * 「任何人可自行复现」不能只是口号——别人在自己机器上跑完，得能一键把
 * 结果连同环境发回来，对照才会积累。
 */
export function toMarkdown(
  env: EnvInfo,
  results: RunResult[],
  interactions: InteractionResult[],
): string {
  const lines: string[] = []

  lines.push('## vtable-guild 性能对照结果')
  lines.push('')
  lines.push(
    `采集于 ${env.collectedAt} · ${shortBrowser(env.userAgent)} · ${shortOs(env.userAgent)} · ` +
      `${env.hardwareConcurrency ?? '?'} 逻辑核 · ${env.deviceMemoryGb ?? '?'} GB · DPR ${env.devicePixelRatio}`,
  )
  lines.push('')
  lines.push(
    `构建模式：\`${env.buildMode}\`${env.isDev ? ' ⚠ **dev 构建，数字会被放大 3–5×，不可作为基线**' : ''}`,
  )
  lines.push('')
  lines.push(
    `版本：vtable-guild \`${env.versions['vtable-guild']}\` · ` +
      `ant-design-vue \`${env.versions['ant-design-vue']}\` · ` +
      `element-plus \`${env.versions['element-plus']}\` · vue \`${env.versions.vue}\``,
  )
  lines.push('')
  lines.push(
    `方法：warmup ${WARMUP_RUNS} 轮丢弃 + 正式 ${MEASURED_RUNS} 轮取**中位数**；` +
      '单元格格式为 `同步 render+patch / longtask 总时长`（ms）。',
  )
  lines.push('')
  const throttled = results.some((r) => r.frameHealth.throttled)
  if (throttled) {
    lines.push(
      '> ⚠ 采集时窗口被浏览器节流（rAF 中位帧间隔 > 25ms），' +
        'paint 相关的墙钟数字不可用；此表给出的是**不受节流影响**的同步 render+patch 与 longtask。',
    )
    lines.push('')
  }

  const byCount = new Map<number, RunResult[]>()
  for (const r of results) {
    const list = byCount.get(r.rowCount) ?? []
    list.push(r)
    byCount.set(r.rowCount, list)
  }

  for (const [rowCount, list] of [...byCount.entries()].sort((a, b) => a[0] - b[0])) {
    lines.push(`### ${formatRowCount(rowCount)}行（${rowCount.toLocaleString()}）`)
    lines.push('')
    lines.push(
      '| 库 | ' +
        SCENARIOS.map((s) => s.label).join(' | ') +
        ' | DOM 节点数 | 可视行数 | 内存增量 |',
    )
    lines.push('| --- | ' + SCENARIOS.map(() => '---').join(' | ') + ' | --- | --- | --- |')
    for (const r of list) {
      if (r.status === 'aborted') {
        lines.push(
          `| ${SUBJECT_LABELS[r.subject]} | ` +
            SCENARIOS.map(() => '未完成').join(' | ') +
            ` | — | — | — |`,
        )
        continue
      }
      lines.push(
        `| ${SUBJECT_LABELS[r.subject]} | ` +
          SCENARIOS.map((s) => statCell(r.scenarios[s.id], r.frameHealth.throttled)).join(' | ') +
          ` | ${r.domNodes.toLocaleString()} | ${r.renderedRows.toLocaleString()} | ${formatBytes(r.memoryBytes)} |`,
      )
    }
    lines.push('')
    const notes = list.filter((r) => r.note)
    for (const r of notes) {
      lines.push(`> ${SUBJECT_LABELS[r.subject]}：${r.note}`)
    }
    if (notes.length) lines.push('')
  }

  if (interactions.length) {
    lines.push('### 真实交互延迟（Event Timing）')
    lines.push('')
    lines.push(
      '> 单样本，来自一次**真实点击**，不是多轮中位数。Event Timing 只对可信用户输入分配 ' +
        '`interactionId`，程序化触发拿不到，所以这一节与上面的批量口径不同。',
    )
    lines.push('')
    lines.push('| 库 | 行数 | 场景 | 总延迟 | input / processing / presentation |')
    lines.push('| --- | --- | --- | --- | --- |')
    for (const i of interactions) {
      const s = i.sample
      const label = SCENARIOS.find((x) => x.id === i.scenario)?.label ?? i.scenario
      lines.push(
        `| ${SUBJECT_LABELS[i.subject]} | ${i.rowCount.toLocaleString()} | ${label} | ` +
          `${fmt(s.durationMs)} ms | ${fmt(s.inputDelayMs)} / ${fmt(s.processingMs)} / ${fmt(s.presentationMs)} ms |`,
      )
    }
    lines.push('')
  }

  const memSource = results.find((r) => r.memorySource !== 'unavailable')?.memorySource
  if (memSource) {
    lines.push(`内存读数来源：\`${memSource}\` —— ${MEMORY_SOURCE_NOTE[memSource]}`)
    lines.push('')
  }
  if (results.some((r) => !r.longTaskSupported)) {
    lines.push('⚠ 当前浏览器不支持 `longtask` entry type，longtask 列无意义。')
    lines.push('')
  }

  lines.push('自行复现：https://parade0393.github.io/vtable-guild/perf/')
  lines.push('')

  return lines.join('\n')
}

export function toJson(
  env: EnvInfo,
  results: RunResult[],
  interactions: InteractionResult[],
): string {
  return JSON.stringify({ env, results, interactions }, null, 2)
}
