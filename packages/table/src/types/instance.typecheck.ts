import type { TableInstance, TableScrollToOptions } from './instance'

export function tableInstanceContract(table: TableInstance) {
  const options: TableScrollToOptions = { key: 'row', index: 2, align: 'top', offset: 8, left: 20 }
  const _located: Promise<boolean> = table.scrollTo(options)
  const _retry: Promise<boolean> = table.retryTreeLoad('row')
  const _error: Error | undefined = table.getTreeLoadError('row')
  void [_located, _retry, _error]
  // @ts-expect-error Align preserves the core virtual list positioning contract.
  table.scrollTo({ align: 'center' })
  // @ts-expect-error Row keys are stable strings or numbers.
  table.scrollTo({ key: true })
}
