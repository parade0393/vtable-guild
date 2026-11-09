import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import type { TableProps } from '../types'

interface Row extends Record<string, unknown> {
  key: number
  name: string
}

const rows: Row[] = [
  { key: 1, name: 'Ada' },
  { key: 2, name: 'Grace' },
  { key: 3, name: 'Linus' },
]

const wrappers: VueWrapper[] = []
afterEach(() => {
  vi.useRealTimers()
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

function menu() {
  return document.querySelector<HTMLElement>('[role="menu"]')
}
function items() {
  return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]
}
function press(element: HTMLElement, key: string) {
  return new DOMWrapper(element).trigger('keydown', { key })
}

describe.each(['antdv', 'element-plus'] as const)('%s selections menu', (themePreset) => {
  function create(locale = 'en-US', rowSelection: TableProps<Row>['rowSelection'] = {}) {
    const wrapper = mount(VTable<Row>, {
      attachTo: document.body,
      props: {
        columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
        dataSource: rows,
        rowKey: 'key',
        rowSelection: { selections: true, ...rowSelection },
      },
      global: { plugins: [createVTableGuild({ themePreset, locale })] },
    })
    wrappers.push(wrapper)
    return wrapper.get<HTMLElement>('[aria-haspopup="menu"]')
  }

  it.each([
    { locale: 'zh-CN', label: '选择操作' },
    { locale: 'en-US', label: 'Selection options' },
  ])('names the focusable trigger and its menu in $locale', async ({ locale, label }) => {
    const trigger = create(locale)
    expect(trigger.attributes()).toMatchObject({
      role: 'button',
      tabindex: '0',
      'aria-label': label,
      'aria-expanded': 'false',
    })
    trigger.element.focus()
    expect(document.activeElement).toBe(trigger.element)

    await trigger.trigger('mouseenter')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(menu()?.getAttribute('aria-label')).toBe(label)
    expect(
      items().map((item) => [item.getAttribute('role'), item.getAttribute('tabindex')]),
    ).toEqual(Array.from({ length: 3 }, () => ['menuitem', '-1']))
  })

  it.each(['Enter', ' ', 'ArrowDown'])(
    'opens from the keyboard with %j and focuses the first item',
    async (key) => {
      const trigger = create()
      trigger.element.focus()
      await trigger.trigger('keydown', { key })
      expect(trigger.attributes('aria-expanded')).toBe('true')
      expect(document.activeElement).toBe(items()[0])
      expect(items()[0]!.textContent).toBe('Select all data')
    },
  )

  it('moves focus with arrow, Home and End keys and wraps at both ends', async () => {
    const trigger = create()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    const [first, second, last] = items()
    const steps: [string, HTMLElement | undefined][] = [
      ['ArrowDown', second],
      ['ArrowDown', last],
      ['ArrowDown', first],
      ['ArrowUp', last],
      ['Home', first],
      ['End', last],
      ['ArrowUp', second],
    ]
    for (const [key, expected] of steps) {
      await press(document.activeElement as HTMLElement, key)
      expect(document.activeElement).toBe(expected)
    }
  })

  it.each(['Enter', ' '])(
    'activates the focused item with %j, closes and refocuses the trigger',
    async (key) => {
      const onChange = vi.fn()
      const trigger = create('en-US', { onChange })
      await trigger.trigger('keydown', { key: 'Enter' })
      await press(items()[0]!, key)
      expect(onChange.mock.lastCall?.[0]).toEqual([1, 2, 3])
      expect(menu()).toBeNull()
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger.element)
    },
  )

  it('closes on Escape and returns focus to the trigger', async () => {
    const trigger = create()
    await trigger.trigger('keydown', { key: 'Enter' })
    await press(items()[1]!, 'Escape')
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })

  it.each([false, true])(
    'leaves the menu from the trigger on Tab (shift: %s)',
    async (shiftKey) => {
      const trigger = create()
      await trigger.trigger('keydown', { key: 'Enter' })
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      })
      items()[0]!.dispatchEvent(event)
      await nextTick()
      expect(menu()).toBeNull()
      expect(document.activeElement).toBe(trigger.element)
      // Forward Tab continues natively from the trigger; Shift+Tab stops there.
      expect(event.defaultPrevented).toBe(shiftKey)
    },
  )

  it('keeps hover opening and closing, and clicking only opens', async () => {
    vi.useFakeTimers()
    const trigger = create()
    await trigger.trigger('mouseenter')
    expect(menu()).not.toBeNull()
    expect(items()).not.toContain(document.activeElement)
    await trigger.trigger('mouseleave')
    const panel = new DOMWrapper(document.querySelector<HTMLElement>('.vtg-table-popup')!)
    await panel.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(150)
    expect(menu()).not.toBeNull()
    await panel.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(menu()).toBeNull()

    // A touch tap fires mouseenter before click; the click must not toggle the menu closed.
    await trigger.trigger('click')
    expect(menu()).not.toBeNull()
    await trigger.trigger('mouseenter')
    await trigger.trigger('click')
    expect(menu()).not.toBeNull()
  })

  it('moves focus into a hover-opened menu and keeps it open when the pointer leaves', async () => {
    vi.useFakeTimers()
    const trigger = create()
    await trigger.trigger('mouseenter')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items()[0])
    await trigger.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(document.activeElement).toBe(items()[0])
    await press(items()[0]!, 'Escape')
    expect(menu()).toBeNull()

    // Pointer behavior is restored once the keyboard-opened menu has closed.
    await trigger.trigger('mouseenter')
    await trigger.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(menu()).toBeNull()
  })
})
