/**
 * 跑分调度：warmup、多轮、统计聚合，以及"等到这一帧真的画完"的原语。
 */

import { nextTick } from 'vue'

/** 丢弃的预热轮数：第一轮会含 JIT 预热与样式首次计算，不具代表性。 */
export const WARMUP_RUNS = 1
/** 正式轮数，报中位数。 */
export const MEASURED_RUNS = 5

/**
 * 等到浏览器画完这一帧。
 *
 * 双 rAF：第一个 rAF 在下一帧渲染**前**触发，第二个才说明上一帧已经提交。
 * 口径与 playground/src/pages/PerfPage.vue 的 afterPaint() 保持一致。
 */
export function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

/**
 * 让主线程喘口气：PerformanceObserver 的回调是任务结束后异步派发的，
 * 读 longtask / event 之前必须先 settle，否则会漏掉刚产生的条目。
 */
export async function settle(frames = 2): Promise<void> {
  for (let i = 0; i < frames; i++) await afterPaint()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

/** 触发变更 → 等 Vue 更新 → 等这一帧画完，返回墙钟耗时。 */
export async function timeToPaint(mutate: () => void): Promise<number> {
  const t0 = performance.now()
  mutate()
  await nextTick()
  await afterPaint()
  return performance.now() - t0
}

/**
 * 触发变更 → 等 Vue 把 vdom diff 和 DOM patch 做完（微任务），**不等 paint**。
 *
 * 这是主指标。理由：`requestAnimationFrame` 在窗口不可见/被遮挡时会被浏览器
 * 节流到约 1 次/秒，任何基于双 rAF 的墙钟都会退化成「2 秒」这种与库无关的常数。
 * 同步 render+patch 不受节流影响，而且它测的正是库自己控制的那部分工作。
 * 口径与 docs/performance.md 里 P0 优化用的度量方式一致。
 */
export async function timeToFlush(mutate: () => void): Promise<number> {
  const t0 = performance.now()
  mutate()
  await nextTick()
  return performance.now() - t0
}

export interface FrameHealth {
  /** 相邻帧间隔中位数。正常 60Hz 下约 16.7ms。 */
  medianFrameMs: number
  /** 超过 25ms 就认为窗口被节流（不可见 / 被遮挡 / 后台标签页）。 */
  throttled: boolean
}

/**
 * 探测 rAF 是否被节流。
 *
 * 公开页面必须自检这一项：把对照页丢在后台标签页里跑，所有 paint 相关的数字
 * 都会变成噪声，而使用者不会察觉。
 */
export async function probeFrameRate(samples = 8): Promise<FrameHealth> {
  const times: number[] = []
  let last = performance.now()
  for (let i = 0; i < samples; i++) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    const now = performance.now()
    times.push(now - last)
    last = now
  }
  const s = stat(times)
  return { medianFrameMs: s.median, throttled: s.median > 25 }
}

export interface Stat {
  median: number
  min: number
  max: number
  samples: number[]
}

export function stat(samples: number[]): Stat {
  if (samples.length === 0) return { median: 0, min: 0, max: 0, samples: [] }
  const sorted = samples.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const hi = sorted[mid] as number
  const lo = sorted[mid - 1] as number
  const median = sorted.length % 2 === 0 ? (lo + hi) / 2 : hi
  return {
    median: round(median),
    min: round(sorted[0] as number),
    max: round(sorted[sorted.length - 1] as number),
    samples: samples.map(round),
  }
}

export function round(n: number): number {
  return Math.round(n * 10) / 10
}

export function formatMs(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `${n.toFixed(n < 10 ? 1 : 0)} ms`
}
