/**
 * 基于原生 PerformanceObserver 的采集器。不引 web-vitals——
 * 仓库的洁癖是「运行时依赖只有一个」，对照页也保持同样克制。
 */

/** 主线程阻塞情况：动作窗口内 longtask 的总时长 / 条数 / 最长一条。 */
export interface LongTaskSample {
  totalMs: number
  count: number
  longestMs: number
  /** 浏览器是否支持 longtask entry type。不支持时上面三个数没有意义。 */
  supported: boolean
}

/** 一次真实交互的 Event Timing 三段拆解，口径与 docs/performance.md 的 L3 表一致。 */
export interface InteractionSample {
  /** 总延迟：从用户输入到下一帧呈现。 */
  durationMs: number
  /** input delay：输入到事件开始处理。 */
  inputDelayMs: number
  /** processing：事件处理器执行（JS + 触发的渲染）。 */
  processingMs: number
  /** presentation：处理完成到呈现。 */
  presentationMs: number
}

function supports(type: string): boolean {
  return (
    typeof PerformanceObserver !== 'undefined' &&
    Array.isArray(PerformanceObserver.supportedEntryTypes) &&
    PerformanceObserver.supportedEntryTypes.includes(type)
  )
}

/**
 * Event Timing 条目。
 *
 * TS 的 DOM lib 里 `PerformanceEventTiming` 还没有 `interactionId`
 * （Event Timing L1 之后才加的），这里自己声明。`interactionId > 0`
 * 是「这是一次真实用户交互」的判据——合成事件拿不到它。
 */
interface EventTimingEntry extends PerformanceEntry {
  processingStart: number
  processingEnd: number
  interactionId?: number
}

/**
 * longtask 采集器。
 *
 * PerformanceObserver 的回调是在任务结束后异步派发的，所以读数前必须先
 * `await settle()` 让回调有机会跑完，否则会漏掉刚刚那个动作产生的条目。
 */
export function createLongTaskRecorder() {
  const entries: PerformanceEntry[] = []
  const supported = supports('longtask')
  let observer: PerformanceObserver | null = null
  let windowStart = 0

  if (supported) {
    observer = new PerformanceObserver((list) => {
      entries.push(...list.getEntries())
    })
    try {
      observer.observe({ type: 'longtask', buffered: false })
    } catch {
      observer = null
    }
  }

  return {
    supported: supported && observer !== null,
    /** 开一个新的采集窗口。 */
    start(): void {
      entries.length = 0
      windowStart = performance.now()
    },
    /** 关窗并汇总。调用前请先 await settle()。 */
    stop(): LongTaskSample {
      const inWindow = entries.filter((e) => e.startTime >= windowStart - 1)
      let totalMs = 0
      let longestMs = 0
      for (const e of inWindow) {
        totalMs += e.duration
        if (e.duration > longestMs) longestMs = e.duration
      }
      return {
        totalMs: round(totalMs),
        count: inWindow.length,
        longestMs: round(longestMs),
        supported: supported && observer !== null,
      }
    },
    dispose(): void {
      observer?.disconnect()
      observer = null
    },
  }
}

/**
 * Event Timing 采集器。
 *
 * 关键限制：只有**真实用户输入**产生的事件才会被分配 `interactionId`，
 * `dispatchEvent` 造的合成事件拿不到。所以这个采集器只能挂在「用户真的
 * 点了那个按钮」的路径上，不能用于程序化的多轮跑分——页面上这两块因此
 * 是分开的，口径也标注得不一样。
 */
export function createInteractionRecorder() {
  const entries: EventTimingEntry[] = []
  const supported = supports('event')
  let observer: PerformanceObserver | null = null
  let windowStart = 0
  let armed = false

  if (supported) {
    observer = new PerformanceObserver((list) => {
      if (!armed) return
      for (const entry of list.getEntries() as EventTimingEntry[]) {
        if (entry.interactionId && entry.startTime >= windowStart - 1) {
          entries.push(entry)
        }
      }
    })
    try {
      // durationThreshold 还不在 TS 的 PerformanceObserverInit 里。
      observer.observe({
        type: 'event',
        durationThreshold: 16,
        buffered: false,
      } as PerformanceObserverInit)
    } catch {
      observer = null
    }
  }

  return {
    supported: supported && observer !== null,
    /** 在真实点击的 handler 最开头调用。 */
    arm(): void {
      entries.length = 0
      windowStart = performance.now()
      armed = true
    },
    /** 取本窗口内延迟最大的那次交互。调用前请先 await settle()。 */
    read(): InteractionSample | null {
      armed = false
      if (entries.length === 0) return null
      const worst = entries.reduce((a, b) => (b.duration > a.duration ? b : a))
      const inputDelay = worst.processingStart - worst.startTime
      const processing = worst.processingEnd - worst.processingStart
      const presentation = worst.startTime + worst.duration - worst.processingEnd
      return {
        durationMs: round(worst.duration),
        inputDelayMs: round(inputDelay),
        processingMs: round(processing),
        presentationMs: round(Math.max(0, presentation)),
      }
    },
    dispose(): void {
      observer?.disconnect()
      observer = null
    },
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
