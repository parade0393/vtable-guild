import {
  computed,
  getCurrentInstance,
  onMounted,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import type { ColumnsType } from '../types'
import {
  columnFixedRegion,
  isColumnSettingDisabled,
  moveSettingColumn,
  setColumnFixed,
  setColumnVisibility,
  settingsEntries,
  type SettingsEntry,
} from '../utils/columnSettings'

export interface TableColumnStateValue {
  visible?: boolean
  /** Pinning and ordering belong to top-level columns/groups. */
  fixed?: 'left' | 'right' | false
  order?: number
}

/** Keys are the stable column paths returned by this helper's state. */
export type TableColumnState = Record<string, TableColumnStateValue>

export interface UseColumnStateOptions {
  defaultValue?: TableColumnState
  storageKey?: string
  storageType?: 'localStorage' | 'sessionStorage'
  version?: string | number
  /** Optional application storage adapter. Only serializable state is stored. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  onError?: (error: unknown) => void
}

function snapshot<T extends object>(columns: ColumnsType<T>): TableColumnState {
  const result: TableColumnState = {}
  function visit(entries: SettingsEntry<T>[], nested = false) {
    entries.forEach((entry, order) => {
      const region = columnFixedRegion(entry.column)
      result[entry.id] = {
        visible: entry.column.visible !== false,
        ...(!nested && region !== 'mixed' ? { fixed: region ?? false, order } : {}),
      }
      visit(entry.children, true)
    })
  }
  visit(settingsEntries(columns))
  return result
}

function sanitize(value: unknown): TableColumnState {
  const result: TableColumnState = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
  for (const [key, raw] of Object.entries(value)) {
    if (!key.startsWith('/') || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const item = raw as Record<string, unknown>
    result[key] = {
      ...(typeof item.visible === 'boolean' ? { visible: item.visible } : {}),
      ...(item.fixed === false || item.fixed === 'left' || item.fixed === 'right'
        ? { fixed: item.fixed }
        : {}),
      ...(typeof item.order === 'number' && Number.isSafeInteger(item.order) && item.order >= 0
        ? { order: item.order }
        : {}),
    }
  }
  return result
}

/**
 * Compose controlled columns with serializable preferences. The source owns column definitions;
 * assigning columns records preferences without serializing or replacing renderers and sorters.
 */
export function useColumnState<T extends object>(
  source: MaybeRefOrGetter<ColumnsType<T>>,
  options: UseColumnStateOptions = {},
) {
  const overrides = shallowRef<TableColumnState>(sanitize(options.defaultValue))
  const defaults: TableColumnState = {}
  watch(
    () => snapshot(toValue(source)),
    (current) => {
      for (const [key, value] of Object.entries(current)) {
        if (!(key in defaults)) defaults[key] = value
      }
      // Removed columns are not recreated. A later re-add keeps its original default baseline.
    },
    { immediate: true, deep: true, flush: 'sync' },
  )

  function apply(value: TableColumnState): ColumnsType<T> {
    let result = toValue(source)
    const entries = settingsEntries(result)
    for (const entry of entries) {
      const item = value[entry.id]
      if (entry.column.hideInSetting || !item || item.fixed === undefined) continue
      if (columnFixedRegion(entry.column) !== (item.fixed || undefined)) {
        result = setColumnFixed(result, entry.id, item.fixed || undefined)
      }
    }
    const desired = settingsEntries(result)
      .filter((entry) => !entry.column.hideInSetting)
      .sort((a, b) => (value[a.id]?.order ?? Infinity) - (value[b.id]?.order ?? Infinity))
    // Move inside each fixed region only; lock barriers and sentinel slots remain intact.
    for (let index = desired.length - 1; index >= 0; index--) {
      const entry = desired[index]!
      const current = settingsEntries(result)
      const region = columnFixedRegion(entry.column)
      const regionDesired = desired.filter(
        (candidate) => columnFixedRegion(candidate.column) === region,
      )
      const regionCurrent = current.filter(
        (candidate) => columnFixedRegion(candidate.column) === region,
      )
      const target = regionCurrent[regionDesired.indexOf(entry)]
      if (target && !isColumnSettingDisabled(entry.column, 'order')) {
        result = moveSettingColumn(result, entry.id, target.id)
      }
    }
    const visible = new Map<string, boolean>()
    for (const [key, item] of Object.entries(value)) {
      if (item.visible !== undefined) visible.set(key, item.visible)
    }
    return setColumnVisibility(result, visible)
  }

  const columns = computed<ColumnsType<T>>({
    get: () => apply(overrides.value),
    set: (next) => {
      overrides.value = snapshot(next)
    },
  })
  const state = computed(() => snapshot(columns.value))
  const storage = () => {
    if (options.storage) return options.storage
    if (typeof window === 'undefined') return undefined
    return window[options.storageType ?? 'localStorage']
  }
  function save() {
    if (!options.storageKey) return
    try {
      storage()?.setItem(
        options.storageKey,
        JSON.stringify({
          version: options.version ?? 1,
          state: state.value,
        }),
      )
    } catch (error) {
      options.onError?.(error)
    }
  }
  function restore() {
    if (!options.storageKey) return
    try {
      const raw = storage()?.getItem(options.storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { version?: unknown; state?: unknown }
      if (!parsed || typeof parsed !== 'object' || parsed.version !== (options.version ?? 1)) return
      overrides.value = { ...sanitize(options.defaultValue), ...sanitize(parsed.state) }
    } catch (error) {
      options.onError?.(error)
    }
  }
  function setState(value: TableColumnState) {
    overrides.value = sanitize(value)
  }
  function reset() {
    overrides.value = { ...defaults, ...sanitize(options.defaultValue) }
    save()
  }
  if (getCurrentInstance()) onMounted(restore)
  else restore()
  watch(state, save, { deep: true })

  return { columns, state, setState, reset, restore, save }
}
