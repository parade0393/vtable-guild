import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, type VNode } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TablePopup from './TablePopup'

type PopupProps = Partial<InstanceType<typeof TablePopup>['$props']>
const wrappers = new Set<VueWrapper>()
const cleanups: (() => void)[] = []

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.clear()
  cleanups.splice(0).forEach((cleanup) => cleanup())
})

function geometry(element: HTMLElement, rect: DOMRect, values: Record<string, number> = {}) {
  element.getBoundingClientRect = () => rect
  Object.entries(values).forEach(([key, value]) => {
    Object.defineProperty(element, key, { configurable: true, value })
  })
}

function host(overflow = 'visible') {
  const element = document.createElement('div')
  element.style.position = 'relative'
  element.style.overflowX = overflow
  element.style.overflowY = overflow
  document.body.append(element)
  return element
}

async function popup(props: PopupProps = {}, content: () => VNode = () => h('button', 'Action')) {
  const anchor = props.anchor ?? document.createElement('button')
  if (!anchor.isConnected) document.body.append(anchor)
  const wrapper = mount(TablePopup, {
    attachTo: document.body,
    props: { open: true, anchor, ...props },
    slots: { default: content },
  })
  wrappers.add(wrapper)
  await nextTick()
  const panel = document.querySelector<HTMLElement>('.vtg-table-popup')!
  return { wrapper, anchor, panel }
}

function escape(target: HTMLElement) {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

describe('popup placement', () => {
  it('allows a popup to overflow a short, narrow mount container with visible overflow', async () => {
    const container = host()
    const anchor = document.createElement('button')
    container.append(anchor)
    geometry(container, new DOMRect(100, 100, 100, 36), {
      clientLeft: 3,
      clientTop: 2,
      clientWidth: 94,
      clientHeight: 32,
      scrollLeft: 7,
      scrollTop: 20,
    })
    geometry(anchor, new DOMRect(123, 102, 32, 32))
    const { panel } = await popup({
      anchor,
      getPopupContainer: () => container,
      panelRef: (element) => {
        if (element) {
          geometry(element, new DOMRect(0, 0, 160, 180), {
            offsetWidth: 160,
            offsetHeight: 180,
            clientHeight: 180,
            scrollHeight: 180,
          })
        }
      },
    })

    expect(container.contains(panel)).toBe(true)
    expect(panel.style.position).toBe('absolute')
    expect(panel.style.left).toBe('27px')
    expect(panel.style.top).toBe('56px')
    expect(parseFloat(panel.style.maxWidth)).toBeGreaterThanOrEqual(160)
    expect(parseFloat(panel.style.maxHeight)).toBeGreaterThanOrEqual(180)
  })

  it.each(['hidden', 'auto'])('keeps a popup inside an overflow:%s container', async (overflow) => {
    const container = host(overflow)
    container.style.border = '3px solid'
    const anchor = document.createElement('button')
    container.append(anchor)
    geometry(container, new DOMRect(100, 100, 206, 186), {
      clientLeft: 3,
      clientTop: 3,
      clientWidth: 200,
      clientHeight: 180,
      scrollLeft: 17,
      scrollTop: 23,
    })
    geometry(anchor, new DOMRect(263, 239, 32, 32))
    const { panel } = await popup({
      anchor,
      getPopupContainer: () => container,
      panelRef: (element) => {
        if (element) {
          geometry(element, new DOMRect(0, 0, 320, 220), {
            offsetWidth: 320,
            offsetHeight: 220,
            clientHeight: 220,
            scrollHeight: 220,
          })
        }
      },
    })

    expect(panel.style.left).toBe('17px')
    expect(panel.style.top).toBe('23px')
    expect(panel.style.maxWidth).toBe('200px')
    expect(panel.style.maxHeight).toBe('132px')
    expect(panel.style.transformOrigin).toBe('bottom center')
  })
})

describe('popup container in browser fullscreen', () => {
  function fullscreen(element: Element | null) {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: element })
    document.dispatchEvent(new Event('fullscreenchange'))
  }
  afterEach(() => Reflect.deleteProperty(document, 'fullscreenElement'))

  it('mounts inside the fullscreen element that contains the trigger, and follows exits', async () => {
    const container = host()
    const anchor = document.createElement('button')
    container.append(anchor)
    fullscreen(container)
    const { panel } = await popup({ anchor })
    expect(container.contains(panel)).toBe(true)
    expect(panel.style.position).toBe('absolute')

    fullscreen(null)
    await nextTick()
    const moved = document.querySelector<HTMLElement>('.vtg-table-popup')!
    expect(container.contains(moved)).toBe(false)
    expect(moved.style.position).toBe('fixed')
  })

  it('keeps body for triggers outside the fullscreen element and an explicit container', async () => {
    const container = host()
    const other = host()
    fullscreen(other)
    const outside = await popup()
    expect(other.contains(outside.panel)).toBe(false)
    expect(outside.panel.style.position).toBe('fixed')
    outside.wrapper.unmount()
    wrappers.delete(outside.wrapper)

    const anchor = document.createElement('button')
    other.append(anchor)
    const explicit = await popup({ anchor, getPopupContainer: () => container })
    expect(container.contains(explicit.panel)).toBe(true)
  })
})

