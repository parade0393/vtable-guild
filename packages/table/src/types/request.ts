import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import type { SortOrder } from './column'
import type { TablePaginationConfig, TablePaginationState } from './pagination'
import type { TableFiltersInfo, VTableEventProps } from './table'

/** Explicitly delegate calculations to a server while retaining the table's state and events. */
export interface TableManualConfig {
  sort?: boolean
  filter?: boolean
  pagination?: boolean
}

export type TableRequestSort = Record<string, Exclude<SortOrder, null>>
export type TableRequestParams<TParams extends object> = Partial<TParams> & {
  current: number
  pageSize: number
}

export interface TableRequestContext {
  /** Pass this signal to fetch or another client to cancel the underlying network request. */
  signal: AbortSignal
}

export interface TableRequestResult<TRecord extends object> {
  data: TRecord[]
  total: number
  /** An explicit false is treated as a failed request. */
  success?: boolean
}

export type TableRequest<TRecord extends object, TParams extends object> = (
  params: TableRequestParams<TParams>,
  sort: TableRequestSort,
  filters: TableFiltersInfo,
  context: TableRequestContext,
) => Promise<TableRequestResult<TRecord>>

/** Disabled by default. Positive intervals are clamped to at least 2000ms. */
export type TableRequestPolling<TRecord extends object> =
  | number
  | false
  | ((data: readonly TRecord[]) => number | false)

export interface UseTableRequestOptions<
  TRecord extends object,
  TParams extends object = Record<string, unknown>,
> {
  request: TableRequest<TRecord, TParams>
  /** Extra parameters override submitted query fields. Reactive changes reset to page one. */
  params?: MaybeRefOrGetter<Partial<TParams>>
  /** Initial submitted query and the query restored by reset(). */
  defaultParams?: Partial<TParams>
  initialPagination?: Partial<TablePaginationState>
  /** Display options only. Bind the returned pagination object without an additional onChange. */
  pagination?: Omit<
    TablePaginationConfig,
    | 'current'
    | 'defaultCurrent'
    | 'pageSize'
    | 'defaultPageSize'
    | 'total'
    | 'onChange'
    | 'onShowSizeChange'
    | 'onUpdate:current'
    | 'onUpdate:pageSize'
  >
  /** Skip only the initial request. Later actions, parameter changes, or reload still request. */
  manualRequest?: boolean
  /** Debounce query changes and table events. Explicit reload executes immediately. */
  debounceTime?: number
  /** Schedule the next refresh after the previous request settles, never concurrently. */
  polling?: MaybeRef<TableRequestPolling<TRecord>>
  /** Refresh when the document becomes visible. Does not submit query drafts. */
  revalidateOnFocus?: MaybeRefOrGetter<boolean>
  /** Continue polling while the document is hidden. Defaults to false. */
  pollingWhenHidden?: boolean
  /** Continue polling after an error. Defaults to false; reload/resume can retry. */
  pollingOnError?: boolean
  /** Defaults to true in this request helper; the base table's pagination policy is unchanged. */
  resetOnPageSizeChange?: boolean
  beforeSearchSubmit?: (params: Partial<TParams>) => Partial<TParams>
  postData?: (data: TRecord[]) => TRecord[]
  onLoad?: (data: TRecord[], response: TableRequestResult<TRecord>) => void
  onError?: (error: Error) => void
}

export interface UseTableRequestReturn<
  TRecord extends object,
  TParams extends object = Record<string, unknown>,
> {
  dataSource: ShallowRef<TRecord[]>
  loading: Readonly<Ref<boolean>>
  /** Automatic refresh after a successful load, without a blocking table spinner. */
  refreshing: Readonly<Ref<boolean>>
  /** Explicit pause state; document visibility is handled independently. */
  paused: Readonly<Ref<boolean>>
  error: ShallowRef<Error | null>
  pagination: ComputedRef<TablePaginationConfig>
  query: ComputedRef<Partial<TParams>>
  sort: ComputedRef<TableRequestSort>
  filters: ComputedRef<TableFiltersInfo>
  manual: Readonly<Required<TableManualConfig>>
  onChange: NonNullable<VTableEventProps<TRecord>['onChange']>
  /** Refresh immediately, sharing an identical running request. true also resets the page. */
  reload: (resetPageIndex?: boolean) => Promise<void>
  /** Replace the submitted query, reset to page one, and request even if values are unchanged. */
  submit: (params?: Partial<TParams>) => Promise<void>
  /** Restore defaults (or the supplied query), clear sort/filters, reset to page one, and request. */
  reset: (params?: Partial<TParams>) => Promise<void>
  cancel: () => void
  /** Stop automatic refresh and abort an automatic request, retaining manual requests. */
  pause: () => void
  /** Resume automatic refresh; optionally refresh immediately. Never starts a manual first load. */
  resume: (immediate?: boolean) => Promise<void>
}
