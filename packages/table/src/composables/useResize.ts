import { onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue'
import type { ColumnType } from '../types'
import { normalizeMinWidth, parseColumnWidth } from '../utils/columnWidth'
import { getColumnKey } from './useColumns'

export interface UseResizeReturn {
  columnWidths: Record<string, number>
  startResize: (
    column: ColumnType<Record<string, unknown>>,
    colIndex: number,
    event: PointerEvent,
  ) => void
  isResizing: Ref<boolean>
}

function getMeasuredHeaderWidth(event: PointerEvent): number | undefined {
  const target = event.currentTarget
  if (!(target instanceof Element)) return undefined

  const width = target.closest('th')?.getBoundingClientRect().width
  return width !== undefined && Number.isFinite(width) && width > 0 ? width : undefined
}

export function useResize(options: {
  columns?: () => readonly ColumnType<Record<string, unknown>>[]
  onResizeColumn?: (column: ColumnType<Record<string, unknown>>, width: number) => void
}): UseResizeReturn {
  const columnWidths = reactive<Record<string, number>>({})
  const isResizing = ref(false)

  let activeColumn: ColumnType<Record<string, unknown>> | null = null
  let activeKey: string = ''
  let startX = 0
  let startWidth = 0
  let hasMoved = false
  let previousCursor = ''
  let previousUserSelect = ''
  // Preserve the accepted drag target when a later configuration temporarily raises its floor.
  const dragTargets: Record<string, number> = {}

  function clampDragWidth(column: ColumnType<Record<string, unknown>>, width: number) {
    const minimum = normalizeMinWidth(column.minWidth) ?? 50
    const maximum = normalizeMinWidth(column.maxWidth)
    return Math.max(minimum, maximum === undefined ? width : Math.min(maximum, width))
  }

  function getCurrentColumn() {
    if (!activeColumn || !options.columns) return activeColumn
    const current = options
      .columns()
      .find((column, index) => String(getColumnKey(column) ?? index) === activeKey)
    if (!current?.resizable) {
      cleanup()
      return null
    }
    activeColumn = current
    return current
  }

  function handlePointerMove(e: PointerEvent) {
    const column = getCurrentColumn()
    if (!column) return
    const deltaX = e.clientX - startX
    if (!Number.isFinite(deltaX) || (!hasMoved && deltaX === 0)) return
    const newWidth = clampDragWidth(column, startWidth + deltaX)
    hasMoved = true
    dragTargets[activeKey] = newWidth
    columnWidths[activeKey] = newWidth
  }

  function handlePointerUp(_e: PointerEvent) {
    const col = getCurrentColumn()
    if (!col) return
    const width = columnWidths[activeKey]
    const shouldEmit = hasMoved && normalizeMinWidth(width) !== undefined
    // Dynamic constraints may have changed the accepted width since the last pointermove.
    if (shouldEmit) dragTargets[activeKey] = width
    cleanup()
    if (shouldEmit) options.onResizeColumn?.(col, width)
  }

  function cleanup() {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.removeEventListener('pointercancel', cleanup)
    if (isResizing.value) {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }
    isResizing.value = false
    activeColumn = null
    hasMoved = false
  }

  function startResize(
    column: ColumnType<Record<string, unknown>>,
    colIndex: number,
    event: PointerEvent,
  ) {
    if (!column.resizable) return
    if (isResizing.value) cleanup()
    event.preventDefault()
    event.stopPropagation()

    activeColumn = column
    const key = getColumnKey(column) ?? String(colIndex)
    activeKey = String(key)
    startX = event.clientX

    // Layout can expand even definite widths, so the rendered track is always the best origin.
    startWidth =
      getMeasuredHeaderWidth(event) ??
      normalizeMinWidth(columnWidths[activeKey]) ??
      parseColumnWidth(column.width) ??
      Math.max(normalizeMinWidth(column.minWidth) ?? 50, 100)
    hasMoved = false

    previousCursor = document.body.style.cursor
    previousUserSelect = document.body.style.userSelect
    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', cleanup)
  }

  if (options.columns) {
    watch(
      () =>
        options.columns!().map((column, index) => ({
          column,
          key: String(getColumnKey(column) ?? index),
          minWidth: normalizeMinWidth(column.minWidth),
          maxWidth: normalizeMinWidth(column.maxWidth),
          resizable: column.resizable,
        })),
      (columns) => {
        const keys = new Set(columns.map((column) => column.key))
        for (const key of Object.keys(columnWidths)) {
          if (!keys.has(key)) {
            delete columnWidths[key]
            delete dragTargets[key]
          }
        }
        for (const { key, minWidth } of columns) {
          const target = dragTargets[key] ?? normalizeMinWidth(columnWidths[key])
          if (target !== undefined) columnWidths[key] = Math.max(target, minWidth ?? 0)
        }
        if (activeColumn) {
          const column = getCurrentColumn()
          if (column && hasMoved) {
            columnWidths[activeKey] = clampDragWidth(column, columnWidths[activeKey])
          }
        }
      },
      { flush: 'sync' },
    )
  }

  onBeforeUnmount(cleanup)

  return {
    columnWidths,
    startResize,
    isResizing,
  }
}