describe('popup Escape handling', () => {
  it.each(['panel', 'trigger'])(
    'dismisses from the %s before outer dialogs receive Escape',
    async (source) => {
      const container = host()
      const anchor = document.createElement('span')
      const focusAnchor = document.createElement('button')
      anchor.append(focusAnchor)
      container.append(anchor)
      const outerKeydown = vi.fn()
      const documentKeydown = vi.fn()
      container.addEventListener('keydown', outerKeydown)
      document.addEventListener('keydown', documentKeydown)
      cleanups.push(() => document.removeEventListener('keydown', documentKeydown))
      const { wrapper, panel } = await popup({
        anchor,
        focusAnchor,
        getPopupContainer: () => container,
      })
      const action = panel.querySelector('button')!
      action.focus()

      const event = escape(source === 'panel' ? action : focusAnchor)

      expect(wrapper.emitted('dismiss')).toEqual([['escape']])
      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(focusAnchor)
      expect(outerKeydown).not.toHaveBeenCalled()
      expect(documentKeydown).not.toHaveBeenCalled()
    },
  )

  it.each(['preventDefault', 'stopPropagation'] as const)(
    'lets nested controls consume Escape with %s',
    async (method) => {
      const { wrapper, panel } = await popup({}, () =>
        h('button', { onKeydown: (event: KeyboardEvent) => event[method]() }, 'Nested control'),
      )
      const action = panel.querySelector('button')!
      action.focus()
      escape(action)

      expect(wrapper.emitted('dismiss')).toBeUndefined()
      expect(document.activeElement).toBe(action)
    },
  )

  it('preserves panel keydown callbacks and lets them prevent Escape dismissal', async () => {
    const onKeydown = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const { wrapper, panel } = await popup({ panelAttrs: { onKeydown } })
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    escape(panel)

    expect(onKeydown.mock.calls.map(([event]) => event.key)).toEqual(['ArrowDown', 'Escape'])
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  it.each(['close', 'unmount'])('removes trigger handling on %s', async (operation) => {
    const { wrapper, anchor } = await popup()
    if (operation === 'close') await wrapper.setProps({ open: false })
    else {
      wrapper.unmount()
      wrappers.delete(wrapper)
    }

    expect(escape(anchor).defaultPrevented).toBe(false)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  it('moves Escape handling when the active trigger and panel change', async () => {
    const { wrapper, anchor } = await popup({ panelKey: 'columns' })
    const nextAnchor = document.createElement('button')
    document.body.append(nextAnchor)
    await wrapper.setProps({ anchor: nextAnchor, panelKey: 'density' })
    await nextTick()
    expect(escape(anchor).defaultPrevented).toBe(false)
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    escape(document.querySelector<HTMLElement>('.vtg-table-popup button')!)

    expect(wrapper.emitted('dismiss')).toEqual([['escape']])
    expect(document.activeElement).toBe(nextAnchor)
  })
})
