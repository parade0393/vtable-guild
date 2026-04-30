import { onScopeDispose, ref, type Ref } from 'vue'

export interface HoverState {
  hoverRange: Ref<readonly [number, number] | null>
  setHoverRange: (startRow: number, endRow: number) => void
  clearHoverRange: () => void
}

export function useHoverState(debounceMs = 100): HoverState {
  const hoverRange = ref<readonly [number, number] | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush(value: readonly [number, number] | null) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      hoverRange.value = value
      timer = null
    }, debounceMs)
  }

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    hoverRange,
    setHoverRange: (start, end) => flush([start, end] as const),
    clearHoverRange: () => flush(null),
  }
}

export function isInHoverRange(
  cellStartRow: number,
  cellRowSpan: number,
  range: readonly [number, number] | null,
): boolean {
  if (!range) return false
  const [startRow, endRow] = range
  const cellEndRow = cellStartRow + Math.max(1, cellRowSpan) - 1
  return cellStartRow <= endRow && cellEndRow >= startRow
}
