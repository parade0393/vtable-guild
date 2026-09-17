import { describe, expect, it } from 'vitest'
import type { ColumnType } from '../types'
import {
  parseStylePxWidth,
  resolveDeclaredColumnWidth,
  sumDeclaredColumnWidths,
} from './columnWidth'

type Col = ColumnType<Record<string, unknown>>

describe('resolveDeclaredColumnWidth', () => {
  it('prefers resized width over the declared number', () => {
    const column: Col = { key: 'name', width: 120 }
    expect(resolveDeclaredColumnWidth(column, 0, { name: 50 })).toBe(50)
    expect(resolveDeclaredColumnWidth(column, 0)).toBe(120)
  })

  it('falls back to the column index when the column has no key', () => {
    const column: Col = { title: 'Unnamed', width: 90 }
    expect(resolveDeclaredColumnWidth(column, 3, { '3': 40 })).toBe(40)
  })

  it('treats auto / empty / non-positive values as 0', () => {
    expect(resolveDeclaredColumnWidth({ key: 'a', width: 'auto' }, 0)).toBe(0)
    expect(resolveDeclaredColumnWidth({ key: 'a' }, 0)).toBe(0)
    expect(resolveDeclaredColumnWidth({ key: 'a', width: 0 }, 0)).toBe(0)
    expect(resolveDeclaredColumnWidth({ key: 'a', width: -8 }, 0)).toBe(0)
  })
})

describe('sumDeclaredColumnWidths', () => {
  it('sums declared numeric widths and applies resize overrides', () => {
    const columns: Col[] = [
      { key: 'a', width: 160 },
      { key: 'b', width: 100 },
      { key: 'c', width: 260 },
    ]
    expect(sumDeclaredColumnWidths(columns)).toBe(520)
    expect(sumDeclaredColumnWidths(columns, { b: 50, c: 90 })).toBe(300)
  })
})

describe('parseStylePxWidth', () => {
  it('parses a px inline width and rejects other CSS values', () => {
    expect(parseStylePxWidth('20600px')).toBe(20600)
    expect(parseStylePxWidth(' 480.5px ')).toBe(480.5)
    expect(parseStylePxWidth('100%')).toBe(0)
    expect(parseStylePxWidth('max-content')).toBe(0)
    expect(parseStylePxWidth(undefined)).toBe(0)
  })
})
