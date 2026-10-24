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
