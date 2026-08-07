import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VirtualList, { getMeasuredVisibleRange, type ListRef } from './VirtualList'

interface ResizeObserverRecord {
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  callback: ResizeObserverCallback
}

function installResizeObserverMock() {
  const records: ResizeObserverRecord[] = []

  class ResizeObserverMock {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      records.push(this)
    }
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })

  return records
}

async function flushVirtualList() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('VirtualList', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return document.body
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (HTMLElement.prototype as unknown as { offsetParent?: Element }).offsetParent
  })

  it('uses measured dynamic heights to locate the visible range', () => {
    const heights = [20, 20, 20, 20, 20, 80, 30, 30, 30, 30, 30, 30]

    const range = getMeasuredVisibleRange({
      dataLength: heights.length,
      offsetTop: 140,
      height: 100,
      itemHeight: 20,
      getItemHeight: (index) => heights[index],
    })

    expect(range).toEqual({
      scrollHeight: 360,
      start: 5,
      end: 9,
      offset: 100,
    })
  })
  it('keeps large estimated lists scoped to the viewport plus overscan', async () => {
    installResizeObserverMock()
    const data = Array.from({ length: 10000 }, (_, key) => ({ key }))

    const wrapper = mount(VirtualList, {
      props: {
        data,
        height: 120,
        itemHeight: 20,
        itemKey: 'key',
      },
      slots: {
        default: ({ index }: { index: number }) => h('div', { class: 'row' }, String(index)),
      },
      attachTo: document.body,
    })

    await flushVirtualList()
    await (wrapper.vm as unknown as ListRef).scrollTo(4000)
    await flushVirtualList()

    const visibleRows = wrapper.findAll('.row').map((row) => Number(row.text()))
    expect(visibleRows[0]).toBe(200)
    expect(visibleRows.at(-1)).toBe(207)
    expect(visibleRows.length).toBeLessThan(20)
  })

  it('skips all row measurement when disableHeightMeasure is set', async () => {
    const data = Array.from({ length: 10000 }, (_, key) => ({ key }))

    async function mountAndCountObservedElements(disableHeightMeasure: boolean) {
      const observers = installResizeObserverMock()
      const wrapper = mount(VirtualList, {
        props: { data, height: 120, itemHeight: 20, itemKey: 'key', disableHeightMeasure },
        slots: {
          default: ({ index }: { index: number }) => h('div', { class: 'row' }, String(index)),
        },
        attachTo: document.body,
      })
      await flushVirtualList()

      await (wrapper.vm as unknown as ListRef).scrollTo(4000)
      await flushVirtualList()

      const visibleRows = wrapper.findAll('.row').map((row) => Number(row.text()))
      wrapper.unmount()
      return { observerCount: observers.length, visibleRows }
    }

    const measured = await mountAndCountObservedElements(false)
    const fixed = await mountAndCountObservedElements(true)

    // 实测路径有三个 ResizeObserver：容器、Filler、以及 useHeights 的逐行测量器。
    // 快路径下第三个**根本不被创建**——这是判据：没有测量就没有 heights 缓存，
    // 可视区计算永远走 O(1) 估算分支，不再每次滚动重建整表前缀和。
    expect(measured.observerCount).toBe(3)
    expect(fixed.observerCount).toBe(2)

    // 而且快路径必须给出与实测路径一致的可视区，不能为了快而算错。
    expect(fixed.visibleRows[0]).toBe(200)
    expect(fixed.visibleRows).toEqual(measured.visibleRows)
  })

  it('disconnects holder resize observer on unmount', async () => {
    const observers = installResizeObserverMock()
    const data = Array.from({ length: 5 }, (_, key) => ({ key }))

    const wrapper = mount(VirtualList, {
      props: {
        data,
        height: 60,
        itemHeight: 20,
        itemKey: 'key',
      },
      slots: {
        default: ({ index }: { index: number }) => h('div', { class: 'row' }, String(index)),
      },
      attachTo: document.body,
    })

    await flushVirtualList()
    const observedObservers = observers.filter((observer) => observer.observe.mock.calls.length > 0)
    expect(observedObservers.length).toBeGreaterThan(0)

    wrapper.unmount()

    expect(observedObservers.some((observer) => observer.disconnect.mock.calls.length > 0)).toBe(
      true,
    )
  })
})
