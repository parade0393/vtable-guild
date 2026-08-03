/**
 * 内存与 DOM 规模读数。
 *
 * 内存三级降级，页面上必须如实标注用的是哪一级——
 * 拿 `performance.memory` 当权威数字是不诚实的，它有量化误差、
 * 无法强制 GC、而且只有 Chrome 有。
 */

export type MemorySource =
  /** 标准 API，需要 crossOriginIsolated（COOP/COEP）。GitHub Pages 给不了这两个头。 */
  | 'measureUserAgentSpecificMemory'
  /** Chrome 独有的非标准接口，仅供相对参考。 */
  | 'performance.memory'
  | 'unavailable'

export interface MemoryReading {
  bytes: number | null
  source: MemorySource
}

interface LegacyMemory {
  usedJSHeapSize: number
}

interface MeasureMemoryResult {
  bytes: number
}

export async function readMemory(): Promise<MemoryReading> {
  const perf = performance as Performance & {
    measureUserAgentSpecificMemory?: () => Promise<MeasureMemoryResult>
    memory?: LegacyMemory
  }

  if (typeof perf.measureUserAgentSpecificMemory === 'function') {
    try {
      const result = await perf.measureUserAgentSpecificMemory()
      return { bytes: result.bytes, source: 'measureUserAgentSpecificMemory' }
    } catch {
      // 未跨源隔离时会直接抛，落到下一级。
    }
  }

  if (perf.memory && typeof perf.memory.usedJSHeapSize === 'number') {
    return { bytes: perf.memory.usedJSHeapSize, source: 'performance.memory' }
  }

  return { bytes: null, source: 'unavailable' }
}

export const MEMORY_SOURCE_NOTE: Record<MemorySource, string> = {
  measureUserAgentSpecificMemory: '标准 API（已跨源隔离），含 DOM 与 JS 堆',
  'performance.memory': 'Chrome 非标准接口，有量化误差且无法强制 GC —— 仅供相对参考',
  unavailable: '当前浏览器不提供内存读数',
}

/**
 * DOM 节点数。
 *
 * 这是整套指标里唯一**零噪声、跨浏览器一致、无辩驳空间**的数字：
 * 虚拟滚动到底有没有生效，看这一个数就够了。所以它在结果表里是
 * 第一等公民，不是内存的附属。
 */
export function countDomNodes(host: Element | null): number {
  if (!host) return 0
  return host.querySelectorAll('*').length
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(1)} MB`
}
