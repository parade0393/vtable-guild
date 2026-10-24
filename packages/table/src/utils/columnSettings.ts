import type { ColumnsType, ColumnType, ColumnGroupType } from '../types'

export interface SettingsEntry<T extends object> {
  id: string
  column: ColumnType<T> | ColumnGroupType<T>
  children: SettingsEntry<T>[]
}

/** Keys keep defaults attached to the same column after immutable updates or reordering. */
export function settingsEntries<T extends object>(
  columns: ColumnsType<T>,
  parent = '',
): SettingsEntry<T>[] {
  return columns.flatMap((column, index) => {
    if (typeof column === 'symbol') return []
    const identity =
      column.key !== undefined
        ? ['key', column.key]
        : 'dataIndex' in column && column.dataIndex !== undefined
          ? ['dataIndex', column.dataIndex]
          : ['index', index]
    const id = `${parent}/${JSON.stringify(identity)}`
    return [
      {
        id,
        column,
        children: 'children' in column ? settingsEntries(column.children, id) : [],
      },
    ]
  })
}

/** Clone only changed branches; preserve renderers, sort/filter configuration and sentinels. */
export function setColumnVisibility<T extends object>(
  columns: ColumnGroupType<T>['children'],
  values: ReadonlyMap<string, boolean | undefined>,
  parent?: string,
): ColumnGroupType<T>['children']
export function setColumnVisibility<T extends object>(
  columns: ColumnsType<T>,
  values: ReadonlyMap<string, boolean | undefined>,
  parent?: string,
): ColumnsType<T>
export function setColumnVisibility<T extends object>(
  columns: ColumnsType<T>,
  values: ReadonlyMap<string, boolean | undefined>,
  parent = '',
): ColumnsType<T> {
  const entries = settingsEntries(columns, parent)
  let entryIndex = 0
  return columns.map((column) => {
    if (typeof column === 'symbol') return column
    const entry = entries[entryIndex++]!
    let next = column
    if (values.has(entry.id) && column.visible !== values.get(entry.id)) {
      next = { ...column, visible: values.get(entry.id) }
    }
    if ('children' in column) {
      const children = setColumnVisibility(column.children, values, entry.id)
      if (children.some((child, index) => child !== column.children[index])) {
        next = { ...next, children }
      }
    }
    return next
  })
}
