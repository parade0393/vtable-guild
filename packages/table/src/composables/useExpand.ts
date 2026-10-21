import { computed, ref, watch, type ComputedRef } from 'vue'
import type { Key } from '../types'
import type { Expandable } from '../types/table'

export interface UseExpandReturn {
  isExpanded: (key: Key) => boolean
  toggleExpand: (record: Record<string, unknown>, index: number) => void
  expandedKeySet: ComputedRef<Set<Key>>
}

export function useExpand(options: {
  expandable: () => Expandable | undefined
  getRowKey: (record: Record<string, unknown>, index: number) => Key
  data: () => Record<string, unknown>[]
  childrenColumnName?: () => string | undefined
  initializeNewRows?: () => boolean
}): UseExpandReturn {
  const internalKeys = ref<Key[]>([])
  let initialized = false
  const initializedKeys = new Set<Key>()
  function collectKeys(records: Record<string, unknown>[]) {
    const keys: Key[] = []
    function walk(items: Record<string, unknown>[]) {
      for (const record of items) {
        keys.push(options.getRowKey(record, keys.length))
        const children = record[options.childrenColumnName?.() ?? 'children']
        if (Array.isArray(children)) walk(children)
      }
    }
    walk(records)
    return keys
  }

  // Initialize from defaultExpandedRowKeys or defaultExpandAllRows
  watch(
    () => options.expandable(),
    (exp) => {
      if (initialized || !exp) return
      initialized = true
      if (exp.defaultExpandAllRows) {
        internalKeys.value = options.initializeNewRows?.()
          ? collectKeys(options.data())
          : options.data().map((r, i) => options.getRowKey(r, i))
        internalKeys.value.forEach((key) => initializedKeys.add(key))
      } else if (exp.defaultExpandedRowKeys) {
        internalKeys.value = [...exp.defaultExpandedRowKeys]
      }
    },
    { immediate: true },
  )

  const isControlled = computed(() => {
    const exp = options.expandable()
    return exp?.expandedRowKeys !== undefined
  })

  watch(
    () =>
      options.initializeNewRows?.() && options.expandable()?.defaultExpandAllRows
        ? options.data()
        : null,
    (data) => {
      if (!data || isControlled.value) return
      const next = new Set(internalKeys.value)
      for (const key of collectKeys(data)) {
        if (!initializedKeys.has(key)) next.add(key)
        initializedKeys.add(key)
      }
      internalKeys.value = [...next]
    },
    { immediate: true },
  )

  const expandedKeySet = computed(() => {
    const exp = options.expandable()
    if (!exp) return new Set<Key>()
    const keys = isControlled.value ? exp.expandedRowKeys! : internalKeys.value
    return new Set(keys)
  })

  function isExpanded(key: Key): boolean {
    return expandedKeySet.value.has(key)
  }

  function toggleExpand(record: Record<string, unknown>, index: number) {
    const exp = options.expandable()
    if (!exp) return

    const key = options.getRowKey(record, index)
    const expanded = !isExpanded(key)

    // 先在旧状态上算出唯一的 nextKeys，状态与回调共用同一份：
    // 旧实现先追加进 internalKeys，再从已更新的 expandedKeySet 上追加一次，
    // 首次展开会收到 ['k0', 'k0'] 这种重复 key。
    const currentKeys = isControlled.value ? (exp.expandedRowKeys ?? []) : internalKeys.value
    const nextKeys = expanded ? [...currentKeys, key] : currentKeys.filter((k) => k !== key)

    if (!isControlled.value) {
      internalKeys.value = nextKeys
    }

    exp.onExpand?.(expanded, record)
    exp.onExpandedRowsChange?.(nextKeys)
  }

  return {
    isExpanded,
    toggleExpand,
    expandedKeySet,
  }
}
