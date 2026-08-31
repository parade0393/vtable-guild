import { describe, expect, it } from 'vitest'
import { applyColumnOrder, filterVisibleColumns } from './useColumnDisplay'
import { EXPAND_COLUMN, SELECTION_COLUMN } from '../constants'
import type { ColumnsType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  age: number
}

const leaf = (key: string) => ({ title: key, key, dataIndex: key })

describe('filterVisibleColumns', () => {
  it('drops leaf columns with visible: false', () => {
    const columns: ColumnsType<DemoRow> = [
      leaf('name'),
      { ...leaf('age'), visible: false },
      leaf('key'),
    ]
    expect(filterVisibleColumns(columns).map((column) => (column as { key: string }).key)).toEqual([
      'name',
      'key',
    ])
  })

  it('keeps columns without an explicit visible field', () => {
    const columns: ColumnsType<DemoRow> = [{ ...leaf('name'), visible: true }, leaf('age')]
    expect(filterVisibleColumns(columns)).toHaveLength(2)
  })

  it('drops a group that is hidden itself', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'User',
        key: 'user',
        visible: false,
        children: [leaf('name'), leaf('age')],
      },
      leaf('key'),
    ]
    const result = filterVisibleColumns(columns)
    expect(result).toHaveLength(1)
    expect((result[0] as { key: string }).key).toBe('key')
  })

  it('drops a group whose children are all hidden', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'User',
        key: 'user',
        children: [{ ...leaf('name'), visible: false }],
      },
      leaf('key'),
    ]
    const result = filterVisibleColumns(columns)
    expect(result).toHaveLength(1)
  })

  it('keeps a group with at least one visible child and filters its children', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'User',
        key: 'user',
        children: [{ ...leaf('name'), visible: false }, leaf('age')],
      },
    ]
    const result = filterVisibleColumns(columns)
    expect(result).toHaveLength(1)
    const group = result[0] as { key: string; children: ColumnsType<DemoRow> }
    expect(group.key).toBe('user')
    expect(group.children.map((column) => (column as { key: string }).key)).toEqual(['age'])
  })

  it('passes sentinels through untouched', () => {
    const columns: ColumnsType<DemoRow> = [
      SELECTION_COLUMN,
      { ...leaf('name'), visible: false },
      EXPAND_COLUMN,
    ]
    const result = filterVisibleColumns(columns)
    expect(result).toEqual([SELECTION_COLUMN, EXPAND_COLUMN])
  })
})

describe('applyColumnOrder', () => {
  const columns: ColumnsType<DemoRow> = [leaf('a'), leaf('b'), leaf('c'), leaf('d')]

  it('returns the same array when order is undefined or empty', () => {
    expect(applyColumnOrder(columns, undefined)).toBe(columns)
    expect(applyColumnOrder(columns, [])).toBe(columns)
  })

  it('orders matched columns first and appends the rest in original order', () => {
    const keys = (list: ColumnsType<DemoRow>) =>
      list.map((column) => (column as { key: string }).key)
    expect(keys(applyColumnOrder(columns, ['c', 'a']))).toEqual(['c', 'a', 'b', 'd'])
  })

  it('takes the first occurrence for duplicated keys in order', () => {
    const keys = (list: ColumnsType<DemoRow>) =>
      list.map((column) => (column as { key: string }).key)
    expect(keys(applyColumnOrder(columns, ['d', 'd', 'a']))).toEqual(['d', 'a', 'b', 'c'])
  })

  it('keeps keyless columns in the unmatched group', () => {
    const keyless: ColumnsType<DemoRow> = [
      { title: 'NoKey' },
      { title: 'A', key: 'a', dataIndex: 'name' },
      { title: 'B', key: 'b', dataIndex: 'age' },
    ]
    const result = applyColumnOrder(keyless, ['b', 'a'])
    expect(result[0]).toBe(keyless[2])
    expect(result[1]).toBe(keyless[1])
    expect(result[2]).toBe(keyless[0])
  })

  it('pins selection and expand columns to the front', () => {
    const withSentinels: ColumnsType<DemoRow> = [
      leaf('a'),
      { title: '选择', key: '__vtg_selection__' },
      leaf('b'),
    ]
    const result = applyColumnOrder(withSentinels, ['b', 'a'], ['__vtg_selection__'])
    expect((result[0] as { key: string }).key).toBe('__vtg_selection__')
    expect((result[1] as { key: string }).key).toBe('b')
    expect((result[2] as { key: string }).key).toBe('a')
  })

  it('ignores order entries that do not match any column', () => {
    const keys = (list: ColumnsType<DemoRow>) =>
      list.map((column) => (column as { key: string }).key)
    expect(keys(applyColumnOrder(columns, ['ghost', 'b']))).toEqual(['b', 'a', 'c', 'd'])
  })
})
