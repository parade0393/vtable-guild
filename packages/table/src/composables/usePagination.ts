import { computed, ref, watch } from 'vue'
import { devWarn } from '@vtable-guild/core'
import type { TablePaginationConfig, TablePaginationState } from '../types/pagination'

export function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : fallback
}

export function usePagination<T>(options: {
  pagination: () => false | TablePaginationConfig | undefined
  data: () => T[]
  manual?: () => boolean
  onChange: (state: TablePaginationState) => void
}) {
  const enabled = computed(() => !!options.pagination())
  const config = computed(() => options.pagination() || {})
  const innerCurrent = ref(1)
  const innerPageSize = ref(10)
  let initialized = false
  watch(
    enabled,
    (active) => {
      if (!active || initialized) return
      initialized = true
      innerPageSize.value = positiveInteger(config.value.defaultPageSize, 10)
      innerCurrent.value = positiveInteger(config.value.defaultCurrent, 1)
    },
    { immediate: true, flush: 'sync' },
  )

  const state = computed<TablePaginationState>(() => {
    const p = config.value
    const pageSize = positiveInteger(p.pageSize, innerPageSize.value)
    // Ant uses a positive explicit total, falling back to the processed root count.
    const total =
      options.manual?.() &&
      typeof p.total === 'number' &&
      Number.isSafeInteger(p.total) &&
      p.total >= 0
        ? p.total
        : positiveInteger(p.total, options.data().length)
    const current = Math.min(
      positiveInteger(p.current, innerCurrent.value),
      Math.max(1, Math.ceil(total / pageSize)),
    )
    return { current, pageSize, total }
  })

  watch(
    () => state.value.current,
    (current) => {
      if (enabled.value && config.value.current === undefined) innerCurrent.value = current
    },
    { flush: 'sync' },
  )

  const pageData = computed(() => {
    const data = options.data()
    if (!enabled.value || options.manual?.()) return data
    const { current, pageSize, total } = state.value
    if (data.length < total && data.length <= pageSize) return data
    return data.slice((current - 1) * pageSize, current * pageSize)
  })

  watch(
    () => [enabled.value, options.data().length, state.value.total, state.value.pageSize] as const,
    ([active, length, total, pageSize]) => {
      if (active && !options.manual?.() && length < total && length > pageSize) {
        devWarn(
          'vtable-pagination-remote-length',
          '[VTable] dataSource length is less than pagination.total but exceeds pageSize. Remote pagination expects one page of data.',
        )
      }
    },
    { immediate: true },
  )

  function commit(current: number, pageSize: number, sizeChanged: boolean) {
    const p = config.value
    if (p.current === undefined) innerCurrent.value = current
    if (p.pageSize === undefined) innerPageSize.value = pageSize
    p['onUpdate:current']?.(current)
    if (sizeChanged) {
      p['onUpdate:pageSize']?.(pageSize)
      p.onShowSizeChange?.(current, pageSize)
    }
    p.onChange?.(current, pageSize)
  }

  function change(current: number, pageSize = state.value.pageSize) {
    if (!enabled.value || config.value.disabled) return
    const previous = state.value
    const size = positiveInteger(pageSize, previous.pageSize)
    const page = Math.min(
      positiveInteger(current, previous.current),
      Math.max(1, Math.ceil(previous.total / size)),
    )
    if (page === previous.current && size === previous.pageSize) return
    const next = { current: page, pageSize: size, total: previous.total }
    commit(page, size, size !== previous.pageSize)
    options.onChange(next)
  }

  // A filter is one table action, not an additional paginate action.
  function resetForFilter(): TablePaginationState | undefined {
    if (!enabled.value) return undefined
    const next = { ...state.value, current: 1 }
    commit(1, next.pageSize, false)
    return next
  }

  return { enabled, config, state, pageData, change, resetForFilter }
}
