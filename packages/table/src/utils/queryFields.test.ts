import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { deriveTableQueryFields } from './queryFields'
import { SELECTION_COLUMN } from '../constants'
import type { TableQueryColumn } from '../types/query-form'
import type { TableDictionaryBinding } from '../types/dictionary'

interface Values {
  keyword: string
  status: number
  range: string[]
  nested: string
  duplicate: string
}
describe('deriveTableQueryFields', () => {
  it('uses dictionary candidates from query or overrides while preserving explicit options', () => {
    const dictionary: TableDictionaryBinding = {
      options: [{ value: 2, label: 'Two' }],
      valueEnum: new Map([
        [1, 'One'],
        [2, 'Two'],
      ]),
      loading: false,
      error: null,
      search: async () => true,
    }
    const column: TableQueryColumn<Values> = {
      dataIndex: 'status',
      valueEnum: new Map([
        [1, 'One'],
        [2, 'Two'],
      ]),
      search: { dictionary },
    }
    expect(deriveTableQueryFields([column])[0]?.options).toBeUndefined()
    expect(
      deriveTableQueryFields([{ ...column, search: undefined }], { status: { dictionary } })[0]
        ?.options,
    ).toBeUndefined()

    const options = [{ value: 3, label: 'Explicit' }]
    expect(
      deriveTableQueryFields([{ ...column, search: { dictionary, options } }])[0]?.options,
    ).toBe(options)
    expect(deriveTableQueryFields([column], { status: { options } })[0]?.options).toBe(options)
    expect(
      deriveTableQueryFields([column], { status: { dictionary: undefined } })[0]?.options,
    ).toEqual([
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ])
  })

  it('keeps query visibility, order and control type separate from table fields', () => {
    const columns: TableQueryColumn<Values>[] = [
      SELECTION_COLUMN,
      { dataIndex: 'keyword', title: 'Keyword', visible: false, search: { order: 3 } },
      {
        dataIndex: 'status',
        title: 'Status',
        valueType: 'tag',
        valueEnum: new Map([[1, 'Enabled']]),
        search: { order: 1 },
      },
      { dataIndex: 'range', valueType: 'date', search: { valueType: 'dateRange', order: 2 } },
      { dataIndex: 'duplicate', search: false },
      {
        title: 'Group',
        children: [{ dataIndex: ['nested', 'value'], search: { name: 'nested' } }],
      },
    ]
    const fields = deriveTableQueryFields(columns)
    expect(fields.map((field) => field.name)).toEqual(['keyword', 'range', 'status', 'nested'])
    expect(fields.find((field) => field.name === 'status')).toMatchObject({
      valueType: 'select',
      options: [{ value: 1, label: 'Enabled' }],
    })
    expect(fields.find((field) => field.name === 'range')?.valueType).toBe('dateRange')
    expect(fields.find((field) => field.name === 'keyword')?.hidden).toBeUndefined()
  })
  it('honors explicit overrides, deduplicates effective names and leaves complex labels for custom slots', () => {
    const fields = deriveTableQueryFields<Values>(
      [
        { dataIndex: 'keyword', title: () => h('b', 'Name') },
        { dataIndex: 'status', valueEnum: { one: { text: h('b', 'One') } } },
        { dataIndex: ['nested', 'value'] },
        { dataIndex: 'duplicate' },
      ],
      { status: false, duplicate: { name: 'keyword' } },
    )
    expect(fields).toEqual([{ name: 'keyword', label: 'keyword', valueType: 'text' }])
  })
})
