import { describe, expect, it } from 'vitest'
import { getByDataIndex, useColumns } from './useColumns'
import type { ColumnsType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  status: string
  profile: {
    age: number
    city: string
  }
}

describe('getByDataIndex', () => {
  const record: DemoRow = {
    key: '1',
    name: 'Ada',
    status: 'active',
    profile: {
      age: 28,
      city: 'London',
    },
  }

  it('reads flat and nested values', () => {
    expect(getByDataIndex(record, 'name')).toBe('Ada')
    expect(getByDataIndex(record, ['profile', 'age'])).toBe(28)
    expect(getByDataIndex(record, ['profile', 'city'])).toBe('London')
  })

  it('returns undefined for empty or missing paths', () => {
    expect(getByDataIndex(record, undefined)).toBeUndefined()
    expect(getByDataIndex(record, '')).toBeUndefined()
    expect(getByDataIndex(record, ['profile', 'zip'])).toBeUndefined()
  })
})

describe('useColumns', () => {
  it('flattens nested groups and builds header metadata', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'User',
        key: 'user',
        children: [
          { title: 'Name', key: 'name', dataIndex: 'name' },
          {
            title: 'Profile',
            key: 'profile',
            children: [
              { title: 'Age', key: 'age', dataIndex: ['profile', 'age'] },
              { title: 'City', key: 'city', dataIndex: ['profile', 'city'] },
            ],
          },
        ],
      },
      { title: 'Status', key: 'status', dataIndex: 'status' },
    ]

    const { leafColumns, headerRows } = useColumns(() => columns)

    expect(leafColumns.value.map((column) => column.key)).toEqual(['name', 'age', 'city', 'status'])
    expect(headerRows.value).toHaveLength(3)

    const topRow = headerRows.value[0]
    const secondRow = headerRows.value[1]
    const thirdRow = headerRows.value[2]

    expect(topRow.map((cell) => cell.column.key)).toEqual(['user', 'status'])
    expect(topRow[0]).toMatchObject({ colSpan: 3, rowSpan: 1, colStart: 0, colEnd: 2 })
    expect(topRow[1]).toMatchObject({ colSpan: 1, rowSpan: 3, colStart: 3, colEnd: 3 })

    expect(secondRow.map((cell) => cell.column.key)).toEqual(['name', 'profile'])
    expect(secondRow[0]).toMatchObject({ colSpan: 1, rowSpan: 2, colStart: 0, colEnd: 0 })
    expect(secondRow[1]).toMatchObject({ colSpan: 2, rowSpan: 1, colStart: 1, colEnd: 2 })

    expect(thirdRow.map((cell) => cell.column.key)).toEqual(['age', 'city'])
    expect(thirdRow[0]).toMatchObject({ colSpan: 1, rowSpan: 1, colStart: 1, colEnd: 1 })
    expect(thirdRow[1]).toMatchObject({ colSpan: 1, rowSpan: 1, colStart: 2, colEnd: 2 })
  })

  it('respects explicit colSpan overrides on grouped columns', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Profile',
        key: 'profile',
        colSpan: 4,
        children: [
          { title: 'Age', key: 'age', dataIndex: ['profile', 'age'] },
          { title: 'City', key: 'city', dataIndex: ['profile', 'city'] },
        ],
      },
    ]

    const { headerRows } = useColumns(() => columns)

    expect(headerRows.value[0][0]).toMatchObject({ colSpan: 4, colStart: 0, colEnd: 3 })
  })
})
