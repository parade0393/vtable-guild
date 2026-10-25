import type { VNodeChild } from 'vue'
import type { CustomRenderContext } from './column'
import type { ColumnValueStatus } from './presentation'

/** Options shared by the built-in formatters; custom renderers may add their own fields. */
export interface TableFieldProps {
  locale?: string | string[]
  numberFormat?: Intl.NumberFormatOptions
  /** Default date output is YYYY-MM-DD; an explicit options object enables Intl formatting. */
  dateFormat?: Intl.DateTimeFormatOptions
  /** Currency used by money; defaults to CNY. */
  currency?: string
  /** tag reuses the same status tokens as valueEnum. */
  status?: ColumnValueStatus
  [key: string]: unknown
}

export interface TableFieldRenderContext<
  TRecord extends object = Record<string, unknown>,
> extends CustomRenderContext<TRecord> {
  /** The enum label, or the transformed scalar value when no enum matches. */
  displayValue: VNodeChild
  /** Resolved from valueEnum, preserving Map key identity. */
  status?: ColumnValueStatus
  fieldProps: TableFieldProps
  /** Current table locale; a field's locale option takes precedence. */
  locale?: string
}

export interface TableFieldRenderResult {
  children: VNodeChild
  /** Explicit plain text for ellipsis tooltips; VNodes are never stringified. */
  tooltipText?: string
  /** Uses the existing theme status slot. */
  status?: ColumnValueStatus
  /** Wrap children with the theme's Tag appearance instead of a status dot. */
  presentation?: 'tag'
}

export type TableFieldRenderer<TRecord extends object = Record<string, unknown>> = (
  context: TableFieldRenderContext<TRecord>,
) => VNodeChild | TableFieldRenderResult

/** A registry is local to a table or application; no process-wide mutable registry is used. */
export type TableFieldRenderers<TRecord extends object = Record<string, unknown>> = Readonly<
  Record<string, TableFieldRenderer<TRecord>>
>
