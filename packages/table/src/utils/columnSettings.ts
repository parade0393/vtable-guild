import type { ColumnsType, ColumnType, ColumnGroupType } from '../types'

export interface SettingsEntry<T extends object> {
  id: string
  column: ColumnType<T> | ColumnGroupType<T>
  children: SettingsEntry<T>[]
}

export type ColumnSettingAction = 'checkbox' | 'fixed' | 'order'
export type ColumnFixed = 'left' | 'right' | undefined

export function isColumnSettingDisabled<T extends object>(
  column: ColumnType<T> | ColumnGroupType<T>,
  action: ColumnSettingAction,
): boolean {
  return (
    column.disable === true ||
    (typeof column.disable === 'object' && column.disable[action] === true)
  )
}

export function isVisibilityLocked<T extends object>(entry: SettingsEntry<T>): boolean {
  return subtreeDisabled(entry.column, 'checkbox')
}

export function configurableEntries<T extends object>(columns: ColumnsType<T>): SettingsEntry<T>[] {
  function filter(entries: SettingsEntry<T>[]): SettingsEntry<T>[] {
    return entries
      .filter((entry) => !entry.column.hideInSetting)
      .map((entry) => ({
        ...entry,
        children: filter(entry.children),
      }))
  }
  return filter(settingsEntries(columns))
}

/** A group is moved as one unit; mixed pinning is never silently normalized by dragging. */
export function columnFixedRegion<T extends object>(
  column: ColumnType<T> | ColumnGroupType<T>,
): ColumnFixed | 'mixed' {
  if ('children' in column && column.children.length) {
    const regions = column.children.map(columnFixedRegion)
    return regions.every((region) => region === regions[0]) ? regions[0] : 'mixed'
  }
  return column.fixed === true ? 'left' : column.fixed || undefined
}

function subtreeDisabled<T extends object>(
  column: ColumnType<T> | ColumnGroupType<T>,
  action: ColumnSettingAction,
): boolean {
  return (
    isColumnSettingDisabled(column, action) ||
    ('children' in column && column.children.some((child) => subtreeDisabled(child, action)))
  )
}

export function canSetColumnFixed<T extends object>(entry: SettingsEntry<T>): boolean {
  return !subtreeDisabled(entry.column, 'fixed')
}

/** Keep sentinel positions and do not move an order-locked column as a side effect. */
function replaceBusinessColumns<T extends object>(
  original: ColumnsType<T>,
  reordered: Array<ColumnType<T> | ColumnGroupType<T>>,
): ColumnsType<T> {
  const previous = original.filter((column) => typeof column !== 'symbol')
  if (
    previous.some(
      (column, index) => isColumnSettingDisabled(column, 'order') && reordered[index] !== column,
    )
  )
    return original
  let index = 0
  return original.map((column) => (typeof column === 'symbol' ? column : reordered[index++]!))
}

export function setColumnFixed<T extends object>(
  columns: ColumnsType<T>,
  id: string,
  fixed: ColumnFixed,
): ColumnsType<T> {
  const target = settingsEntries(columns).find((entry) => entry.id === id)
  if (!target || !canSetColumnFixed(target)) return columns
  function pin(column: ColumnType<T> | ColumnGroupType<T>): ColumnType<T> | ColumnGroupType<T> {
    if ('children' in column) return { ...column, fixed, children: column.children.map(pin) }
    return column.fixed === fixed ? column : { ...column, fixed }
  }
  const pinned = pin(target.column)
  const business = columns
    .filter((column) => typeof column !== 'symbol')
    .map((column) => (column === target.column ? pinned : column))
  if (business.some((column) => columnFixedRegion(column) === 'mixed')) return columns
  const rank = (column: ColumnType<T> | ColumnGroupType<T>) => {
    const region = columnFixedRegion(column)
    return region === 'left' ? -1 : region === 'right' ? 1 : 0
  }
  business.sort((a, b) => rank(a) - rank(b))
  // An immutable pin update is allowed for an order-locked column only in its existing slot.
  const originals = columns.filter((column) => typeof column !== 'symbol')
  if (
    originals.some(
      (column, index) =>
        subtreeDisabled(column, 'order') && business[index] !== column && column !== target.column,
    )
  )
    return columns
  if (
    subtreeDisabled(target.column, 'order') &&
    business.indexOf(pinned) !== originals.indexOf(target.column)
  )
    return columns
  let index = 0
  return columns.map((column) => (typeof column === 'symbol' ? column : business[index++]!))
}

export function moveSettingColumn<T extends object>(
  columns: ColumnsType<T>,
  sourceId: string,
  targetId: string,
): ColumnsType<T> {
  const entries = settingsEntries(columns)
  const from = entries.findIndex((entry) => entry.id === sourceId)
  const to = entries.findIndex((entry) => entry.id === targetId)
  if (from < 0 || to < 0 || from === to) return columns
  const source = entries[from]!
  const target = entries[to]!
  const region = columnFixedRegion(source.column)
  if (region === 'mixed' || region !== columnFixedRegion(target.column)) return columns
  if (
    entries
      .slice(Math.min(from, to), Math.max(from, to) + 1)
      .some((entry) => subtreeDisabled(entry.column, 'order'))
  )
    return columns
  const business = entries.map((entry) => entry.column)
  business.splice(to, 0, business.splice(from, 1)[0]!)
  const ranks = business
    .map(columnFixedRegion)
    .map((value) => (value === 'left' ? -1 : value === 'right' ? 1 : 0))
  if (ranks.some((rank, index) => index > 0 && rank < ranks[index - 1]!)) return columns
  return replaceBusinessColumns(columns, business)
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
    if (column.hideInSetting || isColumnSettingDisabled(column, 'checkbox')) return column
    let next = column
    if (
      values.has(entry.id) &&
      !isVisibilityLocked(entry) &&
      column.visible !== values.get(entry.id)
    ) {
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
