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

/** Create an isolated, immutable registry. Overrides can replace built-ins or add value types. */
export function createTableRenderers<TRecord extends object = Record<string, unknown>>(
  overrides: Record<string, TableFieldRenderer<TRecord>> = {},
): TableFieldRenderers<TRecord> {
  const builtins: Record<string, TableFieldRenderer<TRecord>> = {
    text: (context) => context.displayValue,
    digit,
    money,
    date,
    tag: (context) => ({
      children: context.displayValue,
      status: context.fieldProps.status ?? context.status ?? 'default',
      presentation: 'tag',
    }),
  }
  return Object.freeze(Object.assign(Object.create(null), builtins, overrides))
}

export const defaultTableRenderers = createTableRenderers()
