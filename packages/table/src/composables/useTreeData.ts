import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Key } from '../types'

export interface FlattenRow<TRecord = Record<string, unknown>> {
  /** Original data record */
  record: TRecord
  /** Nesting depth (0 = root) */
  level: number
  /** Whether this row is currently expanded */
  expanded: boolean
  /** Whether this row has child rows */
  hasChildren: boolean
  /** Parent row key (undefined for root rows) */
  parentKey?: Key
}

export interface UseTreeDataOptions<TRecord = Record<string, unknown>> {
  /** Data source accessor */
  data: () => TRecord[]
  /** Field name for children, defaults to 'children' */
  childrenColumnName?: () => string | undefined
  /** Indent size in pixels, defaults to 15 */
  indentSize?: () => number | undefined
  /** Row key resolver */
  getRowKey: (record: TRecord, index: number) => Key
  /** Default expanded keys (uncontrolled) */
  defaultExpandedRowKeys?: () => Key[] | undefined
  /** Controlled expanded keys */
  expandedRowKeys?: () => Key[] | undefined
  /** Whether to expand all rows by default */
  defaultExpandAllRows?: () => boolean | undefined
  /** Expand/collapse callback */
  onExpand?: (expanded: boolean, record: TRecord) => void
  /** Expanded keys change callback */
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
}

export interface UseTreeDataReturn<TRecord = Record<string, unknown>> {
  /** Flattened visible rows */
  flattenData: ComputedRef<FlattenRow<TRecord>[]>
  /** Whether tree mode is active (data has children) */
  isTreeData: ComputedRef<boolean>
  /** Toggle a row's expanded state */
  toggleTreeExpand: (record: TRecord, index: number) => void
  /** Check if a row is expanded */
  isTreeExpanded: (key: Key) => boolean
  /** Current expanded keys */
  expandedKeys: Ref<Set<Key>>
  /** Indent size in px */
  indentSize: ComputedRef<number>
}

export function useTreeData<TRecord extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTreeDataOptions<TRecord>,
): UseTreeDataReturn<TRecord> {
  const childrenField = computed(() => options.childrenColumnName?.() ?? 'children')
  const indentSize = computed(() => options.indentSize?.() ?? 15)

  // Detect if any row has children
  const isTreeData = computed(() => {
    const field = childrenField.value
    return options
      .data()
      .some(
        (record) =>
          Array.isArray((record as Record<string, unknown>)[field]) &&
          ((record as Record<string, unknown>)[field] as unknown[]).length > 0,
      )
  })

  // Expanded keys state (controlled / uncontrolled)
  const internalExpandedKeys = ref<Set<Key>>(new Set())

  // Initialize from defaults
  const isControlled = computed(() => options.expandedRowKeys?.() !== undefined)

  // Initialize internal keys
  watch(
    [
      () => options.data(),
      () => options.defaultExpandAllRows?.(),
      () => options.defaultExpandedRowKeys?.(),
    ],
    () => {
      if (isControlled.value) return

      if (options.defaultExpandAllRows?.()) {
        // Collect all keys that have children
        const allKeys = new Set<Key>()
        const field = childrenField.value
        function collectExpandableKeys(records: TRecord[], idx: number[] = []) {
          records.forEach((record, ri) => {
            const children = (record as Record<string, unknown>)[field]
            if (Array.isArray(children) && children.length > 0) {
              allKeys.add(options.getRowKey(record, idx.length > 0 ? -1 : ri))
              collectExpandableKeys(children, [...idx, ri])
            }
          })
        }
        collectExpandableKeys(options.data())
        internalExpandedKeys.value = allKeys
      } else if (options.defaultExpandedRowKeys?.()) {
        internalExpandedKeys.value = new Set(options.defaultExpandedRowKeys!())
      }
    },
    { immediate: true },
  )

  const expandedKeys = computed({
    get: () => {
      if (isControlled.value) {
        return new Set(options.expandedRowKeys!())
      }
      return internalExpandedKeys.value
    },
    set: (val) => {
      internalExpandedKeys.value = val
    },
  })

  function isTreeExpanded(key: Key): boolean {
    return expandedKeys.value.has(key)
  }

  function toggleTreeExpand(record: TRecord, index: number) {
    const key = options.getRowKey(record, index)
    const wasExpanded = expandedKeys.value.has(key)
    const newExpanded = !wasExpanded

    if (isControlled.value) {
      // In controlled mode, just fire callbacks
      options.onExpand?.(newExpanded, record)
      const newKeys = new Set(expandedKeys.value)
      if (newExpanded) newKeys.add(key)
      else newKeys.delete(key)
      options.onExpandedRowsChange?.(Array.from(newKeys))
    } else {
      const newSet = new Set(internalExpandedKeys.value)
      if (newExpanded) newSet.add(key)
      else newSet.delete(key)
      internalExpandedKeys.value = newSet
      options.onExpand?.(newExpanded, record)
      options.onExpandedRowsChange?.(Array.from(newSet))
    }
  }

  // Flatten tree data into visible rows
  const flattenData = computed<FlattenRow<TRecord>[]>(() => {
    const data = options.data()
    if (!isTreeData.value) {
      // No tree structure — return flat rows with level 0
      return data.map((record) => ({
        record,
        level: 0,
        expanded: false,
        hasChildren: false,
      }))
    }

    const field = childrenField.value
    const rows: FlattenRow<TRecord>[] = []
    const keys = expandedKeys.value

    function flatten(records: TRecord[], level: number, parentKey?: Key) {
      records.forEach((record, _i) => {
        const children = (record as Record<string, unknown>)[field] as TRecord[] | undefined
        const hasChildren = Array.isArray(children) && children.length > 0
        const key = options.getRowKey(record, rows.length)
        const expanded = hasChildren && keys.has(key)

        rows.push({
          record,
          level,
          expanded,
          hasChildren,
          parentKey,
        })

        if (expanded && children) {
          flatten(children, level + 1, key)
        }
      })
    }

    flatten(data, 0)
    return rows
  })

  return {
    flattenData,
    isTreeData,
    toggleTreeExpand,
    isTreeExpanded,
    expandedKeys: internalExpandedKeys,
    indentSize,
  }
}
