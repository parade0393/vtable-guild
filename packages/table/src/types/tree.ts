export interface TableTreeLoadContext {
  signal: AbortSignal
}

export type TableTreeLoadData<TRecord extends object> = (
  record: TRecord,
  context: TableTreeLoadContext,
) => Promise<TRecord[]>
