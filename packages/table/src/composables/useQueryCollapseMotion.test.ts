import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useQueryCollapseMotion } from './useQueryCollapseMotion'

const wrappers: VueWrapper[] = []
const paintedHeights = new WeakMap<HTMLElement, number>()

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const naturalHeight = Number(
      this.dataset.testCollapsed === 'true'
        ? this.dataset.testCollapsedHeight
        : this.dataset.testExpandedHeight,
    )
    const height = this.hasAttribute('data-query-motion')
      ? (paintedHeights.get(this) ?? naturalHeight)
      : naturalHeight
    return new DOMRect(0, 0, 600, height)
  })
  vi.stubGlobal('getComputedStyle', (element: HTMLElement) => ({
    animationDuration: element.dataset.testDuration ?? '0.18s',
    animationDelay: element.dataset.testDelay ?? '0s',
  }))
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function createHost(
  initial: boolean | undefined,
  options: {
    collapsedHeight?: number
    expandedHeight?: number
    duration?: string
    delay?: string
  } = {},
) {
  const collapsed = ref<boolean | undefined>(initial)
  const root = ref<HTMLElement | null>(null)
  const rootKey = ref(0)
  const wrapper = mount(
    defineComponent({
      setup() {
        useQueryCollapseMotion(root, collapsed)
        return () =>
          h(
            'div',
            {
              ref: root,
              key: rootKey.value,
              'data-test-collapsed': String(collapsed.value),
              'data-test-collapsed-height': options.collapsedHeight ?? 80,
              'data-test-expanded-height': options.expandedHeight ?? 200,
              'data-test-duration': options.duration,
              'data-test-delay': options.delay,
            },
            h('button', 'Toggle'),
          )
      },
    }),
    { attachTo: document.body },
  )
  wrappers.push(wrapper)
  return { wrapper, collapsed, root, rootKey, initialTimerCount: vi.getTimerCount() }
}

async function finishUpdate() {
  await nextTick()
  await nextTick()
}

function finishAnimation(element: HTMLElement, name = 'vtg-query-collapse') {
  const event = new Event('animationend', { bubbles: true })
  Object.defineProperty(event, 'animationName', { value: name })
  element.dispatchEvent(event)
}

function expectIdle(element: HTMLElement) {
  expect(element.hasAttribute('data-query-motion')).toBe(false)
  expect(element.style.getPropertyValue('--vtg-query-motion-start-height')).toBe('')
  expect(element.style.getPropertyValue('--vtg-query-motion-end-height')).toBe('')
}

