import { describe, expect, it } from 'vitest'
import { resolvePaginationLayout } from './paginationLayout'

describe('resolvePaginationLayout', () => {
  it.each([
    ['antdv', ['total', 'prev', 'pager', 'next', 'sizes', 'jumper']],
    ['element-plus', ['total', 'sizes', 'prev', 'pager', 'next', 'jumper']],
  ] as const)('keeps the %s default order when layout is omitted', (preset, items) => {
    expect(resolvePaginationLayout(undefined, preset)).toEqual({
      mode: 'inline',
      regions: [{ name: 'inline', items }],
      warnings: [],
    })
  })

  it.each(['antdv', 'element-plus'] as const)(
    'preserves an explicit readonly layout for %s without mutating it',
    (preset) => {
      const slot = Object.freeze({ slot: 'selection' })
      const layout = Object.freeze(['sizes', slot, 'next', 'pager', 'prev'] as const)

      expect(resolvePaginationLayout(layout, preset)).toEqual({
        mode: 'inline',
        regions: [{ name: 'inline', items: layout }],
        warnings: [],
      })
      expect(layout).toEqual(['sizes', { slot: 'selection' }, 'next', 'pager', 'prev'])
    },
  )

  it('preserves left-to-right order and leaves omitted regions empty', () => {
    const layout = Object.freeze({ right: Object.freeze(['next', 'pager', 'prev'] as const) })

    expect(resolvePaginationLayout(layout, 'antdv')).toEqual({
      mode: 'split',
      regions: [
        { name: 'left', items: [] },
        { name: 'right', items: ['next', 'pager', 'prev'] },
      ],
      warnings: [],
    })
    expect(resolvePaginationLayout({ left: ['total'] }, 'antdv').regions).toEqual([
      { name: 'left', items: ['total'] },
      { name: 'right', items: [] },
    ])
  })

  it.each([[], {}, { left: [] }, { right: [] }, { left: [], right: [] }])(
    'keeps an explicit empty layout empty: %j',
    (layout) => {
      const resolved = resolvePaginationLayout(layout, 'element-plus')
      expect(resolved.regions.flatMap(({ items }) => items)).toEqual([])
      expect(resolved.warnings).toEqual([])
    },
  )

  it.each([null, false, 42, 'total,prev,pager,next', () => [], new Date(0)])(
    'falls back for an invalid top-level value: %s',
    (layout) => {
      const resolved = resolvePaginationLayout(layout, 'element-plus')
      const defaults = resolvePaginationLayout(undefined, 'element-plus')
      expect(resolved.mode).toBe(defaults.mode)
      expect(resolved.regions).toEqual(defaults.regions)
      expect(resolved.warnings).toHaveLength(1)
      expect(resolved.warnings[0]).toContain('using the preset default layout')
    },
  )

  it.each([
    { left: null, right: ['prev'] },
    { left: ['next'], right: 'pager' },
    { left: {}, right: ['pager'] },
    { right: false },
  ])('falls back for the entire layout if a region is invalid: %j', (layout) => {
    const resolved = resolvePaginationLayout(layout, 'antdv')
    expect(resolved.regions).toEqual(resolvePaginationLayout(undefined, 'antdv').regions)
    expect(resolved.warnings).toHaveLength(1)
    expect(resolved.warnings[0]).toContain('must be an array when provided')
  })

  it('reports both invalid regions before falling back', () => {
    const resolved = resolvePaginationLayout({ left: 'prev', right: 'next' }, 'antdv')
    expect(resolved.warnings).toHaveLength(2)
    expect(resolved.warnings[0]).toContain('pagination.layout.left')
    expect(resolved.warnings[1]).toContain('pagination.layout.right')
  })

  it.each([{ lefts: [] }, { left: ['total'], middle: [] }])(
    'falls back when a region name is misspelled or unsupported: %j',
    (layout) => {
      const resolved = resolvePaginationLayout(layout, 'antdv')
      expect(resolved.regions).toEqual(resolvePaginationLayout(undefined, 'antdv').regions)
      expect(resolved.warnings).toHaveLength(1)
      expect(resolved.warnings[0]).toContain('unknown region')
    },
  )

  it('keeps the first built-in and named slot across the whole layout', () => {
    const resolved = resolvePaginationLayout(
      {
        left: ['prev', { slot: 'selection' }, 'total', { slot: 'total' }, 'prev'],
        right: [{ slot: 'selection' }, 'prev', 'pager', 'total', 'next', { slot: 'refresh' }],
      },
      'antdv',
    )

    expect(resolved.regions).toEqual([
      { name: 'left', items: ['prev', { slot: 'selection' }, 'total', { slot: 'total' }] },
      { name: 'right', items: ['pager', 'next', { slot: 'refresh' }] },
    ])
    expect(resolved.warnings).toHaveLength(3)
    expect(new Set(resolved.warnings).size).toBe(3)
    expect(resolved.warnings.join('\n')).toContain('repeats slot "selection"')
    expect(resolved.warnings.join('\n')).toContain('repeats "prev"')
    expect(resolved.warnings.join('\n')).toContain('repeats "total"')
  })

  it('deduplicates inline controls and slots independently', () => {
    const resolved = resolvePaginationLayout(
      ['pager', { slot: 'pager' }, 'pager', { slot: 'pager' }],
      'antdv',
    )
    expect(resolved.regions[0]?.items).toEqual(['pager', { slot: 'pager' }])
    expect(resolved.warnings).toHaveLength(2)
  })

  it('skips invalid items and deduplicates each warning without discarding valid content', () => {
    const resolved = resolvePaginationLayout(
      [
        'unknown',
        'unknown',
        '->',
        'slot',
        null,
        1,
        {},
        [],
        { slot: '' },
        { slot: ' \n\t ' },
        { slot: 42 },
        'next',
        { slot: 'refresh' },
      ],
      'antdv',
    )
    expect(resolved.regions[0]?.items).toEqual(['next', { slot: 'refresh' }])
    expect(resolved.warnings).toHaveLength(5)
    expect(new Set(resolved.warnings).size).toBe(5)
  })

  it('does not fall back when all array entries are invalid', () => {
    const resolved = resolvePaginationLayout(['unknown', null, { slot: ' ' }], 'antdv')
    expect(resolved.mode).toBe('inline')
    expect(resolved.regions).toEqual([{ name: 'inline', items: [] }])
    expect(resolved.warnings).toHaveLength(3)
  })

  it('uses the supplied non-blank slot name verbatim', () => {
    const resolved = resolvePaginationLayout([{ slot: ' refresh ' }], 'antdv')
    expect(resolved.regions[0]?.items).toEqual([{ slot: ' refresh ' }])
    expect(resolved.warnings).toEqual([])
  })
})
