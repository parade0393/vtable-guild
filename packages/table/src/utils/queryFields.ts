import type { TableQueryColumn, TableQueryField } from '../types/query-form'
import { valueEnumEntries } from './valueEnum'

/** Derive query fields, retaining only flat dataIndex values unless a query name is explicit. */
export function deriveTableQueryFields<TValues extends object, TRecord extends object = TValues>(
  columns: readonly TableQueryColumn<TRecord, TValues>[],
  overrides: Partial<
    Record<keyof TValues & string, false | Partial<TableQueryField<TValues>>>
  > = {},
): TableQueryField<TValues>[] {
  const result: TableQueryField<TValues>[] = []
  const names = new Set<string>()
  const visit = (items: readonly TableQueryColumn<TRecord, TValues>[]) => {
    for (const column of items) {
      if (typeof column === 'symbol' || column.query === false) continue
      if ('children' in column) {
        visit(column.children)
        continue
      }
      const config = column.query ?? {}
      const name =
        config.name ?? (typeof column.dataIndex === 'string' ? column.dataIndex : undefined)
      if (name === undefined) continue
      const override = overrides[name as keyof TValues & string]
      if (override === false) continue
      const query = { ...config, ...override }
      const entries = valueEnumEntries(column.valueEnum)
      const options = entries.flatMap(([value, item]) => {
        const label = typeof item === 'string' ? item : item.text
        return typeof label === 'string'
          ? [{ value, label, ...(typeof item === 'object' ? { status: item.status } : {}) }]
          : []
      })
      const field: TableQueryField<TValues> = {
        name: name as keyof TValues & string,
        label: typeof column.title === 'function' ? name : (column.title ?? name),
        valueType: entries.length
          ? 'select'
          : column.valueType === 'digit' || column.valueType === 'money'
            ? 'digit'
            : column.valueType === 'date' ||
                column.valueType === 'dateTime' ||
                column.valueType === 'dateRange' ||
                column.valueType === 'dateTimeRange' ||
                column.valueType === 'time'
              ? column.valueType
              : 'text',
        ...(entries.length && !query.dictionary ? { options } : {}),
        ...query,
      }
      if (names.has(field.name)) continue
      names.add(field.name)
      result.push(field)
    }
  }
  visit(columns)
  return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