describe('query collapse motion', () => {
  it('animates actual expansion and collapse without replacing the form content', async () => {
    const { wrapper, collapsed, root, initialTimerCount } = createHost(true)
    const element = root.value!
    const button = wrapper.get('button').element
    expectIdle(element)

    collapsed.value = false
    await finishUpdate()
    expect(element.hasAttribute('data-query-motion')).toBe(true)
    expect(element.style.getPropertyValue('--vtg-query-motion-start-height')).toBe('80px')
    expect(element.style.getPropertyValue('--vtg-query-motion-end-height')).toBe('200px')
    expect(wrapper.get('button').element).toBe(button)
    finishAnimation(element)
    expectIdle(element)
    expect(vi.getTimerCount()).toBe(initialTimerCount)

    collapsed.value = true
    await finishUpdate()
    expect(element.style.getPropertyValue('--vtg-query-motion-start-height')).toBe('200px')
    expect(element.style.getPropertyValue('--vtg-query-motion-end-height')).toBe('80px')
    finishAnimation(element)
    expectIdle(element)
  })

  it('ignores child and unrelated animation completion events', async () => {
    const { wrapper, collapsed, root, initialTimerCount } = createHost(true)
    collapsed.value = false
    await finishUpdate()
    const element = root.value!

    finishAnimation(wrapper.get('button').element)
    finishAnimation(element, 'another-animation')
    expect(element.hasAttribute('data-query-motion')).toBe(true)
    finishAnimation(element)
    expectIdle(element)
    expect(vi.getTimerCount()).toBe(initialTimerCount)
  })

  it('starts a rapid reversal from the currently painted height', async () => {
    const { collapsed, root, initialTimerCount } = createHost(true)
    collapsed.value = false
    await finishUpdate()
    const element = root.value!
    paintedHeights.set(element, 135)

    collapsed.value = true
    await finishUpdate()
    expect(element.style.getPropertyValue('--vtg-query-motion-start-height')).toBe('135px')
    expect(element.style.getPropertyValue('--vtg-query-motion-end-height')).toBe('80px')
    expect(vi.getTimerCount()).toBe(initialTimerCount + 1)
    finishAnimation(element)
    expectIdle(element)
  })

  it('does not animate initial rendering or LightFilter state changes', async () => {
    const { collapsed, root, initialTimerCount } = createHost(undefined)
    await finishUpdate()
    expectIdle(root.value!)

    collapsed.value = false
    await finishUpdate()
    expectIdle(root.value!)
    collapsed.value = undefined
    await finishUpdate()
    expectIdle(root.value!)
    expect(vi.getTimerCount()).toBe(initialTimerCount)
  })

  it.each([{ expandedHeight: 80 }, { duration: '0s' }])(
    'keeps natural layout when no animation is needed: %o',
    async (options) => {
      const { collapsed, root, initialTimerCount } = createHost(true, options)
      collapsed.value = false
      await finishUpdate()
      expectIdle(root.value!)
      expect(vi.getTimerCount()).toBe(initialTimerCount)
    },
  )

  it('restores natural layout if the browser never sends animationend', async () => {
    const { collapsed, root, initialTimerCount } = createHost(true, {
      duration: '180ms',
      delay: '40ms',
    })
    collapsed.value = false
    await finishUpdate()
    const element = root.value!

    await vi.advanceTimersByTimeAsync(200)
    expect(element.hasAttribute('data-query-motion')).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    expectIdle(element)
    expect(vi.getTimerCount()).toBe(initialTimerCount)
  })

  it('cleans a replaced root and cancels animation work captured before replacement', async () => {
    const { collapsed, root, rootKey, initialTimerCount } = createHost(true)
    const initialRoot = root.value!
    collapsed.value = false
    await finishUpdate()
    expect(initialRoot.hasAttribute('data-query-motion')).toBe(true)

    rootKey.value++
    await finishUpdate()
    expect(root.value).not.toBe(initialRoot)
    expectIdle(initialRoot)
    expectIdle(root.value!)
    expect(vi.getTimerCount()).toBe(initialTimerCount)

    const previousRoot = root.value!
    collapsed.value = true
    rootKey.value++
    await finishUpdate()
    expect(root.value).not.toBe(previousRoot)
    expectIdle(previousRoot)
    expectIdle(root.value!)
    expect(vi.getTimerCount()).toBe(initialTimerCount)

    collapsed.value = false
    await finishUpdate()
    const currentRoot = root.value!
    finishAnimation(initialRoot)
    finishAnimation(previousRoot)
    expect(currentRoot.hasAttribute('data-query-motion')).toBe(true)
    finishAnimation(currentRoot)
    expectIdle(currentRoot)
  })

  it('cleans active animation and pending DOM updates on disposal', async () => {
    const active = createHost(true)
    active.collapsed.value = false
    await finishUpdate()
    const element = active.root.value!
    active.wrapper.unmount()
    expectIdle(element)
    expect(vi.getTimerCount()).toBe(active.initialTimerCount)

    const pending = createHost(true)
    const pendingElement = pending.root.value!
    pending.collapsed.value = false
    await nextTick()
    pending.wrapper.unmount()
    await finishUpdate()
    expectIdle(pendingElement)
    expect(vi.getTimerCount()).toBe(pending.initialTimerCount)
  })
})
