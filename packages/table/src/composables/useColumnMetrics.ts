import { onBeforeUnmount, onMounted, shallowRef, watch, type ShallowRef } from 'vue'
import type { ColumnType, Key } from '../types'
import { getColumnKey } from './useSorter'

export interface ColumnMetrics {
  /** 各叶子列的实测宽度（px），下标即 displayColumns 下标。 */
  widths: number[]
  /** 列总宽。 */
  total: number
}

export interface UseColumnMetricsOptions {
  /** 关闭时不测量、不注册 observer，`metrics` 恒为 null。 */
  enabled: () => boolean
  /** 表头外层容器（useScroll 的 headerWrapRef）。 */
  headerEl: () => HTMLElement | null
  columns: () => ColumnType<Record<string, unknown>>[]
  /** 拖拽列宽覆写。变了就得重测。 */
  columnWidths: Record<string, number>
  /** 是否渲染了表头。false 时没有参照可量，只能退回读声明宽度。 */
  hasHeader: () => boolean
}

export interface UseColumnMetricsReturn {
  /** null 表示还没测到；调用方据此回落到渲染全部列。 */
  metrics: ShallowRef<ColumnMetrics | null>
  /** 手动触发一次重测（下一帧执行）。 */
  remeasure: () => void
}

/** 1px 以内的差异不算变化——避免亚像素抖动把整表反复推倒重来。 */
const WIDTH_EPSILON = 0.5

function sameMetrics(a: ColumnMetrics | null, b: ColumnMetrics | null): boolean {
  if (a === null || b === null) return a === b
  if (a.widths.length !== b.widths.length) return false
  for (let i = 0; i < a.widths.length; i += 1) {
    if (Math.abs(a.widths[i] - b.widths[i]) > WIDTH_EPSILON) return false
  }
  return true
}

function columnKeyAt(column: ColumnType<Record<string, unknown>>, index: number): Key {
  return getColumnKey(column) ?? index
}

/**
 * `showHeader: false` 的兜底：没有表头可量，只能吃列上声明的数字宽度。
 *
 * 有一列不是数字就整体放弃（返回 null）——按错误宽度定位会让表体与横向滚动
 * 条错位，比不虚拟化列糟得多。
 */
function metricsFromDeclaredWidths(
  columns: ColumnType<Record<string, unknown>>[],
  columnWidths: Record<string, number>,
): ColumnMetrics | null {
  const widths: number[] = []
  let total = 0

  for (let i = 0; i < columns.length; i += 1) {
    const raw = columnWidths[String(columnKeyAt(columns[i], i))] ?? columns[i].width
    const width = typeof raw === 'number' ? raw : Number.NaN
    if (!Number.isFinite(width) || width <= 0) return null
    widths.push(width)
    total += width
  }

  return total > 0 ? { widths, total } : null
}

/**
 * 实测每个叶子列的宽度，作为横向虚拟化的定位参照。
 *
 * **为什么量表头而不是要求用户声明数字列宽**：表头始终渲染全部 N 列，
 * 它本身就是浏览器算好的精确列宽结果，直接读即可，不必复刻一套
 * `width / minWidth / auto / 百分比 → renderWidth` 的解析（vxe-table 必须自己算，
 * 是因为它表头表体都窗口化，没有一份完整布局可参照）。因此我们天然支持
 * `auto`、百分比，以及 `table-layout: fixed` 下浏览器对余量的分配。
 *
 * **不会震荡**：表头布局不依赖表体，所以「量表头 → 改表体」不构成反馈环。
 * 这是整个方案能成立的关键。
 */
export function useColumnMetrics(options: UseColumnMetricsOptions): UseColumnMetricsReturn {
  const metrics = shallowRef<ColumnMetrics | null>(null)

  let rafId = 0
  let resizeObserver: ResizeObserver | null = null
  let observed: HTMLElement | null = null

  function measure(): ColumnMetrics | null {
    const columns = options.columns()
    const count = columns.length
    if (count === 0) return null

    if (!options.hasHeader()) {
      return metricsFromDeclaredWidths(columns, options.columnWidths)
    }

    const wrap = options.headerEl()
    if (!wrap) return null

    const cells = wrap.querySelectorAll<HTMLElement>('th[data-vtg-leaf-col]')
    if (cells.length !== count) return null

    const widths = new Array<number>(count).fill(-1)
    for (const cell of cells) {
      const index = Number(cell.dataset.vtgLeafCol)
      if (!Number.isInteger(index) || index < 0 || index >= count) return null
      // 用 getBoundingClientRect 而非 offsetWidth：保留小数，避免 200 列各舍入 0.5px
      // 累积成几十像素的错位。sticky 定位不影响宽度，固定列一样可以这么量。
      widths[index] = cell.getBoundingClientRect().width
    }

    let total = 0
    for (const width of widths) {
      // 有列没量到（重复下标 / 渲染尚未稳定）就整体放弃，宁可这一帧不虚拟化。
      if (width < 0) return null
      total += width
    }

    return total > 0 ? { widths, total } : null
  }

  function flush() {
    rafId = 0
    if (!options.enabled()) {
      metrics.value = null
      return
    }
    const next = measure()
    if (!sameMetrics(metrics.value, next)) {
      metrics.value = next
    }
  }

  /**
   * 合并到下一帧执行。
   *
   * 拖拽列宽时 `columnWidths` 每次 pointermove 都变，逐次去读 N 个 `<th>` 的
   * rect 会把强制布局搬到交互路径上；ResizeObserver 也可能连发。
   */
  function schedule() {
    if (typeof requestAnimationFrame === 'undefined') {
      flush()
      return
    }
    if (rafId) return
    rafId = requestAnimationFrame(flush)
  }

  function syncObserver() {
    const target = options.enabled() && options.hasHeader() ? options.headerEl() : null
    if (target === observed) return

    if (resizeObserver && observed) resizeObserver.unobserve(observed)
    observed = target

    if (target) {
      if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
        // 容器变宽/变窄会改变 auto 与百分比列的实际宽度，必须重测。
        resizeObserver = new ResizeObserver(schedule)
      }
      resizeObserver?.observe(target)
    }
  }

  watch(
    [
      () => options.enabled(),
      () => options.hasHeader(),
      () => options.headerEl(),
      () => options.columns(),
      () => ({ ...options.columnWidths }),
    ],
    () => {
      syncObserver()
      schedule()
    },
    { deep: false },
  )

  onMounted(() => {
    syncObserver()
    schedule()
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    resizeObserver = null
    observed = null
  })

  return { metrics, remeasure: schedule }
}
