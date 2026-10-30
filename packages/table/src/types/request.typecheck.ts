import type { UseTableRequestOptions, UseTableRequestReturn } from './request'

interface RequestRow {
  key: number
  name: string
}
interface Query {
  keyword: string
}

export const requestOptions: UseTableRequestOptions<RequestRow, Query> = {
  params: () => ({ keyword: 'members' }),
  defaultParams: { keyword: '' },
  polling: (rows) => (rows.length ? 5000 : false),
  revalidateOnFocus: true,
  request: async (params, sort, filters, { signal }) => {
    const _page: number = params.current
    const _size: number = params.pageSize
    const _keyword: string | undefined = params.keyword
    const _order: 'ascend' | 'descend' = sort.name
    const _values: (string | number | boolean)[] | null = filters.enabled
    const _signal: AbortSignal = signal
    void [_page, _size, _keyword, _order, _values, _signal]
    return { data: [{ key: 1, name: 'Member' }], total: 1 }
  },
  postData: (rows) => rows.map((row) => ({ ...row, name: row.name.toUpperCase() })),
}

export function requestReturnContract(value: UseTableRequestReturn<RequestRow, Query>) {
  const _page: number | undefined = value.pagination.value.current
  const _row: RequestRow | undefined = value.dataSource.value[0]
  const _result: Promise<void> = value.submit({ keyword: 'query' })
  const _manual: boolean = value.manual.sort
  const _refreshing: boolean = value.refreshing.value
  const _resumed: Promise<void> = value.resume(true)
  void [_page, _row, _result, _manual, _refreshing, _resumed]
  // @ts-expect-error Submitted query fields preserve their declared types.
  value.submit({ keyword: 42 })
  // @ts-expect-error Request loading is derived and cannot be assigned by consumers.
  value.loading.value = false
}

export const invalidPaginationCallback: UseTableRequestOptions<RequestRow, Query> = {
  request: async () => ({ data: [], total: 0 }),
  pagination: {
    // @ts-expect-error The helper owns the event entry point; duplicate pagination handlers are excluded.
    onChange: () => {},
  },
}
