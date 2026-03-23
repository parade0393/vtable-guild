import { computed, reactive, type ComputedRef } from 'vue'
import type {
  ColumnSorterObject,
  ColumnType,
  Key,
  SortOrder,
  SorterFn,
  SorterResultLike,
} from '../types'
import { getByDataIndex } from './useColumns'

export interface SorterState<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  columnKey: Key | undefined
  order: SortOrder
  column: ColumnType<TRecord> | undefined
  multiplePriority: number | false
}

export type SorterResult<TRecord extends Record<string, unknown> = Record<string, unknown>> =
  | SorterResultLike<TRecord>
  | Array<SorterResultLike<TRecord>>

function getSorterObject<TRecord extends Record<string, unknown>>(
  sorter: ColumnType<TRecord>['sorter'],
): ColumnSorterObject<TRecord> | undefined {
  if (!sorter || typeof sorter !== 'object' || typeof sorter === 'function') {
    return undefined
  }

  return sorter as ColumnSorterObject<TRecord>
}

function getMultiplePriority<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord>,
): number | false {
  const multiple = getSorterObject(column.sorter)?.multiple
  return typeof multiple === 'number' && Number.isFinite(multiple) ? multiple : false
}

function normalizeSorterResult<TRecord extends Record<string, unknown>>(
  state: SorterState<TRecord>,
): SorterResultLike<TRecord> {
  return {
    column: state.column,
    columnKey: state.columnKey,
    order: state.order,
    field: state.column?.dataIndex,
  }
}

/**
 * 获取列的唯一标识。
 * 优先使用 key，其次 dataIndex 转字符串。
 */
function getColumnKey<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord>,
): Key | undefined {
  if (column.key !== undefined) return column.key
  if (column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex)
  }
  return undefined
}

/**
 * 默认比较函数。
 * 数字按大小排，字符串按 localeCompare，其余转字符串比较。
 */
function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

function getSortDirections<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord>,
  tableSortDirections?: SortOrder[],
): SortOrder[] {
  return column.sortDirections ?? tableSortDirections ?? ['ascend', 'descend']
}

function getNextSortOrder(current: SortOrder, directions: SortOrder[]): SortOrder {
  const index = directions.indexOf(current)

  if (index === -1) return directions[0] ?? null
  if (index >= directions.length - 1) return null

  return directions[index + 1]
}

function compareSorterPriority<TRecord extends Record<string, unknown>>(
  a: SorterState<TRecord>,
  b: SorterState<TRecord>,
): number {
  return Number(b.multiplePriority) - Number(a.multiplePriority)
}

export interface UseSorterOptions<TRecord extends Record<string, unknown>> {
  columns: () => ColumnType<TRecord>[]
  tableSortDirections?: () => SortOrder[] | undefined
  onSorterChange?: (sorterResult: SorterResult<TRecord>) => void
}

