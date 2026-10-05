import { afterEach, describe, expect, it } from 'vitest'
import { getPopupPositionStyle, getPopupVerticalBoundary } from './popupPosition'

const anchorRect = { top: 10, left: 100, right: 140, bottom: 40 }

function createContainer({
  left = 0,
  top = 0,
  right = 800,
  clientWidth = 800,
  scrollTop = 0,
  scrollLeft = 0,
} = {}) {
  const el = document.createElement('div')
  el.getBoundingClientRect = () =>
    ({ left, top, right, bottom: 600, width: right - left, height: 600 }) as DOMRect
  Object.defineProperty(el, 'clientWidth', { value: clientWidth })
  Object.defineProperty(el, 'scrollTop', { value: scrollTop })
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft })
  return el
}

describe('getPopupVerticalBoundary', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('intersects nested clipping ancestors with the viewport and ignores visible overflow', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    const visible = document.createElement('div')
    const trigger = document.createElement('button')
    outer.style.overflowY = 'auto'
    inner.style.overflowY = 'clip'
    visible.style.overflowY = 'visible'
    outer.getBoundingClientRect = () => new DOMRect(0, 100, 800, window.innerHeight)
    inner.getBoundingClientRect = () => new DOMRect(0, 50, 800, 300)
    visible.getBoundingClientRect = () => new DOMRect(0, 200, 800, 32)
    document.body.append(outer)
    outer.append(inner)
    inner.append(visible)
    visible.append(trigger)
    expect(getPopupVerticalBoundary(trigger)).toEqual({ top: 100, bottom: 350 })
    inner.style.overflowY = 'visible'
    expect(getPopupVerticalBoundary(trigger)).toEqual({ top: 100, bottom: window.innerHeight })
    outer.style.overflowY = 'visible'
    expect(getPopupVerticalBoundary(trigger)).toEqual({ top: 0, bottom: window.innerHeight })
  })
})

describe('getPopupPositionStyle', () => {
  it('uses clipping bounds before converting to a custom container coordinate system', () => {
    const container = createContainer({ top: 50, scrollTop: 20 })
    const rect = { ...anchorRect, top: 250, bottom: 282 }
    expect(
      getPopupPositionStyle(rect, container, 100, 136, { top: 50, bottom: 300 }),
    ).toMatchObject({
      position: 'absolute',
      top: '80px',
      maxHeight: '196px',
      transformOrigin: 'bottom center',
    })
  })

  it('flips a measured popup above the anchor near the viewport bottom', () => {
    const bottom = window.innerHeight - 10
    const rect = { ...anchorRect, top: bottom - 32, bottom }
    expect(getPopupPositionStyle(rect, document.body, 100, 136)).toMatchObject({
      top: `${rect.top - 140}px`,
      transformOrigin: 'bottom center',
    })
  })

  it('keeps a measured popup below when it fits and constrains a tall popup', () => {
    expect(getPopupPositionStyle(anchorRect, 'body', 100, 136)).toMatchObject({
      top: '44px',
      transformOrigin: 'top center',
    })
    const middle = window.innerHeight / 2
    const rect = { ...anchorRect, top: middle - 16, bottom: middle + 16 }
    expect(getPopupPositionStyle(rect, 'body', 100, window.innerHeight)).toMatchObject({
      top: `${rect.bottom + 4}px`,
      maxHeight: `${window.innerHeight - rect.bottom - 4}px`,
    })
  })

  it('converts flipped coordinates to the custom scrolling container', () => {
    const container = createContainer({ top: 20, scrollTop: 30 })
    const bottom = window.innerHeight - 10
    const rect = { ...anchorRect, top: bottom - 32, bottom }
    expect(getPopupPositionStyle(rect, container, 100, 136)).toMatchObject({
      position: 'absolute',
      top: `${rect.top - 140 - 20 + 30}px`,
      transformOrigin: 'bottom center',
    })
  })

  it('positions fixed below the anchor when mounted to body', () => {
    const style = getPopupPositionStyle(anchorRect, 'body', 150)

    expect(style).toMatchObject({
      position: 'fixed',
      top: '44px',
      left: '100px',
      zIndex: '1050',
    })
  })

  it('right-aligns when the popup would overflow the viewport', () => {
    const nearRightEdge = {
      top: 10,
      left: window.innerWidth - 20,
      right: window.innerWidth - 4,
      bottom: 40,
    }
    const style = getPopupPositionStyle(nearRightEdge, 'body', 150)

    expect(style.position).toBe('fixed')
    expect(style.right).toBe('4px')
    expect(style.left).toBeUndefined()
  })

  it('positions absolute with scroll offsets inside a custom container', () => {
    const container = createContainer({ left: 50, top: 20, scrollTop: 30, scrollLeft: 5 })
    const style = getPopupPositionStyle(anchorRect, container, 150)

    expect(style).toMatchObject({
      position: 'absolute',
      // bottom(40) - containerTop(20) + scrollTop(30) + 4
      top: '54px',
      // left(100) - containerLeft(50) + scrollLeft(5)
      left: '55px',
      zIndex: '1050',
    })
  })

  it('right-aligns inside a narrow custom container', () => {
    const container = createContainer({ left: 0, right: 200, clientWidth: 200 })
    const style = getPopupPositionStyle(anchorRect, container, 150)

    expect(style.position).toBe('absolute')
    // containerRight(200) - anchorRight(140) + scrollLeft(0)
    expect(style.right).toBe('60px')
    expect(style.left).toBeUndefined()
  })
})
