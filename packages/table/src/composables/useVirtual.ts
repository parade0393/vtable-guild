import { computed } from 'vue'
import type { ComputedRef } from 'vue'

export interface UseVirtualOptions {
  virtual: () => boolean | undefined
  scrollY: () => number | string | undefined
  size: () => 'small' | 'middle' | 'large' | undefined
  /** 用户显式声明的固定行高（px）。传了就进定高快路径。 */
  rowHeight?: () => number | undefined
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

export function useVirtual(options: UseVirtualOptions): UseVirtualReturn {
  const enabled = computed(() => {
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
    const y = options.scrollY()
    if (typeof y === 'number') return y
    if (typeof y === 'string') return parseInt(y, 10) || 400
    return 400
  })

  return { enabled, itemHeight, listHeight, fixedHeight }
}
