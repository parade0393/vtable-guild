import { computed, nextTick, watch, ref, type ComputedRef, type Ref } from 'vue'
import type { ColumnType, Key } from '../types'
import { getColumnKey } from './useSorter'

function getColKey(col: ColumnType<Record<string, unknown>>, index: number): Key {
  return getColumnKey(col) ?? index
}

export interface ScrollConfig {
  x?: number | string
  y?: number | string
}

export interface FixedOffset {
  left?: number
  right?: number
  isLastLeft?: boolean
  isFirstRight?: boolean
}

export interface UseScrollReturn {
  headerWrapRef: Ref<HTMLElement | null>
  bodyWrapRef: Ref<HTMLElement | null>
  scrollState: ComputedRef<{ atStart: boolean; atEnd: boolean }>
  handleBodyScroll: (e: { scrollTop: number; scrollLeft: number }) => void
  fixedOffsets: ComputedRef<Map<Key, FixedOffset>>
  updateScrollState: () => void
  syncHorizontalScroll: (scrollLeft: number, maxScrollLeft?: number) => void
}

export function useScroll(options: {
  displayColumns: () => ColumnType<Record<string, unknown>>[]
}): UseScrollReturn {
  const headerWrapRef = ref<HTMLElement | null>(null)
  const bodyWrapRef = ref<HTMLElement | null>(null)

  const scrollLeft = ref(0)
  const maxScrollLeft = ref(0)

  const scrollState = computed(() => ({
    atStart: scrollLeft.value <= 0,
    atEnd: scrollLeft.value >= maxScrollLeft.value - 1,
  }))

  function syncHorizontalScroll(nextScrollLeft: number, nextMaxScrollLeft?: number) {
    scrollLeft.value = nextScrollLeft
    if (typeof nextMaxScrollLeft === 'number') {
      maxScrollLeft.value = Math.max(0, nextMaxScrollLeft)
    }
    if (headerWrapRef.value) {
      headerWrapRef.value.scrollLeft = nextScrollLeft
    }
  }

  /**
   * Called by VScrollbar's `onScroll` event or any scroll source.
   * Syncs header container and updates internal scroll state.
   */
  function handleBodyScroll(e: { scrollTop: number; scrollLeft: number }) {
    const el = bodyWrapRef.value
    syncHorizontalScroll(e.scrollLeft, el ? el.scrollWidth - el.clientWidth : maxScrollLeft.value)
  }

  function updateScrollState() {
    const el = bodyWrapRef.value
    if (!el) return
    syncHorizontalScroll(el.scrollLeft, el.scrollWidth - el.clientWidth)
  }

  // When bodyWrapRef changes (e.g. VScrollbar mounts), refresh state
  watch(bodyWrapRef, () => {
    nextTick(updateScrollState)
  })

  // ---- Calculate fixed offsets ----
  const fixedOffsets = computed(() => {
    const columns = options.displayColumns()
    const map = new Map<Key, FixedOffset>()

    // Left fixed: accumulate from left
    let leftOffset = 0
    let lastLeftIndex = -1
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].fixed === 'left') lastLeftIndex = i
    }
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      if (col.fixed !== 'left') continue
      const key = getColKey(col, i)
      const w = typeof col.width === 'number' ? col.width : parseInt(String(col.width) || '0', 10)
      map.set(key, {
        left: leftOffset,
        isLastLeft: i === lastLeftIndex,
      })
      leftOffset += w
    }

    // Right fixed: accumulate from right
    let rightOffset = 0
    let firstRightIndex = columns.length
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].fixed === 'right') {
        firstRightIndex = i
        break
      }
    }
    for (let i = columns.length - 1; i >= 0; i--) {
      const col = columns[i]
      if (col.fixed !== 'right') continue
      const key = getColKey(col, i)
      const w = typeof col.width === 'number' ? col.width : parseInt(String(col.width) || '0', 10)
      map.set(key, {
        right: rightOffset,
        isFirstRight: i === firstRightIndex,
      })
      rightOffset += w
    }

    return map
  })

  return {
    headerWrapRef,
    bodyWrapRef,
    scrollState,
    handleBodyScroll,
    fixedOffsets,
    updateScrollState,
    syncHorizontalScroll,
  }
}
