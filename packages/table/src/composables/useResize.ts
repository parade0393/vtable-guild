import { onBeforeUnmount, reactive, ref, type Ref } from 'vue'
import type { ColumnType } from '../types'
import { getColumnKey } from './useSorter'

export interface UseResizeReturn {
  columnWidths: Record<string, number>
  startResize: (
    column: ColumnType<Record<string, unknown>>,
    colIndex: number,
    event: PointerEvent,
  ) => void
  isResizing: Ref<boolean>
}

export function useResize(options: {
  onResizeColumn?: (column: ColumnType<Record<string, unknown>>, width: number) => void
}): UseResizeReturn {
  const columnWidths = reactive<Record<string, number>>({})
  const isResizing = ref(false)

  let activeColumn: ColumnType<Record<string, unknown>> | null = null
  let activeKey: string = ''
  let startX = 0
  let startWidth = 0

  function handlePointerMove(e: PointerEvent) {
    if (!activeColumn) return
    const deltaX = e.clientX - startX
    let newWidth = startWidth + deltaX
    const minW = activeColumn.minWidth ?? 50
    const maxW = activeColumn.maxWidth
    newWidth = Math.max(minW, newWidth)
    if (maxW !== undefined) newWidth = Math.min(maxW, newWidth)
    columnWidths[activeKey] = newWidth
  }

  function handlePointerUp(_e: PointerEvent) {
    if (!activeColumn) return
    const col = activeColumn
    const width = columnWidths[activeKey]
    cleanup()
    options.onResizeColumn?.(col, width)
  }

  function cleanup() {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    isResizing.value = false
    activeColumn = null
  }

  function startResize(
    column: ColumnType<Record<string, unknown>>,
    colIndex: number,
    event: PointerEvent,
  ) {
    event.preventDefault()
    event.stopPropagation()

    activeColumn = column
    const key = getColumnKey(column) ?? String(colIndex)
    activeKey = String(key)
    startX = event.clientX

    // Get current width: from overrides, then column.width, then measured
    const existing = columnWidths[activeKey]
    if (existing) {
      startWidth = existing
    } else {
      const w = column.width
      startWidth = typeof w === 'number' ? w : parseInt(String(w) || '100', 10)
    }

    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  onBeforeUnmount(cleanup)

  return {
    columnWidths,
    startResize,
    isResizing,
  }
}
