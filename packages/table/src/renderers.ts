import type {
  TableFieldRenderContext,
  TableFieldRenderer,
  TableFieldRenderers,
} from './types/renderers'

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  // Do not coerce booleans, whitespace, objects or null into misleading numbers.
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return undefined
}

function digit<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const value = numberValue(context.value)
  if (value === undefined) return context.displayValue
  return new Intl.NumberFormat(
    context.fieldProps.locale ?? context.locale ?? 'zh-CN',
    context.fieldProps.numberFormat,
  ).format(value)
}

function money<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const value = numberValue(context.value)
  if (value === undefined) return context.displayValue
  return new Intl.NumberFormat(context.fieldProps.locale ?? context.locale ?? 'zh-CN', {
    ...context.fieldProps.numberFormat,
    style: 'currency',
    currency: context.fieldProps.currency ?? 'CNY',
  }).format(value)
}

function date<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const raw = context.value
  const calendar = typeof raw === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw) : null
  let value =
    raw instanceof Date
      ? raw
      : typeof raw === 'string' || typeof raw === 'number'
        ? new Date(raw)
        : undefined
  if (calendar) {
    value = new Date(0)
    value.setUTCFullYear(Number(calendar[1]), Number(calendar[2]) - 1, Number(calendar[3]))
    value.setUTCHours(0, 0, 0, 0)
    if (value.toISOString().slice(0, 10) !== raw) return context.displayValue
  }
  if (!value || !Number.isFinite(value.getTime())) return context.displayValue
  if (!context.fieldProps.dateFormat) {
    if (calendar) return calendar[0]
    const year = String(value.getFullYear()).padStart(4, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return new Intl.DateTimeFormat(context.fieldProps.locale ?? context.locale ?? 'zh-CN', {
    ...context.fieldProps.dateFormat,
    ...(calendar && !context.fieldProps.dateFormat.timeZone ? { timeZone: 'UTC' } : {}),
  }).format(value)
}

function clockValue(value: Date) {
  return [value.getHours(), value.getMinutes(), value.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function dateTime<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const raw = context.value
  // A calendar-only value has no timezone; preserve its date at midnight.
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00Z`)
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw)
      return context.displayValue
    return context.fieldProps.dateFormat ? date(context) : `${raw} 00:00:00`
  }
  const value =
    raw instanceof Date
      ? raw
      : typeof raw === 'string' || typeof raw === 'number'
        ? new Date(raw)
        : undefined
  if (!value || !Number.isFinite(value.getTime())) return context.displayValue
  return context.fieldProps.dateFormat ? date(context) : `${date(context)} ${clockValue(value)}`
}

function time<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const raw = context.value
  if (typeof raw === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(raw)) {
    const normalized = raw.length === 5 ? `${raw}:00` : raw
    if (!context.fieldProps.dateFormat) return normalized
    // A time-only value has no date/zone. Anchor it to UTC for deterministic Intl formatting.
    return new Intl.DateTimeFormat(context.fieldProps.locale ?? context.locale ?? 'zh-CN', {
      timeZone: 'UTC',
      ...context.fieldProps.dateFormat,
    }).format(new Date(`1970-01-01T${normalized}Z`))
  }
  const value =
    raw instanceof Date
      ? raw
      : typeof raw === 'string' || typeof raw === 'number'
        ? new Date(raw)
        : undefined
  if (!value || !Number.isFinite(value.getTime())) return context.displayValue
  return context.fieldProps.dateFormat ? date(context) : clockValue(value)
}

function range<TRecord extends object>(
  context: TableFieldRenderContext<TRecord>,
  withTime: boolean,
) {
  if (!Array.isArray(context.value) || context.value.length !== 2) return context.displayValue
  const format = withTime ? dateTime : date
  const parts = context.value.map((value: unknown) => {
    if (value == null || value === '') return context.fieldProps.rangeEmptyText ?? '—'
    const formatted = format({ ...context, value, text: value, displayValue: value as string })
    // Never turn an invalid object endpoint into [object Object].
    return typeof formatted === 'string' || typeof formatted === 'number'
      ? String(formatted)
      : undefined
  })
  if (parts.some((part) => part === undefined)) return context.displayValue
  return parts.join(context.fieldProps.rangeSeparator ?? ' ~ ')
}

function percentValue<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const value = numberValue(context.value)
  return value === undefined
    ? undefined
    : context.fieldProps.percentScale === 'ratio'
      ? value * 100
      : value
}

function formatPercent<TRecord extends object>(
  context: TableFieldRenderContext<TRecord>,
  value: number,
) {
  return new Intl.NumberFormat(context.fieldProps.locale ?? context.locale ?? 'zh-CN', {
    maximumFractionDigits: Math.max(2, context.fieldProps.numberFormat?.minimumFractionDigits ?? 0),
    ...context.fieldProps.numberFormat,
    style: 'percent',
  }).format(value / 100)
}

function percent<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const value = percentValue(context)
  return value === undefined || !Number.isFinite(value)
    ? context.displayValue
    : formatPercent(context, value)
}

function progress<TRecord extends object>(context: TableFieldRenderContext<TRecord>) {
  const value = percentValue(context)
  if (value === undefined || !Number.isFinite(value)) return context.displayValue
  const clamped = Math.max(0, Math.min(100, value))
  return {
    children: formatPercent(context, clamped),
    presentation: 'progress' as const,
    status:
      context.fieldProps.status ?? context.status ?? (clamped === 100 ? 'success' : 'processing'),
    progress: { percent: clamped, showValue: context.fieldProps.showValue !== false },
  }
}

/** Create an isolated, immutable registry. Overrides can replace built-ins or add value types. */
export function createTableRenderers<TRecord extends object = Record<string, unknown>>(
  overrides: Record<string, TableFieldRenderer<TRecord>> = {},
): TableFieldRenderers<TRecord> {
  const builtins: Record<string, TableFieldRenderer<TRecord>> = {
    text: (context) => context.displayValue,
    digit,
    money,
    date,
    dateTime,
    time,
    dateRange: (context) => range(context, false),
    dateTimeRange: (context) => range(context, true),
    percent,
    progress,
    tag: (context) => ({
      children: context.displayValue,
      status: context.fieldProps.status ?? context.status ?? 'default',
      presentation: 'tag',
    }),
  }
  return Object.freeze(Object.assign(Object.create(null), builtins, overrides))
}

export const defaultTableRenderers = createTableRenderers()
