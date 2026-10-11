import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, shallowRef, watch } from 'vue'
import { devWarn } from '@vtable-guild/core'
import type { ColumnType, TableLayout } from '../types'
import { measureColumnTracks, type ColumnMetrics } from './useColumnMetrics'
import {
  allocateFixedColumnWidths,
  normalizeMinWidth,
  parseColumnWidth,
  resolveColumnWidth,
} from '../utils/columnWidth'

type Column = ColumnType<Record<string, unknown>>
const EPSILON = 0.1
const isContentWidth = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^(?:min-content|max-content|fit-content(?:\(.*\))?)$/i.test(value.trim())

export interface ColumnLayoutOptions {
  columns: () => Column[]
  columnWidths: Record<string, number>
  layout: () => TableLayout
  split: () => boolean
  root: () => HTMLElement | null
  viewport: () => HTMLElement | null
  scrollX: () => number | string | undefined
  onMeasure?: () => void
}

/** Input constraints, allocation and committed browser metrics have separate lifetimes. */
export function useColumnLayout(options: ColumnLayoutOptions) {
  const enabled = computed(() =>
    options.columns().some((c) => normalizeMinWidth(c.minWidth) !== undefined),
  )
  const viewportWidth = shallowRef(0)
  const cssWidths = shallowRef<Record<string, number>>({})
  const contentTargets = shallowRef<(number | undefined)[]>([])
  const resolveCssLength = (value: string, reference: number) =>
    cssWidths.value[`${reference}:${value}`]
  const intrinsic = shallowRef<ColumnMetrics | null>(null)
  const overflow = shallowRef(false)
  const targetWidth = computed(() =>
    Math.max(
      viewportWidth.value,
      parseColumnWidth(options.scrollX(), viewportWidth.value, resolveCssLength) ?? 0,
    ),
  )
  const allocationColumns = computed(() =>
    options
      .columns()
      .map((column, index) =>
        isContentWidth(column.width) && contentTargets.value[index] !== undefined
          ? { ...column, width: contentTargets.value[index] }
          : column,
      ),
  )
  const constraints = computed(() =>
    allocationColumns.value.map((c, i) =>
      resolveColumnWidth(c, i, {
        columnWidths: options.columnWidths,
        referenceWidth: targetWidth.value,
        resolveCssLength,
      }),
    ),
  )
  const minimums = computed(() =>
    constraints.value.map((c) => Math.max(c.effectiveMinWidth ?? 0, c.resizedWidth ?? 0)),
  )
  const minimumTotal = computed(() => minimums.value.reduce((sum, width) => sum + width, 0))
  const fixed = computed(() =>
    allocateFixedColumnWidths(allocationColumns.value, {
      containerWidth: viewportWidth.value,
      targetWidth: targetWidth.value,
      columnWidths: options.columnWidths,
      resolveCssLength,
    }),
  )
  const metrics = computed<ColumnMetrics | null>(() => {
    if (!enabled.value) return null
    if (options.layout() === 'fixed')
      return { widths: fixed.value.widths, total: fixed.value.totalWidth }
    return intrinsic.value
  })
  const synchronized = computed(
    () => enabled.value && (options.layout() === 'fixed' || options.split()),
  )

  function columnStyle(index: number, span = 1): Record<string, string> {
    if (!enabled.value) return {}
    const constraint = constraints.value[index]
    if (!constraint) return {}
    const min = minimums.value.slice(index, index + span).reduce((sum, value) => sum + value, 0)
    const pixels = synchronized.value ? metrics.value?.widths.slice(index, index + span) : undefined
    const width = pixels
      ? pixels.reduce((sum, value) => sum + value, 0)
      : span === 1
        ? constraint.targetWidth
        : undefined
    return {
      minWidth: `${min}px`,
      ...(width !== undefined ? { width: `${width}px` } : {}),
    }
  }

  const tableStyle = computed((): Record<string, string> => {
    if (!enabled.value) return {}
    if (synchronized.value && metrics.value)
      return {
        tableLayout: 'fixed',
        width: `${metrics.value.total}px`,
        minWidth: `${metrics.value.total}px`,
      }
    return { minWidth: `max(100%, ${minimumTotal.value}px)` }
  })

  let frame = 0
  let observer: ResizeObserver | undefined
  let mutations: MutationObserver | undefined
  let observedRoot: HTMLElement | null = null
  let observedViewport: HTMLElement | null = null
  let disposed = false
  const resourceEvents = ['load', 'error', 'loadedmetadata'] as const
  const resourceAttributes = ['src', 'srcset', 'sizes', 'width', 'height', 'href']

  function isProbe(node: Node) {
    const element = node instanceof Element ? node : node.parentElement
    return !!element?.closest('[inert]')
  }

  function isResource(node: EventTarget | null): node is Element {
    return (
      node instanceof Element && node.matches('img, video, iframe, object, embed, source, image')
    )
  }

  function resourceChanged(event: Event) {
    if (isResource(event.target) && !isProbe(event.target)) schedule()
  }

  function removeResourceListeners() {
    for (const event of resourceEvents)
      observedRoot?.removeEventListener(event, resourceChanged, true)
  }

  function equalWidths(a: ColumnMetrics | null, b: ColumnMetrics) {
    return (
      a?.widths.length === b.widths.length &&
      a.widths.every((w, i) => Math.abs(w - b.widths[i]) < EPSILON)
    )
  }

  /**
   * Clone rendered DOM, not Vue components: customRender/slots run only once. The
   * reference never receives measured widths, so shorter content releases old sizes.
   * Virtual rows contribute only currently mounted cells; missing columns stay empty.
   */
  function referenceTable(
    root: HTMLElement,
    host: HTMLElement,
    referenceWidth: number,
  ): HTMLTableElement | null {
    const tables = [...root.querySelectorAll<HTMLTableElement>('table[data-vtg-table]')].filter(
      (table) => !table.parentElement?.closest('table[data-vtg-table]'),
    )
    if (!tables.length) return null
    const table = tables[0].cloneNode(false) as HTMLTableElement
    table.removeAttribute('id')
    table.style.tableLayout = 'auto'
    table.style.width = `${referenceWidth}px`
    table.style.minWidth = `${minimumTotal.value}px`
    const group = document.createElement('colgroup')
    for (let i = 0; i < constraints.value.length; i++) {
      const col = document.createElement('col')
      const column = options.columns()[i]
      const constraint = constraints.value[i]
      const width = constraint.resizedWidth ?? parseColumnWidth(column.width, referenceWidth)
      if (width !== undefined)
        col.style.width = `${Math.max(width, constraint.effectiveMinWidth ?? 0)}px`
      else if (typeof column.width === 'string' && !/content/.test(column.width))
        col.style.width = column.width
      col.style.minWidth = `${minimums.value[i]}px`
      group.append(col)
    }
    table.append(group)
    const tracks = document.createElement('tbody')
    tracks.dataset.vtgWidthRow = ''
    const row = tracks.insertRow()
    minimums.value.forEach((minimum, i) => {
      const cell = row.insertCell()
      cell.dataset.vtgTrack = String(i)
      cell.style.cssText = 'padding:0;border:0;height:0;line-height:0;font-size:0'
      const inner = document.createElement('div')
      inner.style.cssText = `height:0;min-width:${minimum}px`
      cell.append(inner)
    })
    table.append(tracks)
    for (const source of tables) {
      for (const section of [...source.children]) {
        if (
          !['THEAD', 'TBODY', 'TFOOT'].includes(section.tagName) ||
          section.hasAttribute('data-vtg-width-row')
        )
          continue
        const clone = section.cloneNode(true) as HTMLElement
        const sourceImages = section.querySelectorAll<HTMLImageElement>('img')
        clone.querySelectorAll<HTMLImageElement>('img').forEach((image, index) => {
          const sourceImage = sourceImages[index]
          if (!sourceImage.naturalWidth || !sourceImage.naturalHeight || image.naturalWidth) return
          const style = getComputedStyle(sourceImage)
          // Firefox can queue a fresh image load for cloneNode, even when the
          // source is decoded. Supply natural dimensions without fixing CSS
          // width/height: percentages, attributes and aspect ratios still apply.
          if (/\b(?:size|inline-size|strict)\b/.test(style.contain)) return
          image.style.contain =
            style.contain === 'content'
              ? 'strict'
              : `${style.contain && style.contain !== 'none' ? `${style.contain} ` : ''}size`
          image.style.containIntrinsicSize = `${sourceImage.naturalWidth}px ${sourceImage.naturalHeight}px`
          if (!style.aspectRatio || /\bauto\b/.test(style.aspectRatio))
            image.style.aspectRatio = `auto ${sourceImage.naturalWidth} / ${sourceImage.naturalHeight}`
        })
        for (const cell of clone.querySelectorAll<HTMLElement>('th,td')) {
          const index = Number(cell.dataset.vtgLeafCol ?? cell.dataset.vtgCol)
          cell.style.removeProperty('width')
          cell.style.removeProperty('min-width')
          cell.style.removeProperty('max-width')
          cell.style.removeProperty('position')
          cell.style.removeProperty('left')
          cell.style.removeProperty('right')
          if (Number.isInteger(index) && constraints.value[index]) {
            const constraint = constraints.value[index]
            const column = options.columns()[index]
            const width = constraint.resizedWidth ?? parseColumnWidth(column.width, referenceWidth)
            if (width !== undefined)
              cell.style.width = `${Math.max(width, constraint.effectiveMinWidth ?? 0)}px`
            else if (typeof column.width === 'string' && !/content/.test(column.width))
              cell.style.width = column.width
            cell.style.minWidth = `${minimums.value[index]}px`
          }
        }
        // Column-window spacers cannot participate in intrinsic allocation.
        for (const tr of clone.querySelectorAll('tr[data-vtg-virtual-row]')) {
          const cells = [...tr.querySelectorAll<HTMLTableCellElement>('td[data-vtg-col]')]
          tr.replaceChildren(
            ...options
              .columns()
              .map(
                (_c, i) =>
                  cells.find((c) => Number(c.dataset.vtgCol) === i) ?? document.createElement('td'),
              ),
          )
        }
        for (const element of clone.querySelectorAll('[id]')) element.removeAttribute('id')
        table.append(clone)
      }
    }
    host.append(table)
    return table
  }

  function measure() {
    frame = 0
    if (disposed || !enabled.value) return
    const root = options.root()
    const viewport = options.viewport() ?? root
    if (!root || !viewport) return
    const width = viewport.clientWidth
    if (width <= 0) return
    let stylesChanged = Math.abs(viewportWidth.value - width) > EPSILON
    if (stylesChanged) viewportWidth.value = width
    let waitingForRender = false

    const css = new Set<string>()
    for (const raw of [options.scrollX(), ...options.columns().map((c) => c.width)]) {
      if (typeof raw === 'string' && raw !== 'auto' && parseColumnWidth(raw, width) === undefined)
        css.add(raw)
    }
    const needsReference =
      (options.layout() === 'auto' && options.split()) || [...css].some((v) => /content/.test(v))
    const host = document.createElement('div')
    host.inert = true
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;overflow:hidden;height:0;width:${width}px;contain:layout style;`
    // The host inherits the preset and font without taking space or extending scroll bounds.
    root.append(host)
    let reference: HTMLTableElement | null = null
    try {
      const nextCss: Record<string, number> = {}
      function resolve(value: string, referenceWidth: number) {
        if (!CSS.supports('width', value)) return
        host.style.width = `${referenceWidth}px`
        let resolved: number
        if (isContentWidth(value)) {
          if (!reference) return undefined
          reference.style.width = value
          resolved = reference.getBoundingClientRect().width
        } else {
          const probe = document.createElement('div')
          probe.style.width = value
          host.append(probe)
          resolved = probe.getBoundingClientRect().width
          probe.remove()
        }
        nextCss[`${referenceWidth}:${value}`] = resolved
        return resolved
      }
      const scroll = options.scrollX()
      const initialTarget = Math.max(
        width,
        isContentWidth(scroll) ? 0 : (parseColumnWidth(scroll, width, resolve) ?? 0),
      )
      if (needsReference) reference = referenceTable(root, host, initialTarget)
      const scrollTarget = parseColumnWidth(scroll, width, resolve)
      const stableTarget = Math.max(width, scrollTarget ?? 0)
      const nextContentTargets: (number | undefined)[] = options.columns().map((column) => {
        if (!isContentWidth(column.width)) {
          parseColumnWidth(column.width, stableTarget, resolve)
          return undefined
        }
        return undefined
      })
      if (reference) {
        const modes = new Set(
          options
            .columns()
            .flatMap((column) => (isContentWidth(column.width) ? [column.width] : [])),
        )
        for (const mode of modes) {
          reference.style.width = mode
          const measured = measureColumnTracks(reference, options.columns().length)
          options.columns().forEach((column, index) => {
            if (column.width === mode) nextContentTargets[index] = measured?.widths[index]
          })
        }
      }
      if (JSON.stringify(nextContentTargets) !== JSON.stringify(contentTargets.value)) {
        contentTargets.value = nextContentTargets
        stylesChanged = true
      }
      if (JSON.stringify(nextCss) !== JSON.stringify(cssWidths.value)) {
        cssWidths.value = nextCss
        stylesChanged = true
      }
      if (options.layout() === 'auto') {
        if (!options.split() && stylesChanged) {
          // Content/CSS targets change the displayed table's allocation. Read its
          // tracks only after Vue has applied those targets to the real DOM.
          waitingForRender = true
        } else {
          if (reference) reference.style.width = `${targetWidth.value}px`
          const table = options.split()
            ? reference
            : root.querySelector<HTMLTableElement>('table[data-vtg-table]')
          const next = table ? measureColumnTracks(table, options.columns().length) : null
          if (next && !equalWidths(intrinsic.value, next)) intrinsic.value = next
        }
      }
      if (!waitingForRender)
        overflow.value = Math.max(metrics.value?.total ?? 0, viewport.scrollWidth) > width + 1
    } finally {
      host.remove()
    }
    if (waitingForRender) {
      void nextTick(schedule)
      return
    }
    options.onMeasure?.()
  }

  function schedule() {
    if (disposed || frame || !enabled.value) return
    frame = requestAnimationFrame(measure)
  }
  function observe() {
    const root = enabled.value ? options.root() : null
    const viewport = enabled.value ? (options.viewport() ?? root) : null
    if (root === observedRoot && viewport === observedViewport) return
    observer?.disconnect()
    mutations?.disconnect()
    removeResourceListeners()
    observedRoot = root
    observedViewport = viewport
    if (!root) return
    observer ??= typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    observer?.observe(root)
    if (viewport && viewport !== root) observer?.observe(viewport)
    // Resource loads can change intrinsic width while every observed container
    // keeps the same box. Capture them because image load does not bubble.
    for (const event of resourceEvents) root.addEventListener(event, resourceChanged, true)
    // Observe resource attributes, while excluding our own style/geometry writes.
    mutations ??= new MutationObserver((records) => {
      if (
        records.some((record) => {
          if (isProbe(record.target)) return false
          if (record.type === 'attributes')
            return (
              isResource(record.target) && resourceAttributes.includes(record.attributeName ?? '')
            )
          const changed = [...record.addedNodes, ...record.removedNodes]
          return !changed.length || changed.some((node) => !isProbe(node))
        })
      )
        schedule()
    })
    mutations.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: resourceAttributes,
    })
  }
  watch(
    () => [
      options.columns().map((c) => [c.key, c.width, c.minWidth, c.maxWidth]),
      { ...options.columnWidths },
      options.layout(),
      options.split(),
      options.scrollX(),
    ],
    () => {
      intrinsic.value = null
      if (!enabled.value) {
        overflow.value = false
        cssWidths.value = {}
        contentTargets.value = []
      }
      observe()
      schedule()
    },
    { deep: true, flush: 'post' },
  )
  watch(
    () => options.columns().map((c) => [c.key, c.minWidth, c.maxWidth]),
    () => {
      for (const column of options.columns()) {
        const minimum = normalizeMinWidth(column.minWidth)
        if (column.minWidth !== undefined && minimum === undefined)
          devWarn(
            'vtable-invalid-min-width',
            '[VTable] minWidth must be a finite, non-negative pixel value; invalid values are ignored.',
          )
        if (minimum !== undefined && column.maxWidth !== undefined && column.maxWidth < minimum)
          devWarn(
            'vtable-conflicting-column-width',
            '[VTable] maxWidth is below minWidth; minWidth takes precedence.',
          )
      }
    },
    { immediate: true, deep: true },
  )
  onMounted(() => {
    observe()
    schedule()
  })
  onUpdated(() => {
    observe()
    schedule()
  })
  onBeforeUnmount(() => {
    disposed = true
    if (frame) cancelAnimationFrame(frame)
    observer?.disconnect()
    mutations?.disconnect()
    removeResourceListeners()
  })
  return {
    enabled,
    minimums,
    minimumTotal,
    metrics,
    synchronized,
    tableStyle,
    columnStyle,
    overflow,
    remeasure: schedule,
  }
}

export type ColumnLayout = ReturnType<typeof useColumnLayout>
