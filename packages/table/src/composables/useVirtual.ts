import { computed } from 'vue'
import type { ComputedRef } from 'vue'

export interface UseVirtualOptions {
  virtual: () => boolean | undefined
  scrollY: () => number | string | undefined
  size: () => 'sm' | 'md' | 'lg' | undefined
}

export interface UseVirtualReturn {
  /** Whether virtual scrolling is actually enabled */
  enabled: ComputedRef<boolean>
  /** Estimated item height based on table size preset */
  itemHeight: ComputedRef<number>
  /** Numeric scroll height for VirtualList */
  listHeight: ComputedRef<number>
}

/** Row height estimates per table size */
const SIZE_ITEM_HEIGHT: Record<string, number> = {
  sm: 39,
  md: 47,
  lg: 55,
}

export function useVirtual(options: UseVirtualOptions): UseVirtualReturn {
  const enabled = computed(() => {
    return !!options.virtual() && !!options.scrollY()
  })

  const itemHeight = computed(() => {
    const s = options.size() ?? 'md'
    return SIZE_ITEM_HEIGHT[s] ?? 47
  })

  const listHeight = computed(() => {
    const y = options.scrollY()
    if (typeof y === 'number') return y
    if (typeof y === 'string') return parseInt(y, 10) || 400
    return 400
  })

  return { enabled, itemHeight, listHeight }
}