export function useSorter<TRecord extends Record<string, unknown>>(
  options: UseSorterOptions<TRecord>,
) {
  const { columns, tableSortDirections, onSorterChange } = options

  const innerSortOrders = reactive<Record<string, SortOrder>>({})
  const initializedDefaults = new Set<string>()

  function syncDefaultSorterState() {
    const activeKeys = new Set<string>()

    columns().forEach((column) => {
      if (!column.sorter) return

      const key = getColumnKey(column)
      if (key === undefined) return

      const keyString = String(key)
      activeKeys.add(keyString)

      if (column.sortOrder !== undefined) return

      if (!initializedDefaults.has(keyString)) {
        initializedDefaults.add(keyString)

        if (column.defaultSortOrder) {
          innerSortOrders[keyString] = column.defaultSortOrder
        }
      }
    })

    Object.keys(innerSortOrders).forEach((key) => {
      if (!activeKeys.has(key)) {
        delete innerSortOrders[key]
      }
    })
  }

  syncDefaultSorterState()

  function isControlled(column: ColumnType<TRecord>): boolean {
    return column.sortOrder !== undefined
  }

  function readSortOrder(column: ColumnType<TRecord>): SortOrder {
    const key = getColumnKey(column)
    if (key === undefined) return null

    if (isControlled(column)) {
      return column.sortOrder ?? null
    }

    return innerSortOrders[String(key)] ?? null
  }

  function collectSorterStates(override?: {
    columnKey?: Key
    order: SortOrder
    column: ColumnType<TRecord>
  }): SorterState<TRecord>[] {
    syncDefaultSorterState()

    const states: SorterState<TRecord>[] = []

    columns().forEach((column) => {
      if (!column.sorter) return

      const key = getColumnKey(column)
      if (key === undefined) return

      const order =
        override && String(key) === String(override.columnKey)
          ? override.order
          : readSortOrder(column)

      if (!order) return

      states.push({
        columnKey: key,
        order,
        column,
        multiplePriority: getMultiplePriority(column),
      })
    })

    const nonMultipleStates = states.filter((state) => state.multiplePriority === false)
    if (nonMultipleStates.length > 0) {
      return [nonMultipleStates[nonMultipleStates.length - 1]]
    }

    return states.sort(compareSorterPriority)
  }

  function buildSorterResult(states: SorterState<TRecord>[]): SorterResult<TRecord> {
    if (states.length === 0) {
      return {
        column: undefined,
        columnKey: undefined,
        order: null,
        field: undefined,
      }
    }

    if (states.length === 1) {
      return normalizeSorterResult(states[0])
    }

    return states.map(normalizeSorterResult)
  }

  function getSortOrder(column: ColumnType<TRecord>): SortOrder {
    syncDefaultSorterState()
    return readSortOrder(column)
  }

  function clearUncontrolledSorters(predicate?: (column: ColumnType<TRecord>) => boolean) {
    columns().forEach((column) => {
      if (!column.sorter || isControlled(column)) return

      const key = getColumnKey(column)
      if (key === undefined) return

      if (predicate && !predicate(column)) return

      delete innerSortOrders[String(key)]
    })
  }

  function toggleSortOrder(column: ColumnType<TRecord>): void {
    if (!column.sorter) return

    syncDefaultSorterState()

    const key = getColumnKey(column)
    if (key === undefined) return

    const currentOrder = getSortOrder(column)
    const directions = getSortDirections(column, tableSortDirections?.())
    const nextOrder = getNextSortOrder(currentOrder, directions)
    const multiplePriority = getMultiplePriority(column)

    if (!isControlled(column)) {
      if (multiplePriority === false) {
        clearUncontrolledSorters()
      } else {
        clearUncontrolledSorters((item) => getMultiplePriority(item) === false)
      }

      if (nextOrder) {
        innerSortOrders[String(key)] = nextOrder
      } else {
        delete innerSortOrders[String(key)]
      }
    }

    const nextStates = collectSorterStates({
      column,
      columnKey: key,
      order: nextOrder,
    })

    onSorterChange?.(buildSorterResult(nextStates))
  }

  function resolveCompareFn(column: ColumnType<TRecord>): SorterFn<TRecord> | null {
    if (!column.sorter) return null

    if (typeof column.sorter === 'function') {
      return column.sorter as SorterFn<TRecord>
    }

    const sorterObject = getSorterObject(column.sorter)
    if (sorterObject?.compare) {
      return sorterObject.compare
    }

    return (a, b) =>
      defaultCompare(getByDataIndex(a, column.dataIndex), getByDataIndex(b, column.dataIndex))
  }

  const sorterStates = computed(() => collectSorterStates())

  const sorterState = computed<SorterState<TRecord>>(() => {
    return (
      sorterStates.value[0] ?? {
        columnKey: undefined,
        order: null,
        column: undefined,
        multiplePriority: false,
      }
    )
  })

  const sorterResult = computed<SorterResult<TRecord>>(() => buildSorterResult(sorterStates.value))

  const sortColumns = computed(() =>
    sorterStates.value.map((state) => ({
      column: state.column,
      order: state.order,
    })),
  )

  function sortData(data: TRecord[]): TRecord[] {
    if (sorterStates.value.length === 0) return data

    const activeSorters = sorterStates.value
      .map((state) => {
        if (!state.column || !state.order) return null

        const compareFn = resolveCompareFn(state.column)
        if (!compareFn) return null

        return {
          compareFn,
          multiplier: state.order === 'descend' ? -1 : 1,
        }
      })
      .filter(
        (
          sorter,
        ): sorter is {
          compareFn: SorterFn<TRecord>
          multiplier: number
        } => sorter !== null,
      )

    if (activeSorters.length === 0) return data

    return [...data].sort((a, b) => {
      for (const sorter of activeSorters) {
        const result = sorter.compareFn(a, b) * sorter.multiplier
        if (result !== 0) {
          return result
        }
      }

      return 0
    })
  }

  return {
    sorterState,
    sorterStates: sorterStates as ComputedRef<SorterState<TRecord>[]>,
    sorterResult,
    sortColumns,
    getSortOrder,
    toggleSortOrder,
    sortData,
  }
}

export { getColumnKey }
