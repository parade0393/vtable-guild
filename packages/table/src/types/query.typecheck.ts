import { useTableQuery } from '../composables/useTableQuery'
import type { TableQueryFieldTransforms } from './query'

interface QueryValues {
  keyword: string
  range: [Date, Date] | undefined
}
interface QueryParams {
  keyword: string
  start: string
  end: string
}

export const queryFieldTransforms: TableQueryFieldTransforms<QueryValues, QueryParams> = {
  range: (range) => range && { start: range[0].toISOString(), end: range[1].toISOString() },
}

export function queryContract() {
  const query = useTableQuery<QueryValues, QueryParams>({
    defaultValues: { keyword: '', range: undefined },
    fieldTransforms: queryFieldTransforms,
    onSubmit: (params) => {
      const _start: string | undefined = params.start
      void _start
    },
  })
  const _result: Promise<boolean> = query.submit()
  const _keyword: string | undefined = query.submitted.value?.keyword
  void [_result, _keyword]
  // @ts-expect-error Draft values preserve their field types.
  query.draft.value.keyword = 42
  // @ts-expect-error Submitted snapshots cannot be reassigned.
  query.submitted.value = { keyword: '', range: undefined }
}
