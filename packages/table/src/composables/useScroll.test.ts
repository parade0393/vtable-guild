import { describe, expect, it } from 'vitest'
import { useScroll } from './useScroll'
import type { ColumnType } from '../types'

function createScrollElement({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 } = {}) {
  const element = document.createElement('div')

  Object.defineProperty(element, 'scrollLeft', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: scrollLeft,
  })

  Object.defineProperty(element, 'scrollWidth', {
    configurable: true,
    enumerable: true,
    value: scrollWidth,
  })

  Object.defineProperty(element, 'clientWidth', {
    configurable: true,
    enumerable: true,
    value: clientWidth,
  })

  return element
}

describe('useScroll', () => {
  it('computes fixed offsets for left and right fixed columns', () => {
    const columns: ColumnType<Record<string, unknown>>[] = [
      { key: 'name', width: 120, fixed: 'left' },
      { key: 'team', width: 80, fixed: 'left' },
      { key: 'age', width: 100 },
      { key: 'score', width: 90, fixed: 'right' },
      { key: 'status', width: 110, fixed: 'right' },
    ]

    const scroll = useScroll({
      displayColumns: () => columns,
    })

    expect(scroll.fixedOffsets.value.get('name')).toMatchObject({ left: 0, isLastLeft: false })
    expect(scroll.fixedOffsets.value.get('team')).toMatchObject({ left: 120, isLastLeft: true })
    expect(scroll.fixedOffsets.value.get('status')).toMatchObject({ right: 0, isFirstRight: false })
    expect(scroll.fixedOffsets.value.get('score')).toMatchObject({ right: 110, isFirstRight: true })
  })

  it('syncs header scroll position and scroll state', () => {
    const scroll = useScroll({
      displayColumns: () => [],
    })
    const header = createScrollElement()

    scroll.headerWrapRef.value = header
    scroll.syncHorizontalScroll(64, 160)

    expect(header.scrollLeft).toBe(64)
    expect(scroll.scrollState.value).toEqual({ atStart: false, atEnd: false })

    scroll.syncHorizontalScroll(160, 160)
    expect(scroll.scrollState.value).toEqual({ atStart: false, atEnd: true })
  })

  it('updates max scroll distance from body scroll metrics', () => {
    const scroll = useScroll({
      displayColumns: () => [],
    })
    const body = createScrollElement({ scrollLeft: 12, scrollWidth: 420, clientWidth: 180 })
    const header = createScrollElement()

    scroll.bodyWrapRef.value = body
    scroll.headerWrapRef.value = header
    scroll.handleBodyScroll({ scrollTop: 0, scrollLeft: 96 })

    expect(header.scrollLeft).toBe(96)
    expect(scroll.scrollState.value).toEqual({ atStart: false, atEnd: false })

    scroll.updateScrollState()
    expect(header.scrollLeft).toBe(12)
    expect(scroll.scrollState.value).toEqual({ atStart: false, atEnd: false })

    body.scrollLeft = 240
    scroll.updateScrollState()
    expect(scroll.scrollState.value).toEqual({ atStart: false, atEnd: true })
  })
})
