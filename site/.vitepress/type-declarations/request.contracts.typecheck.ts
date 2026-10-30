import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './request'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

interface Row {
  key: number
  name: string
}
interface Query {
  keyword: string
}

export type RequestDeclarationContracts = [
  Assert<Equal<Docs.TableManualConfig, Public.TableManualConfig>>,
  Assert<Equal<Docs.TableRequestSort, Public.TableRequestSort>>,
  Assert<Equal<Docs.TableRequestParams<Query>, Public.TableRequestParams<Query>>>,
  Assert<Equal<Docs.TableRequestContext, Public.TableRequestContext>>,
  Assert<Equal<Docs.TableRequestResult<Row>, Public.TableRequestResult<Row>>>,
  Assert<Equal<Docs.TableRequest<Row, Query>, Public.TableRequest<Row, Query>>>,
  Assert<Equal<Docs.TableRequestPolling<Row>, Public.TableRequestPolling<Row>>>,
  Assert<Equal<Docs.UseTableRequestOptions<Row>, Public.UseTableRequestOptions<Row>>>,
  Assert<Equal<Docs.UseTableRequestOptions<Row, Query>, Public.UseTableRequestOptions<Row, Query>>>,
  Assert<Equal<Docs.UseTableRequestReturn<Row>, Public.UseTableRequestReturn<Row>>>,
  Assert<Equal<Docs.UseTableRequestReturn<Row, Query>, Public.UseTableRequestReturn<Row, Query>>>,
  Assert<
    Equal<Parameters<Docs.UseTableRequestReturn<Row, Query>['reset']>, [params?: Partial<Query>]>
  >,
]

export function requestResetContract(value: Docs.UseTableRequestReturn<Row, Query>) {
  const _defaultReset: Promise<void> = value.reset()
  const _explicitReset: Promise<void> = value.reset({ keyword: 'restored' })
  void [_defaultReset, _explicitReset]
  // @ts-expect-error Explicit reset parameters preserve the query field types.
  value.reset({ keyword: 42 })
}

export const manualProps: Public.VTablePublicProps<Row> = {
  columns: [{ key: 'name', dataIndex: 'name', sorter: true }],
  dataSource: [],
  manual: { sort: true, filter: true, pagination: true },
  pagination: { current: 2, pageSize: 10, total: 100 },
}
