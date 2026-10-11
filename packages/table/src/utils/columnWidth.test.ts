import { describe, expect, it } from 'vitest'
import type { ColumnType } from '../types'
import {
  allocateFixedColumnWidths,
  normalizeMinWidth,
  parseColumnWidth,
  parseStylePxWidth,
  resolveColumnWidth,
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

  it('only counts actual pixels when no reference width is available', () => {
    expect(resolveDeclaredColumnWidth({ width: '50%' }, 0)).toBe(0)
    expect(resolveDeclaredColumnWidth({ width: '120.5px' }, 0)).toBe(120.5)
    expect(resolveDeclaredColumnWidth({ width: 'calc(100% - 20px)' }, 0)).toBe(0)
    expect(resolveDeclaredColumnWidth({ width: '25rem' }, 0)).toBe(0)
  })
})

describe('column width constraints', () => {
  it('retains explicit zero and ignores negative or non-finite lower bounds', () => {
    expect(normalizeMinWidth(0)).toBe(0)
    expect(normalizeMinWidth(160.5)).toBe(160.5)
    for (const invalid of [undefined, null, '160', -1, Number.NaN, Infinity, -Infinity]) {
      expect(normalizeMinWidth(invalid)).toBeUndefined()
    }
  })

  it('distinguishes unmeasurable widths from definite zero', () => {
    for (const value of [0, '0', '0px', '0%']) {
      expect(parseColumnWidth(value, 400)).toBe(0)
    }
    expect(parseColumnWidth('50%')).toBeUndefined()
    expect(parseColumnWidth('auto', 400, () => 300)).toBeUndefined()
    expect(parseColumnWidth('100')).toBeUndefined()
    expect(parseColumnWidth('12px trailing')).toBeUndefined()
    expect(parseColumnWidth(-1)).toBeUndefined()
    expect(parseColumnWidth('50%', 400)).toBe(200)
    expect(parseColumnWidth(' .5px ')).toBe(0.5)
  })

  it('delegates CSS expressions and content keywords using the stable reference', () => {
    const calls: [string, number][] = []
    const resolver = (value: string, reference: number) => {
      calls.push([value, reference])
      return value === 'calc(50% - 20px)' ? reference / 2 - 20 : 280
    }
    expect(parseColumnWidth('calc(50% - 20px)', 600, resolver)).toBe(280)
    expect(parseColumnWidth('max-content', 600, resolver)).toBe(280)
    expect(calls).toEqual([
      ['calc(50% - 20px)', 600],
      ['max-content', 600],
    ])
    expect(parseColumnWidth('1rem', 400, () => undefined)).toBeUndefined()
    expect(parseColumnWidth('1rem', 400, () => Number.NaN)).toBeUndefined()
  })

  it('clamps declarations and resize targets while leaving maxWidth to dragging', () => {
    const column: Col = { key: 'a', width: 60, minWidth: 100, maxWidth: 80 }
    expect(resolveColumnWidth(column, 0).targetWidth).toBe(100)
    expect(resolveColumnWidth(column, 0, { columnWidths: { a: 40 } })).toMatchObject({
      targetWidth: 100,
      resizedWidth: 100,
    })
    expect(resolveColumnWidth(column, 0, { columnWidths: { a: 200 } }).targetWidth).toBe(200)
    expect(column.width).toBe(60)
  })
})

