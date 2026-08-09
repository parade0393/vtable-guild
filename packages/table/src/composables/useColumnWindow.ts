import { computed, type ComputedRef } from 'vue'
import { PrefixSums } from '@vtable-guild/core'
import type { ColumnType } from '../types'

/** 窗口两侧各多渲染的列数。缓冲一帧内的滚动位移，避免边缘列闪空。 */
export const DEFAULT_COLUMN_OVERSCAN = 2

export interface FixedColumnRanges {
  /** 左固定列数量。它们恒渲染、不参与窗口。 */
  leftFixedCount: number
  /** 首个右固定列的下标；无右固定列时等于列总数。 */
  rightFixedStart: number
  /**
   * 左固定列是否构成前缀、右固定列是否构成后缀。
   *
   * 不成立时窗口算法失效：窗口是一段**连续**下标区间，
   * 中间夹着的固定列会被整段跳过或重复渲染。
   */
  contiguous: boolean
}

/**
 * 解析固定列的边界。
 *
 * `useScroll.fixedOffsets` 只关心每列各自的偏移，这里关心的是**结构**：
 * 横向窗口化要求「左固定 | 可滚动 | 右固定」三段式，因此额外校验连续性。
 */
export function resolveFixedColumnRanges(
  columns: readonly ColumnType<Record<string, unknown>>[],
): FixedColumnRanges {
  const count = columns.length

  let leftFixedCount = 0
  while (leftFixedCount < count && columns[leftFixedCount].fixed === 'left') {
    leftFixedCount += 1
  }

  let rightFixedStart = count
  while (rightFixedStart > leftFixedCount && columns[rightFixedStart - 1].fixed === 'right') {
    rightFixedStart -= 1
  }

  let contiguous = true
  for (let i = leftFixedCount; i < rightFixedStart; i += 1) {
    if (columns[i].fixed === 'left' || columns[i].fixed === 'right') {
      contiguous = false
      break
    }
  }

  return { leftFixedCount, rightFixedStart, contiguous }
}

export interface ColumnWindow {
  /** 窗口首列下标（闭区间）。 */
  start: number
  /** 窗口末列下标（闭区间）。`end < start` 表示空窗口。 */
  end: number
  /** 左固定列与窗口首列之间的占位宽度。 */
  leftSpacer: number
  /** 窗口末列与右固定列之间的占位宽度。 */
  rightSpacer: number
}

export interface ComputeColumnWindowOptions {
  /** 已按列宽同步好的位置表。 */
  prefix: PrefixSums
  columnCount: number
  leftFixedCount: number
  rightFixedStart: number
  /** 当前横向滚动偏移。 */
  offsetX: number
  /** 可视区宽度（含被固定列盖住的部分）。 */
  viewportWidth: number
  overscan: number
}

/**
 * 求当前应该渲染的列区间与两侧占位宽度。
 *
 * 列 `i` 占 `[offsetOf(i), offsetOf(i + 1))`。视口显示 `[offsetX, offsetX + viewportWidth)`，
 * 但左右固定列是 `position: sticky`，**盖住**视口两端，所以可滚动内容真正露出来的区间是
 * `[offsetX + leftFixedWidth, offsetX + viewportWidth - rightFixedWidth)`。
 *
 * 与 vxe-table 的 `handleVirtualXVisible` 同式，可互为佐证。
 *
 * 不变量（见单测）：
 * `leftFixedWidth + leftSpacer + windowWidth + rightSpacer + rightFixedWidth === total`
 */
export function computeColumnWindow(options: ComputeColumnWindowOptions): ColumnWindow {
  const { prefix, columnCount, leftFixedCount, rightFixedStart, offsetX, viewportWidth, overscan } =
    options

  const lo = leftFixedCount
  const hi = rightFixedStart - 1

  // 全是固定列：没有可窗口化的部分，空窗口 + 零占位。
  if (lo > hi) {
    return { start: lo, end: lo - 1, leftSpacer: 0, rightSpacer: 0 }
  }

  const leftFixedWidth = prefix.offsetOf(leftFixedCount)
  const rightFixedWidth = prefix.total - prefix.offsetOf(rightFixedStart)

  const visibleLeft = offsetX + leftFixedWidth
  const visibleRight = offsetX + viewportWidth - rightFixedWidth

  let start = prefix.findIndex(visibleLeft) - overscan
  let end = prefix.findIndex(visibleRight)
  if (end >= columnCount) end = columnCount - 1
  end += overscan

  start = Math.min(Math.max(start, lo), hi)
  end = Math.min(Math.max(end, lo), hi)
  // 视口比固定列还窄时上面两步可能得到 end < start；补一列比空窗口更安全。
  if (end < start) end = start

  return {
    start,
    end,
    leftSpacer: prefix.offsetOf(start) - prefix.offsetOf(lo),
    rightSpacer: prefix.offsetOf(rightFixedStart) - prefix.offsetOf(end + 1),
  }
}

export interface UseColumnWindowOptions {
  /**
   * 各叶子列的实测宽度，下标即 displayColumns 下标。
   * 返回 null 表示尚未测到（首帧），调用方据此回落到渲染全部列。
   */
  widths: () => readonly number[] | null
  leftFixedCount: () => number
  rightFixedStart: () => number
  offsetX: () => number
  viewportWidth: () => number
  overscan?: () => number
}

export interface UseColumnWindowReturn {
  /** 是否真的在做列窗口化。false 时调用方必须渲染全部列。 */
  active: ComputedRef<boolean>
  start: ComputedRef<number>
  end: ComputedRef<number>
  leftSpacer: ComputedRef<number>
  rightSpacer: ComputedRef<number>
}

/**
 * 横向窗口的响应式包装。
 *
 * **输出刻意是四个独立的 primitive computed，而不是一个对象**：
 * 横向滚动每一帧都改 `offsetX`，但只有跨越列边界时这四个数才会变。
 * primitive 的脏检查会把中间帧全部吃掉，下游单元格因此不会每帧失效。
 * 理由同 `useScroll` 里把 `scrollState` 拆成两个布尔 computed。
 */
export function useColumnWindow(options: UseColumnWindowOptions): UseColumnWindowReturn {
  // 长期存活：列宽变化才重建，滚动只做二分。
  const prefix = new PrefixSums()

  const columnCount = computed(() => {
    const widths = options.widths()
    if (!widths || widths.length === 0) return null
    prefix.markAllDirty()
    prefix.sync(widths.length, (i) => widths[i], 0)
    return widths.length
  })

  const range = computed<ColumnWindow | null>(() => {
    const count = columnCount.value
    if (count === null) return null

    return computeColumnWindow({
      prefix,
      columnCount: count,
      leftFixedCount: options.leftFixedCount(),
      rightFixedStart: options.rightFixedStart(),
      offsetX: options.offsetX(),
      viewportWidth: options.viewportWidth(),
      overscan: options.overscan?.() ?? DEFAULT_COLUMN_OVERSCAN,
    })
  })

  return {
    active: computed(() => range.value !== null),
    start: computed(() => range.value?.start ?? 0),
    end: computed(() => range.value?.end ?? -1),
    leftSpacer: computed(() => range.value?.leftSpacer ?? 0),
    rightSpacer: computed(() => range.value?.rightSpacer ?? 0),
  }
}
