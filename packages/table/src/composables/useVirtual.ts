import { computed } from 'vue'
import type { ComputedRef } from 'vue'

export interface UseVirtualOptions {
  virtual: () => boolean | undefined
  scrollY: () => number | string | undefined
  size: () => 'small' | 'middle' | 'large' | undefined
  /** 用户显式声明的固定行高（px）。传了就进定高快路径。 */
  rowHeight?: () => number | undefined
  /** scroll.y 为 'auto' 时由 useAutoHeight 提供的实测表体高度（已钳制 ≥1）。 */
  measuredHeight?: () => number | undefined
}

export interface UseVirtualReturn {
  /** Whether virtual scrolling is actually enabled */
  enabled: ComputedRef<boolean>
  /** Estimated item height based on table size preset */
  itemHeight: ComputedRef<number>
  /** Numeric scroll height for VirtualList */
  listHeight: ComputedRef<number>
  /**
   * 是否走定高快路径。
   *
   * 只在用户**显式**传了合法 `rowHeight` 时为 true——刻意不做自动探测：
   * 从 size 预设猜行高在 `ellipsis: false` + 长文本换行时会静默算错，
   * 而错误表现为行错位/空隙，用户很难归因。宁可让用户主动声明。
   */
  fixedHeight: ComputedRef<boolean>
  /** scroll.y 分类结果，供 Table 统一驱动告警与非虚拟路径的高度取舍。 */
  resolvedScrollY: ComputedRef<ResolvedScrollY>
}

/** Row height estimates per table size */
const SIZE_ITEM_HEIGHT: Record<string, number> = {
  small: 39,
  middle: 47,
  large: 55,
}

/**
 * `size` 没传时的兜底，必须与主题的 `defaultVariants.size` 保持一致。
 *
 * 曾经写成 `'middle'`：而 `size` prop 默认是 `undefined`，主题按 `'large'` 渲染，
 * 于是**任何不显式传 size 的表格**都会按 47px 估算实际约 55px 的行。
 * 10 万行就是 80 万 px 的滚动范围缺口，末尾上万行一度滚不到。
 */
const DEFAULT_SIZE = 'large'

/**
 * scroll.y 的高度语义——全库唯一的分类判定点。
 *
 * - `missing`：未传 / null / 空串。虚拟化不启用，也不告警。
 * - `fixed-number`：有限正数，固定数字视口。
 * - `auto`：自动适应父容器高度，由 useAutoHeight 实测驱动。
 * - `compat-px`：trim 后的正数十进制 px 字符串（如 `'480px'`），兼容解析并告警。
 * - `invalid-string`：其余字符串（`'100%'`、`'50vh'`、`calc(...)`、`'480foo'`、裸 `'480'`）。
 * - `invalid-number`：0 / 负数 / NaN / Infinity。
 */
export type ScrollYKind =
  | 'missing'
  | 'fixed-number'
  | 'auto'
  | 'compat-px'
  | 'invalid-string'
  | 'invalid-number'

export interface ResolvedScrollY {
  kind: ScrollYKind
  /** fixed-number / compat-px 的数值；其余分类为 undefined。 */
  value?: number
}

/** 只认「整数或小数 + px」后缀，杜绝 parseInt 把 `'100%'` 猜成 100 这类静默错误。 */
const PX_PATTERN = /^\d+(\.\d+)?px$/

export function resolveScrollY(scrollY: number | string | undefined | null): ResolvedScrollY {
  if (scrollY == null) return { kind: 'missing' }
  if (typeof scrollY === 'number') {
    return Number.isFinite(scrollY) && scrollY > 0
      ? { kind: 'fixed-number', value: scrollY }
      : { kind: 'invalid-number' }
  }
  const raw = scrollY.trim()
  if (raw === '') return { kind: 'missing' }
  if (raw === 'auto') return { kind: 'auto' }
  if (PX_PATTERN.test(raw)) {
    const value = Number.parseFloat(raw)
    return value > 0 ? { kind: 'compat-px', value } : { kind: 'invalid-string' }
  }
  return { kind: 'invalid-string' }
}

/**
 * 实测高度暂不可用（隐藏容器量到 0、尚未挂载）时的最小虚拟视口。
 *
 * core `VirtualList` 用 `height && itemHeight` 判定是否窗口化，0 会被当成
 * falsy 静默关闭虚拟、全量渲染行；所以即使量到 0 也必须钳到 1px 保住虚拟路径。
 */
export const MIN_VIRTUAL_VIEWPORT = 1

/**
 * scroll.y 无法可靠解析时的虚拟视口兜底。
 *
 * 刻意**不**回落到全量渲染的普通表体：误配发生在万行宽表上时，普通表体是
 * 秒级冻结；保持虚拟 + 固定视口是「可用但偏短」的良性降级，dev 有告警引导修复。
 */
export const INVALID_SCROLL_Y_FALLBACK = 400

export function useVirtual(options: UseVirtualOptions): UseVirtualReturn {
  const resolved = computed(() => resolveScrollY(options.scrollY()))

  const enabled = computed(() => {
    // 与双表模式的 `!!scroll.y` 门控保持一致：0 / NaN 等 falsy 值不启用虚拟，
    // 其余任何 truthy 值都启用——无效值由 listHeight 回落 400，而不是关闭虚拟。
    return !!options.virtual() && !!options.scrollY()
  })

  const fixedHeight = computed(() => {
    const h = options.rowHeight?.()
    return typeof h === 'number' && Number.isFinite(h) && h > 0
  })

  const itemHeight = computed(() => {
    if (fixedHeight.value) return options.rowHeight!() as number
    const s = options.size() ?? DEFAULT_SIZE
    return SIZE_ITEM_HEIGHT[s] ?? SIZE_ITEM_HEIGHT[DEFAULT_SIZE]
  })

  const listHeight = computed(() => {
    const { kind, value } = resolved.value
    if (kind === 'fixed-number' || kind === 'compat-px') return value as number
    if (kind === 'auto') {
      // useAutoHeight 已钳到 ≥1，这里只兜 ref 异常等「尚未测得」的边缘。
      const measured = options.measuredHeight?.()
      return measured === undefined ? MIN_VIRTUAL_VIEWPORT : measured
    }
    return INVALID_SCROLL_Y_FALLBACK
  })

  return {
    enabled,
    itemHeight,
    listHeight,
    fixedHeight,
    resolvedScrollY: resolved,
  }
}
