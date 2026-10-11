import type { ColumnType } from '../types'
import { getColumnKey } from '../composables/useColumns'

type LayoutColumn = ColumnType<Record<string, unknown>>

/** Browser adapters resolve CSS lengths against an explicit, stable reference width. */
export type CssLengthResolver = (value: string, referenceWidth: number) => number | undefined

export interface ColumnWidthOptions {
  columnWidths?: Readonly<Record<string, number>>
  referenceWidth?: number
  resolveCssLength?: CssLengthResolver
}

export interface ResolvedColumnWidth {
  key: string
  /** Undefined means no explicit layout lower bound; zero is a valid bound. */
  effectiveMinWidth: number | undefined
  /** A resolved declaration or drag target, already clamped to the lower bound. */
  targetWidth: number | undefined
  resizedWidth: number | undefined
}

export interface FixedColumnWidthOptions extends ColumnWidthOptions {
  containerWidth: number
  targetWidth?: number
}

export interface FixedColumnWidthLayout {
  columns: (ResolvedColumnWidth & { width: number })[]
  widths: number[]
  /** Drag targets for the current visible columns, clamped to current constraints. */
  columnWidths: Record<string, number>
  totalWidth: number
  /** The sum of explicit column lower bounds. */
  minWidth: number
  /** The width required to retain both targets and flexible-column lower bounds. */
  requiredWidth: number
  overflow: boolean
}

/** Invalid lower bounds are absent. Callers can warn separately without side effects here. */
export function normalizeMinWidth(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

const CSS_NUMBER = String.raw`[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?`
const PX_WIDTH = new RegExp(`^(${CSS_NUMBER})px$`, 'i')
const PERCENT_WIDTH = new RegExp(`^(${CSS_NUMBER})%$`, 'i')

/**
 * Resolves definite widths without confusing an unmeasurable value with legal 0px.
 * Percentages use the supplied reference once; content widths and other CSS lengths
 * are delegated to the browser adapter. `auto` always retains flexible semantics.
 */
export function parseColumnWidth(
  value: unknown,
  referenceWidth?: number,
  resolveCssLength?: CssLengthResolver,
): number | undefined {
  if (typeof value === 'number') return normalizeMinWidth(value)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'auto') return undefined
  // Unitless zero is a legal CSS length; other unitless strings are not pixels.
  if (trimmed === '0') return 0
  const pixels = PX_WIDTH.exec(trimmed)
  if (pixels) return normalizeMinWidth(Number(pixels[1]))
  const reference = normalizeMinWidth(referenceWidth)
  if (reference === undefined) return undefined
  const percent = PERCENT_WIDTH.exec(trimmed)
  if (percent) return normalizeMinWidth((Number(percent[1]) / 100) * reference)
  return resolveCssLength ? normalizeMinWidth(resolveCssLength(trimmed, reference)) : undefined
}

export function resolveColumnWidth(
  column: LayoutColumn,
  index: number,
  options: ColumnWidthOptions = {},
): ResolvedColumnWidth {
  const key = String(getColumnKey(column) ?? index)
  const effectiveMinWidth = normalizeMinWidth(column.minWidth)
  const minimum = effectiveMinWidth ?? 0
  const resized = normalizeMinWidth(options.columnWidths?.[key])
  const resizedWidth = resized === undefined ? undefined : Math.max(resized, minimum)
  const target =
    resizedWidth ?? parseColumnWidth(column.width, options.referenceWidth, options.resolveCssLength)
  return {
    key,
    effectiveMinWidth,
    targetWidth: target === undefined ? undefined : Math.max(target, minimum),
    resizedWidth,
  }
}

/**
 * Pure fixed-layout allocation. Targets retain their widths first; remaining columns
 * share the available space evenly, freezing any column whose lower bound is higher.
 * All arithmetic keeps subpixels and the final participating column absorbs tail error.
 */
export function allocateFixedColumnWidths(
  columns: readonly LayoutColumn[],
  options: FixedColumnWidthOptions,
): FixedColumnWidthLayout {
  const containerWidth = normalizeMinWidth(options.containerWidth) ?? 0
  const targetWidth = Math.max(containerWidth, normalizeMinWidth(options.targetWidth) ?? 0)
  const referenceWidth = normalizeMinWidth(options.referenceWidth) ?? targetWidth
  const resolved = columns.map((column, index) =>
    resolveColumnWidth(column, index, { ...options, referenceWidth }),
  )
  const widths = resolved.map((column) => column.targetWidth ?? column.effectiveMinWidth ?? 0)
  const requiredWidth = widths.reduce((total, width) => total + width, 0)
  const minWidth = resolved.reduce((total, column) => total + (column.effectiveMinWidth ?? 0), 0)
  const flexible = resolved.flatMap((column, index) =>
    column.targetWidth === undefined ? [index] : [],
  )

  if (widths.length && targetWidth > requiredWidth) {
    if (flexible.length) {
      let remaining = targetWidth
      for (let index = 0; index < resolved.length; index += 1) {
        if (resolved[index].targetWidth !== undefined) remaining -= widths[index]
      }
      let pending = flexible
      while (pending.length) {
        const share = remaining / pending.length
        const frozen = pending.filter((index) => widths[index] > share)
        if (!frozen.length) {
          for (let position = 0; position < pending.length; position += 1) {
            const index = pending[position]
            widths[index] = position === pending.length - 1 ? remaining : share
            remaining -= widths[index]
          }
          break
        }
        const frozenSet = new Set(frozen)
        for (const index of frozen) remaining -= widths[index]
        pending = pending.filter((index) => !frozenSet.has(index))
      }
    } else {
      let remaining = targetWidth
      for (let index = 0; index < widths.length; index += 1) {
        const width =
          requiredWidth > 0
            ? (widths[index] / requiredWidth) * targetWidth
            : targetWidth / widths.length
        widths[index] = index === widths.length - 1 ? remaining : width
        remaining -= widths[index]
      }
    }
  }

  const columnWidths: Record<string, number> = {}
  for (const column of resolved) {
    if (column.resizedWidth !== undefined) columnWidths[column.key] = column.resizedWidth
  }
  const totalWidth = widths.reduce((total, width) => total + width, 0)
  return {
    columns: resolved.map((column, index) => ({ ...column, width: widths[index] })),
    widths,
    columnWidths,
    totalWidth,
    minWidth,
    requiredWidth,
    overflow: totalWidth > containerWidth,
  }
}

/**
 * Legacy declared-width accounting has no percentage reference or browser adapter.
 * Only numeric/pixel declarations and drag targets can contribute to its pixel sum.
 */
export function resolveDeclaredColumnWidth(
  column: LayoutColumn,
  index: number,
  columnWidths?: Record<string, number>,
): number {
  const resized = normalizeMinWidth(columnWidths?.[String(getColumnKey(column) ?? index)])
  return resized ?? parseColumnWidth(column.width) ?? 0
}

export function sumDeclaredColumnWidths(
  columns: readonly LayoutColumn[],
  columnWidths?: Record<string, number>,
): number {
  let total = 0
  for (let index = 0; index < columns.length; index += 1) {
    total += resolveDeclaredColumnWidth(columns[index], index, columnWidths)
  }
  return total
}

/** Read only actual pixel widths, never percentage/content-based inline declarations. */
export function parseStylePxWidth(width: string | undefined): number {
  if (!width) return 0
  const match = PX_WIDTH.exec(width.trim())
  return match ? (normalizeMinWidth(Number(match[1])) ?? 0) : 0
}