describe('allocateFixedColumnWidths', () => {
  const columns: Col[] = [
    { key: 'a', minWidth: 160, resizable: true },
    { key: 'b', minWidth: 100 },
    { key: 'c', minWidth: 240, resizable: true },
  ]

  it('overflows when the lower bounds cannot fit the viewport', () => {
    const layout = allocateFixedColumnWidths(columns, { containerWidth: 400 })
    expect(layout.widths).toEqual([160, 100, 240])
    expect(layout.minWidth).toBe(500)
    expect(layout.totalWidth).toBe(500)
    expect(layout.overflow).toBe(true)
  })

  it('uses equal shares after freezing larger lower bounds', () => {
    expect(allocateFixedColumnWidths(columns, { containerWidth: 600 }).widths).toEqual([
      180, 180, 240,
    ])
    expect(allocateFixedColumnWidths(columns, { containerWidth: 900 }).widths).toEqual([
      300, 300, 300,
    ])
  })

  it('retains targets first and shrinks other flexible columns to their lower bounds', () => {
    const layout = allocateFixedColumnWidths(columns, {
      containerWidth: 400,
      columnWidths: { a: 300 },
    })
    expect(layout.widths).toEqual([300, 100, 240])
    expect(layout.totalWidth).toBe(640)
    expect(layout.columnWidths).toEqual({ a: 300 })
    expect(
      allocateFixedColumnWidths(columns, {
        containerWidth: 600,
        columnWidths: { a: 80 },
      }).widths,
    ).toEqual([160, 200, 240])
  })

  it('expands all definite targets proportionally and divides all-zero targets evenly', () => {
    const definite: Col[] = [{ width: 100 }, { width: '200px' }]
    expect(allocateFixedColumnWidths(definite, { containerWidth: 600 }).widths).toEqual([200, 400])
    expect(
      allocateFixedColumnWidths([{ width: 0 }, { width: 0 }], {
        containerWidth: 600,
      }).widths,
    ).toEqual([300, 300])
    expect(
      allocateFixedColumnWidths([{ width: 60, minWidth: 100 }, { width: 100 }], {
        containerWidth: 300,
      }).widths,
    ).toEqual([150, 150])
  })

  it('uses the stable target as the percentage reference, before lower bounds enlarge content', () => {
    const percentage: Col[] = [{ width: '80%', minWidth: 500 }, { width: '80%' }]
    const first = allocateFixedColumnWidths(percentage, { containerWidth: 400 })
    const second = allocateFixedColumnWidths(percentage, { containerWidth: 400 })
    expect(first.widths).toEqual([500, 320])
    expect(second.widths).toEqual(first.widths)
    expect(
      allocateFixedColumnWidths([{ width: '50%' }, {}], {
        containerWidth: 400,
        targetWidth: 800,
      }).widths,
    ).toEqual([400, 400])
  })

  it('releases stale constraints after column updates, hiding and reordering', () => {
    const overrides = { a: 80, removed: 1000 }
    expect(
      allocateFixedColumnWidths(columns, {
        containerWidth: 400,
        columnWidths: overrides,
      }).columnWidths,
    ).toEqual({ a: 160 })
    const changed = allocateFixedColumnWidths([{ key: 'c', minWidth: 80 }, { key: 'a' }], {
      containerWidth: 200,
      columnWidths: overrides,
    })
    expect(changed.widths).toEqual([120, 80])
    expect(changed.columnWidths).toEqual({ a: 80 })
    expect(changed.overflow).toBe(false)
    expect(overrides).toEqual({ a: 80, removed: 1000 })
  })

  it('does not invent layout defaults for columns without explicit lower bounds', () => {
    const layout = allocateFixedColumnWidths([{}, { minWidth: -1 }], { containerWidth: 40 })
    expect(layout.widths).toEqual([20, 20])
    expect(layout.minWidth).toBe(0)
    expect(layout.columns.every((column) => column.effectiveMinWidth === undefined)).toBe(true)
    expect(allocateFixedColumnWidths([], { containerWidth: 300 }).totalWidth).toBe(0)
  })

  it('keeps fractional widths and places the rounding remainder in the last share', () => {
    const layout = allocateFixedColumnWidths([{}, {}, {}], { containerWidth: 100 })
    expect(layout.widths[0]).toBeCloseTo(100 / 3, 12)
    expect(layout.widths[1]).toBeCloseTo(100 / 3, 12)
    expect(layout.totalWidth).toBeCloseTo(100, 12)
    expect(layout.widths.reduce((total, width) => total + width, 0)).toBe(layout.totalWidth)
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
