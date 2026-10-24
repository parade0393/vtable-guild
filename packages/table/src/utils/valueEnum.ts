import type { ColumnFilterItem, ColumnType } from '../types/column'
import type { ColumnValue, ColumnValueEnum, ColumnValueEnumItem } from '../types/presentation'

export function valueEnumEntries(
  valueEnum?: ColumnValueEnum,
): [ColumnValue, ColumnValueEnumItem][] {
  if (!valueEnum) return []
  return valueEnum instanceof Map ? [...valueEnum.entries()] : Object.entries(valueEnum)
}

export function resolveValueEnum(valueEnum: ColumnValueEnum | undefined, value: unknown) {
  if (!valueEnum || !['string', 'number', 'boolean'].includes(typeof value)) return undefined
  const item =
    valueEnum instanceof Map
      ? valueEnum.get(value as ColumnValue)
      : Object.prototype.hasOwnProperty.call(valueEnum, String(value))
        ? (valueEnum as Record<string, ColumnValueEnumItem>)[String(value)]
        : undefined
  return typeof item === 'string' ? { text: item } : item
}

export function getColumnFilters<TRecord extends object>(
  column: ColumnType<TRecord>,
): ColumnFilterItem[] {
  if (Array.isArray(column.filters)) return column.filters
  if (column.filters !== true) return []
  return valueEnumEntries(column.valueEnum).map(([value, item]) => ({
    value,
    text:
      typeof item === 'string'
        ? item
        : ['string', 'number', 'boolean'].includes(typeof item.text)
          ? String(item.text)
          : String(value),
  }))
}

export function matchesEnumFilter(column: ColumnType, filter: ColumnValue, value: unknown) {
  // Object keys are strings; a Map retains strict numeric/boolean key identity.
  return column.valueEnum instanceof Map
    ? Object.is(filter, value)
    : String(filter) === String(value)
}
