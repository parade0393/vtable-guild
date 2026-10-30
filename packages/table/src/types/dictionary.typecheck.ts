import { createTableDictionary, useTableDictionary } from '../index'
import type { TableDictionaryOption, UseTableDictionaryReturn } from './dictionary'

export const dictionary = createTableDictionary<{ country: string }>({
  key: 'cities',
  async request(params, { signal, keyword }) {
    const _country: string | undefined = params.country
    const _signal: AbortSignal = signal
    const _keyword: string = keyword
    void [_country, _signal, _keyword]
    return { options: [{ value: 1, label: 'City', status: 'success' }], complete: true }
  },
})
export function dictionaryContract(result: UseTableDictionaryReturn) {
  const _options: readonly TableDictionaryOption[] = result.options.value
  const _result: Promise<boolean> = result.search('city')
  void [_options, _result]
  // @ts-expect-error Loading is readonly.
  result.loading.value = false
  // @ts-expect-error Parameters preserve the dictionary's declared field types.
  useTableDictionary({ dictionary, params: { country: 1 } })
}
