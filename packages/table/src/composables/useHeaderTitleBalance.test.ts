import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, shallowRef, type Ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHeaderTitleBalance } from './useHeaderTitleBalance'

const wrappers: VueWrapper[] = []

function element(left: number, width: number, layoutWidth = 0) {
  const node = document.createElement('span')
  const rect = { left, width, right: left + width }
  const measure = vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => rect as DOMRect)
  Object.defineProperty(node, 'offsetWidth', { configurable: true, value: layoutWidth })
  return { node, rect, measure }
}

function control(width: number, marginLeft = 0, marginRight = 0) {
  const result = element(0, width)
  result.node.style.marginLeft = `${marginLeft}px`
  result.node.style.marginRight = `${marginRight}px`
  return result
}

function harness(
  inner: HTMLElement | null,
  title: HTMLElement | null,
  enabled = true,
  filter: HTMLElement | null = null,
  sort: HTMLElement | null = null,
) {
  const records: {
    targets: Set<Element>
    callback: () => void
    disconnect: ReturnType<typeof vi.fn>
  }[] = []
  const frames = new Map<number, FrameRequestCallback>()
  let frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets = new Set<Element>()
      disconnect = vi.fn(() => this.targets.clear())
      constructor(public callback: () => void) {
        records.push(this)
      }
      observe(target: Element) {
        this.targets.add(target)
      }
    },
  )
  const active = shallowRef(enabled)
  const innerRef = shallowRef(inner)
  const titleRef = shallowRef(title)
  const filterRef = shallowRef(filter)
  const sortRef = shallowRef(sort)
  let spacer!: Ref<number>
  const wrapper = mount(
    defineComponent({
      setup() {
        spacer = useHeaderTitleBalance(active, innerRef, titleRef, filterRef, sortRef)
        return () => h('div')
      },
    }),
  )
  wrappers.push(wrapper)
  return {
    wrapper,
    spacer,
    active,
    innerRef,
    titleRef,
    filterRef,
    sortRef,
    records,
    frames,
    resize() {
      records.at(-1)?.callback()
    },
    flush() {
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach((callback) => callback(0))
    },
  }
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.unstubAllGlobals()
})

describe('useHeaderTitleBalance', () => {
  it('observes filter growth even after the title has shrunk to zero width', () => {
    const inner = element(0, 80)
    const title = element(24, 0)
    const filter = control(56)
    const test = harness(inner.node, title.node, true, filter.node)
    expect(test.records[0]!.targets.has(filter.node)).toBe(true)
    expect(test.spacer.value).toBe(24)

    // 只有 filter 尺寸改变，inner/title 的尺寸和位置都不变。
    // 不能用标题右边界反推占用，否则会继续得到旧的 24px 占位。
    filter.rect.width = 64
    test.resize()
    test.flush()
    expect(title.rect.width).toBe(0)
    expect(test.spacer.value).toBe(16)
  })

  it('sums control margin boxes, including negative margins, and clears missing controls', async () => {
    const inner = element(100, 208)
    const title = element(100, 176)
    const filter = control(20, 4, -8)
    const sort = control(12, 4)
    const test = harness(inner.node, title.node, true, filter.node, sort.node)
    expect(test.spacer.value).toBe(32)
    expect(test.records[0]!.targets).toEqual(
      new Set([inner.node, title.node, filter.node, sort.node]),
    )

    filter.rect.width = 48
    test.resize()
    test.resize()
    expect(test.frames.size).toBe(1)
    test.flush()
    expect(test.spacer.value).toBe(60)

    // 控件消失，即使标题边界还未变化也不能保留推断的旧占位。
    test.filterRef.value = null
    test.sortRef.value = null
    await nextTick()
    expect(test.spacer.value).toBe(0)
  })

  it('does not measure or observe disabled layouts and disconnects when disabled', async () => {
    const inner = element(0, 208)
    const title = element(0, 176)
    const filter = control(32)
    const test = harness(inner.node, title.node, false, filter.node)
    expect(test.spacer.value).toBe(0)
    expect(test.records).toHaveLength(0)
    expect(inner.measure).not.toHaveBeenCalled()

    test.active.value = true
    await nextTick()
    expect(test.spacer.value).toBe(32)
    test.resize()
    test.active.value = false
    await nextTick()
    expect(test.spacer.value).toBe(0)
    expect(test.records[0]!.targets.size).toBe(0)
    expect(test.frames.size).toBe(0)
  })

  it('rebinds after tooltip replaces the title element and after refs disappear', async () => {
    const inner = element(0, 208)
    const title = element(0, 176)
    const filter = control(32)
    const test = harness(inner.node, title.node, true, filter.node)
    const replacement = element(0, 168)
    const replacementFilter = control(40)
    test.titleRef.value = replacement.node
    test.filterRef.value = replacementFilter.node
    await nextTick()
    expect(test.spacer.value).toBe(40)
    expect(test.records[0]!.targets.size).toBe(0)
    expect(test.records[1]!.targets).toEqual(
      new Set([inner.node, replacement.node, replacementFilter.node]),
    )

    test.innerRef.value = null
    await nextTick()
    expect(test.spacer.value).toBe(0)
    expect(test.records[1]!.targets.size).toBe(0)
  })

  it('clamps the spacer for narrow or hidden columns without pushing controls out', () => {
    const inner = element(0, 50)
    const title = element(0, 15)
    const filter = control(35)
    const test = harness(inner.node, title.node, true, filter.node)
    expect(test.spacer.value).toBe(15)

    inner.rect.width = 0
    test.resize()
    test.flush()
    expect(test.spacer.value).toBe(0)

    inner.rect.width = 50
    filter.rect.width = 60
    test.resize()
    test.flush()
    expect(test.spacer.value).toBe(0)
  })

  it('normalizes CSS scale while retaining unscaled fractional measurements', () => {
    const inner = element(100, 416, 208)
    const title = element(100, 352)
    const filter = control(40, 4, -8)
    const sort = control(24, 4)
    const test = harness(inner.node, title.node, true, filter.node, sort.node)
    expect(test.spacer.value).toBe(32)

    Object.defineProperty(inner.node, 'offsetWidth', { value: 209 })
    inner.rect.width = 208.5
    inner.rect.right = 308.5
    filter.rect.width = 20.25
    sort.rect.width = 12
    test.resize()
    test.flush()
    expect(test.spacer.value).toBe(32.25)
  })

  it('cancels queued measurements and releases observations on unmount', () => {
    const inner = element(0, 208)
    const title = element(0, 176)
    const filter = control(32)
    const test = harness(inner.node, title.node, true, filter.node)
    test.resize()
    expect(test.frames.size).toBe(1)
    test.wrapper.unmount()
    expect(test.frames.size).toBe(0)
    expect(test.records[0]!.targets.size).toBe(0)
    const calls = inner.measure.mock.calls.length
    test.records[0]!.callback()
    test.flush()
    expect(inner.measure).toHaveBeenCalledTimes(calls)
  })
})
