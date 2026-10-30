import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ColumnFilterItem } from './column'
import type { ColumnValue, ColumnValueEnumItem, ColumnValueStatus } from './presentation'

export interface TableDictionaryOption {
  value: ColumnValue
  label: string
  status?: ColumnValueStatus
  disabled?: boolean
}

export interface TableDictionaryResult {
  options: readonly TableDictionaryOption[]
  /** True only when this result contains the entire dictionary for these dependency params. */
  complete: boolean
}

export interface TableDictionaryContext {
  signal: AbortSignal
  keyword: string
}

export type TableDictionaryRequest<TParams extends object> = (
  params: Partial<TParams>,
  context: TableDictionaryContext,
) => Promise<TableDictionaryResult>

export interface CreateTableDictionaryOptions<TParams extends object> {
  key: string
  request: TableDictionaryRequest<TParams>
  /** Successful result lifetime in milliseconds. Default 300000; 0 disables result caching. */
  cacheTime?: number
  /** Maximum retained entries. Active subscribers are never evicted. Default 50. */
  maxEntries?: number
}

/** Explicitly share one instance within a table/page or an application-owned provider. */
export interface TableDictionary<TParams extends object = Record<string, unknown>> {
  readonly key: string
  /** Share pending work; force bypasses a completed cache entry. Each caller can cancel separately. */
  load: (
    params: Partial<TParams>,
    context: TableDictionaryContext & { force?: boolean },
  ) => Promise<TableDictionaryResult>
  /** Forget cached entries. Existing subscribers can finish, but their result is not re-cached. */
  invalidate: () => void
}

export interface UseTableDictionaryOptions<TParams extends object> {
  dictionary: TableDictionary<TParams>
  /** Dependency parameters. Changes clear the keyword/results, never a business selection. */
  params?: MaybeRefOrGetter<Partial<TParams>>
  defaultKeyword?: string
  /** Supply selected labels, including records not present in the latest remote search page. */
  selectedOptions?: MaybeRefOrGetter<readonly TableDictionaryOption[]>
  manualRequest?: boolean
  debounceTime?: number
  onError?: (error: Error) => void
}

export interface UseTableDictionaryReturn {
  options: ComputedRef<readonly TableDictionaryOption[]>
  /** Known labels for the current dependency params, plus explicitly supplied selected options. */
  valueEnum: ComputedRef<ReadonlyMap<ColumnValue, ColumnValueEnumItem>>
  /** Empty for partial/search results. Bind explicitly instead of using filters: true. */
  filters: ComputedRef<ColumnFilterItem[]>
  complete: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>
  keyword: Readonly<Ref<string>>
  search: (keyword: string) => Promise<boolean>
  reload: () => Promise<boolean>
  cancel: () => void
}

/** Accept both composable refs and Vue's deeply unwrapped column/schema configurations. */
export interface TableDictionaryBinding {
  options: MaybeRefOrGetter<readonly TableDictionaryOption[]>
  valueEnum: MaybeRefOrGetter<ReadonlyMap<ColumnValue, ColumnValueEnumItem>>
  loading: MaybeRefOrGetter<boolean>
  error: MaybeRefOrGetter<Error | null>
  search: (keyword: string) => Promise<boolean>
}
