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
}): UseExpandReturn {
  const internalKeys = ref<Key[]>([])
  let initialized = false

  // Initialize from defaultExpandedRowKeys or defaultExpandAllRows
  watch(
    () => options.expandable(),
    (exp) => {
      if (initialized || !exp) return
      initialized = true
      if (exp.defaultExpandAllRows) {
        internalKeys.value = options.data().map((r, i) => options.getRowKey(r, i))
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

    if (!isControlled.value) {
      if (expanded) {
        internalKeys.value = [...internalKeys.value, key]
      } else {
        internalKeys.value = internalKeys.value.filter((k) => k !== key)
      }
    }

    exp.onExpand?.(expanded, record)
    const newKeys = expanded
      ? [...expandedKeySet.value, key]
      : [...expandedKeySet.value].filter((k) => k !== key)
    exp.onExpandedRowsChange?.(newKeys)
  }

  return {
    isExpanded,
    toggleExpand,
    expandedKeySet,
  }
}
