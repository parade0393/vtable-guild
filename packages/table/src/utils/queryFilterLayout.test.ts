import { describe, expect, it } from 'vitest'
import { getQueryFilterLayout } from './queryFilterLayout'

const fields = Array.from({ length: 5 }, () => ({ colSize: 1 }))

describe('QueryFilter layout', () => {
  it.each([
    [512, 'vertical', 24, 1],
    [513, 'vertical', 12, 1],
    [701, 'horizontal', 8, 2],
    [1352, 'horizontal', 6, 3],
  ])('resolves the default layout at %spx', (width, layout, span, count) => {
    const grid = getQueryFilterLayout(fields, { width, collapsed: true })
    expect(grid.layout).toBe(layout)
    expect(grid.fields).toHaveLength(count)
    expect(grid.fields[0]?.style.gridColumn).toBe(`1 / span ${span}`)
    expect(grid.actionStyle.gridColumn).toBe(`${25 - span} / span ${span}`)
    expect(grid.hiddenCount).toBe(fields.length - count)
  })

  it('keeps configured form direction and selects the matching explicit breakpoint', () => {
    const grid = getQueryFilterLayout(fields, {
      width: 550,
      layout: 'inline',
      span: { xs: 24, md: 8 },
      collapsed: true,
    })
    expect(grid.layout).toBe('inline')
    expect(grid.fields).toHaveLength(2)
  })

  it('counts occupied field units and clamps defaultColsNumber to one row', () => {
    const grid = getQueryFilterLayout([{ colSize: 2 }, ...fields], {
      width: 1400,
      collapsed: true,
      defaultColsNumber: 5,
    })
    expect(grid.fields.map(({ style }) => style.gridColumn)).toEqual(['1 / span 12', '13 / span 6'])
    expect(grid.actionStyle).toEqual({ gridColumn: '19 / span 6', gridRow: 1 })
  })

  it('allows more than one collapsed row through defaultFormItemsNumber', () => {
    const grid = getQueryFilterLayout(fields, {
      width: 1040,
      collapsed: true,
      defaultColsNumber: 1,
      defaultFormItemsNumber: 4,
      submitterColSpanProps: { span: 8, offset: 8 },
    })
    expect(grid.fields).toHaveLength(4)
    expect(grid.fields[2]?.endsRow).toBe(true)
    expect(grid.fields[3]?.style.gridRow).toBe(2)
    expect(grid.actionStyle).toEqual({ gridColumn: '17 / span 8', gridRow: 2 })
  })

  it('keeps an oversized first control visible and wraps the actions', () => {
    const grid = getQueryFilterLayout([{ colSize: 4 }, ...fields], {
      width: 1400,
      collapsed: true,
      defaultFormItemsNumber: 10,
    })
    expect(grid.fields).toHaveLength(1)
    expect(grid.canCollapse).toBe(true)
    expect(grid.actionStyle.gridRow).toBe(2)
  })

  it('uses the full row capacity when the action bar is hidden', () => {
    const grid = getQueryFilterLayout(fields, { width: 1400, collapsed: true, showActions: false })
    expect(grid.fields).toHaveLength(4)
  })
})
