import { shallowRef, watch, type CSSProperties, type Ref } from 'vue'
import type { TableQueryProps } from '../types/query-form'

const GRID_SIZE = 24
const INITIAL_WIDTH = 1024

const spanBreakpoints = [513, 785, 992, 1057, Infinity]
const defaultBreakpoints = [513, 701, 1352, Infinity]
const verticalBreakpoints = [513, 785, 1057, Infinity]

interface QueryFilterLayoutOptions {
  width: number
  layout?: TableQueryProps['layout']
  span?: TableQueryProps['span']
  defaultColsNumber?: number
  defaultFormItemsNumber?: number
  collapsed: boolean
  showActions?: boolean
  submitterColSpanProps?: TableQueryProps['submitterColSpanProps']
}

function validNumber(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback
}

function toSpan(value: number) {
  return Math.max(1, Math.min(GRID_SIZE, Math.round(value)))
}

function getBreakpointSpan(
  width: number,
  spans: Exclude<TableQueryProps['span'], number | undefined>,
) {
  const index = spanBreakpoints.findIndex((breakpoint) => width < breakpoint)
  // The published QueryFilter uses the 513px boundary for both xs and sm.
  const sizes = [spans.xs ?? spans.sm, spans.md, spans.lg, spans.xl, spans.xxl]
  for (let current = index; current >= 0; current--) {
    if (sizes[current] !== undefined) return sizes[current]
  }
}

function getGrid(width: number, layout: TableQueryProps['layout'], span: TableQueryProps['span']) {
  const breakpoints = layout === 'vertical' ? verticalBreakpoints : defaultBreakpoints
  const columns = breakpoints.findIndex((breakpoint) => width < breakpoint) + 1
  const configured = typeof span === 'object' ? getBreakpointSpan(width, span) : span
  return {
    layout: layout ?? (configured || width >= 701 ? 'horizontal' : 'vertical'),
    span: toSpan(validNumber(configured, GRID_SIZE / columns)),
  }
}

/** Position query controls and submitter on the same 24-column grid. */
export function getQueryFilterLayout<T extends { colSize?: number }>(
  fields: readonly T[],
  options: QueryFilterLayoutOptions,
) {
  const { layout, span } = getGrid(options.width, options.layout, options.span)
  const reserved = options.showActions === false ? 0 : 1
  const oneRow = GRID_SIZE / span - reserved
  const capacity =
    options.defaultFormItemsNumber ??
    (options.defaultColsNumber === undefined
      ? Math.max(1, oneRow)
      : Math.min(options.defaultColsNumber, oneRow))

  const items = fields.map((field) => {
    const size = validNumber(field.colSize, 1)
    return { field, size, span: toSpan(span * size) }
  })
  const firstRowFull = items[0]?.span === GRID_SIZE
  let totalSize = 0
  let collapsedCount = 0
  for (const { size } of items) {
    totalSize += size
    // A full-width first control occupies the whole collapsed row.
    if (collapsedCount > 0 && (firstRowFull || totalSize > capacity)) break
    collapsedCount++
  }

  let row = 1
  let used = 0
  const visible = options.collapsed ? items.slice(0, collapsedCount) : items
  const cells = visible.map(({ field, span: cellSpan }, index) => {
    if (used + cellSpan > GRID_SIZE) {
      row++
      used = 0
    }
    const style: CSSProperties = { gridColumn: `${used + 1} / span ${cellSpan}`, gridRow: row }
    used += cellSpan
    return { field, style, endsRow: used === GRID_SIZE && index < visible.length - 1 }
  })

  const actionSpan = toSpan(validNumber(options.submitterColSpanProps?.span, span))
  const explicitOffset = options.submitterColSpanProps?.offset
  let actionStart = GRID_SIZE - actionSpan
  if (explicitOffset === undefined || !Number.isFinite(explicitOffset)) {
    if (used > actionStart) row++
  } else {
    const offset = Math.max(0, Math.min(actionStart, Math.round(explicitOffset)))
    if (used + offset + actionSpan > GRID_SIZE) {
      row++
      used = 0
    }
    actionStart = used + offset
  }

  return {
    layout,
    fields: cells,
    actionStyle: {
      gridColumn: `${actionStart + 1} / span ${actionSpan}`,
      gridRow: row,
    } as CSSProperties,
    canCollapse: collapsedCount < fields.length,
    hiddenCount: options.collapsed ? fields.length - collapsedCount : 0,
  }
}

export function useQueryFilterWidth(root: Ref<HTMLElement | null>) {
  const width = shallowRef(INITIAL_WIDTH)
  watch(
    root,
    (element, _, onCleanup) => {
      if (!element) return
      const measure = () => {
        if (element.offsetWidth > 0) width.value = element.offsetWidth
      }
      measure()
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      onCleanup(() => observer.disconnect())
    },
    { flush: 'post' },
  )
  return width
}
