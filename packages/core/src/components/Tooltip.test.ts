import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Tooltip from './Tooltip'

let wrapper: VueWrapper

beforeEach(() => {
  vi.useFakeTimers()
  wrapper = mount(Tooltip, {
    attachTo: document.body,
    props: { title: 'Hint' },
    slots: { default: () => h('button', 'Action') },
  })
})

afterEach(() => {
  wrapper.unmount()
  vi.useRealTimers()
})

function tooltip() {
  return document.querySelector('[role="tooltip"]')
}

async function advance(milliseconds = 100) {
  vi.advanceTimersByTime(milliseconds)
  await nextTick()
}

describe('Tooltip', () => {
  it('respects hover delays and cancels an enter when the pointer leaves early', async () => {
    const trigger = wrapper.get('span')
    await trigger.trigger('mouseenter')
    await advance(50)
    expect(tooltip()).toBeNull()
    await trigger.trigger('mouseleave')
    await advance()
    expect(tooltip()).toBeNull()

    await trigger.trigger('mouseenter')
    await advance()
    expect(tooltip()?.textContent).toBe('Hint')
    await trigger.trigger('mouseleave')
    await advance(50)
    expect(tooltip()).not.toBeNull()
    await advance(50)
    expect(tooltip()).toBeNull()
  })

  it('does not restore a stale hover after controlled suppression ends', async () => {
    const trigger = wrapper.get('span')
    await trigger.trigger('mouseenter')
    await advance()
    expect(tooltip()).not.toBeNull()

    await wrapper.setProps({ open: false })
    expect(tooltip()).toBeNull()
    await trigger.trigger('mouseleave')
    await advance()
    await wrapper.setProps({ open: undefined })
    expect(tooltip()).toBeNull()

    await trigger.trigger('mouseenter')
    await advance()
    expect(tooltip()).not.toBeNull()
    await trigger.trigger('mouseleave')
    await advance()
    expect(tooltip()).toBeNull()
  })

  it.each([50, 200])('cancels a pending hover when suppressed for %i ms', async (duration) => {
    await wrapper.get('span').trigger('mouseenter')
    await wrapper.setProps({ open: false })
    await advance(duration)
    await wrapper.setProps({ open: undefined })
    await advance()
    expect(tooltip()).toBeNull()
  })

  it('mounts inside the fullscreen element that contains its trigger', async () => {
    const container = document.createElement('section')
    document.body.append(container)
    container.append(wrapper.get('span').element)
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: container })
    try {
      await wrapper.get('span').trigger('mouseenter')
      await advance()
      expect(container.contains(tooltip())).toBe(true)

      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
      document.dispatchEvent(new Event('fullscreenchange'))
      await nextTick()
      expect(tooltip()).not.toBeNull()
      expect(container.contains(tooltip())).toBe(false)
    } finally {
      Reflect.deleteProperty(document, 'fullscreenElement')
      container.remove()
    }
  })

  it('flips to the opposite side only when the preferred side lacks room', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    )
    vi.stubGlobal('cancelAnimationFrame', () => {})
    try {
      const trigger = wrapper.get('span')
      const show = async (rect: DOMRect) => {
        trigger.element.getBoundingClientRect = () => rect
        await wrapper.setProps({ open: true })
        const element = tooltip() as HTMLElement
        element.getBoundingClientRect = () => new DOMRect(0, 0, 44, 34)
        await nextTick()
        frames.splice(0).forEach((frame) => frame(0))
        await nextTick()
        const top = parseFloat((tooltip() as HTMLElement).style.top)
        await wrapper.setProps({ open: false })
        return top
      }
      // 17px above the trigger cannot hold a 34px tooltip plus its 8px gap.
      expect(await show(new DOMRect(100, 17, 24, 24))).toBe(17 + 24 + 8)
      expect(await show(new DOMRect(100, 400, 24, 24))).toBe(400 - 34 - 8)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps explicit visibility controlled regardless of pointer events', async () => {
    const trigger = wrapper.get('span')
    await wrapper.setProps({ open: true })
    await trigger.trigger('mouseleave')
    await advance()
    expect(tooltip()).not.toBeNull()

    await wrapper.setProps({ open: false })
    await trigger.trigger('mouseenter')
    await advance()
    expect(tooltip()).toBeNull()
    await wrapper.setProps({ open: undefined })
    expect(tooltip()).toBeNull()
  })
})
