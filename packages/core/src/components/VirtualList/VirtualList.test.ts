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

  it('resyncs horizontal position when the content width changes', async () => {
    const observers = installResizeObserverMock()
    const onVirtualScroll = vi.fn()
    const wrapper = mount(VirtualList, {
      props: {
        data: [{ key: 1 }],
        height: 80,
        itemHeight: 20,
        itemKey: 'key',
        scrollWidth: 600,
        onVirtualScroll,
      },
      slots: {
        default: () => h('div', { class: 'row' }, 'row'),
      },
      attachTo: document.body,
    })

    await flushVirtualList()

    const holder = wrapper.find('.vtg-virtual-list-holder').element as HTMLElement
    Object.defineProperty(holder, 'offsetWidth', { configurable: true, value: 200 })
    const holderObserver = observers.find((observer) =>
      observer.observe.mock.calls.some(([target]) => target === holder),
    )
    expect(holderObserver).toBeDefined()
    holderObserver?.callback(
      [{ target: holder } as unknown as ResizeObserverEntry],
      holderObserver as unknown as ResizeObserver,
    )
    await flushVirtualList()

    const list = wrapper.vm as unknown as ListRef
    list.scrollTo({ left: 100 })
    onVirtualScroll.mockClear()

    await wrapper.setProps({ scrollWidth: 500 })
    await flushVirtualList()

    expect(list.getScrollInfo().x).toBe(100)
    expect(onVirtualScroll).toHaveBeenLastCalledWith({ x: 100, y: 0 })

    // 上一次通知已经是 x=100；仅范围变化仍须通知，否则表头/边缘状态可能过期。
    onVirtualScroll.mockClear()
    await wrapper.setProps({ scrollWidth: 450 })
    await flushVirtualList()
    expect(list.getHorizontalRange()).toBe(250)
    expect(onVirtualScroll).toHaveBeenCalledExactlyOnceWith({ x: 100, y: 0 })

    list.scrollTo({ left: 300 })
    onVirtualScroll.mockClear()
    await wrapper.setProps({ scrollWidth: 250 })
    await flushVirtualList()

    expect(list.getScrollInfo().x).toBe(50)
    expect(onVirtualScroll).toHaveBeenLastCalledWith({ x: 50, y: 0 })

    onVirtualScroll.mockClear()
    await wrapper.setProps({ scrollWidth: 180 })
    await flushVirtualList()
    expect(list.getHorizontalRange()).toBe(0)
    expect(onVirtualScroll).toHaveBeenCalledExactlyOnceWith({ x: 0, y: 0 })

    wrapper.unmount()
  })

  it('measures the real row element rather than a fragment anchor', async () => {
    installResizeObserverMock()

    // 行实际高度带小数，且明显高于估算值——两者都是回归判据，见下方断言。
    const ROW_HEIGHT = 40.5
    const ITEM_HEIGHT = 20
    const data = Array.from({ length: 10 }, (_, key) => ({ key }))

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const height = this.classList.contains('row') ? ROW_HEIGHT : 0
      return {
        height,
        width: 0,
        top: 0,
        bottom: height,
        left: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect
    })

    const wrapper = mount(VirtualList, {
      props: { data, height: 100, itemHeight: ITEM_HEIGHT, itemKey: 'key' },
      slots: {
        default: ({ index }: { index: number }) => h('div', { class: 'row' }, String(index)),
      },
      attachTo: document.body,
    })

    await flushVirtualList()
    await flushVirtualList()

    const holder = wrapper.find('.vtg-virtual-list-holder').element
    const scrollHeight = parseFloat((holder.firstElementChild as HTMLElement).style.height)

    // 回归点一：useChildren 曾把 renderFunc 的返回值再包一层数组，Vue 把内层
    // 数组归一成 Fragment，Item 的 ref 于是落到 Fragment 的文本锚点上。
    // useHeights.getElement() 拿到 Text 返回 null，行高**永远测不到**，
    // scrollHeight 恒等于 行数 × itemHeight，末尾几行滚不到。
    expect(scrollHeight).toBeGreaterThan(data.length * ITEM_HEIGHT)

    // 回归点二：曾用 offsetHeight 测量，整数取整把每行的小数抹掉，
    // 误差在可视窗口内累加（实测 9 行约 2px），表现为滚到底时最后一行被裁。
    expect(Number.isInteger(scrollHeight)).toBe(false)

    wrapper.unmount()
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
