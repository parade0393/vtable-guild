import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, h, nextTick, ref } from 'vue'
import useMobileTouchMove from './useMobileTouchMove'

type InertiaCallback = (
  isHorizontal: boolean,
  offset: number,
  smoothOffset: boolean,
  e?: Event,
) => boolean

/** happy-dom 下没有可用的 Touch 构造，直接造 Event 再挂 touches。 */
function fireTouch(el: HTMLElement, type: string, pageX: number, pageY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', {
    value: [{ pageX, pageY, identifier: 0 }],
    configurable: true,
  })
  el.dispatchEvent(event)
  return event
}

function setup(callback: InertiaCallback) {
  const listRef = ref<HTMLElement>()
  const inVirtual = computed(() => true)
  const wrapper = mount({
    setup() {
      useMobileTouchMove(inVirtual, listRef, callback)
      return () =>
        h('div', {
          class: 'list',
          ref: (el: unknown) => {
            listRef.value = el as HTMLElement
          },
        })
    },
  })
  return { wrapper, el: () => listRef.value as HTMLElement }
}

/** 手指向下移动 10px 后松开：offsetY = 0 - 10 = -10，进入负方向惯性。 */
function flingDownwards(el: HTMLElement) {
  fireTouch(el, 'touchstart', 0, 0)
  fireTouch(el, 'touchmove', 0, 10)
  fireTouch(el, 'touchend', 0, 10)
}

describe('useMobileTouchMove', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // 回归：判停用的是 Math.floor 之后的 offset。衰减中的负数取整后会锁在 -1
  // （Math.floor(-0.05) === -1），|offset| 永远 > 0.1，惯性每 16ms 空转一次
  // 直到组件卸载。必须按未取整的浮点幅值判停。
  it('lets a negative-direction fling decay to a stop', async () => {
    const offsets: number[] = []
    const { wrapper, el } = setup((_isHorizontal, offset) => {
      offsets.push(offset)
      return true
    })
    await nextTick()

    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    flingDownwards(el())

    // 幅值从 10 衰减到 0.1：10 × (14/15)^n <= 0.1 → n ≈ 72 帧。给足余量后必须停稳。
    for (let tick = 0; tick < 400; tick += 1) vi.advanceTimersByTime(16)

    expect(clearSpy).toHaveBeenCalled()
    // 帧数有界 —— 旧实现在 400 tick 后会攒下近 400 帧且从未清理
    expect(offsets.length).toBeLessThan(120)
    expect(offsets.length).toBeGreaterThan(50)

    wrapper.unmount()
  })

  it('stops inertia as soon as the scroll position stops moving', async () => {
    const offsets: number[] = []
    let inertiaFrames = 0
    const { wrapper, el } = setup((_isHorizontal, offset, smoothOffset) => {
      offsets.push(offset)
      if (smoothOffset) {
        inertiaFrames += 1
        // 表体已经贴边：这一步滚不动了
        return false
      }
      return true
    })
    await nextTick()

    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    flingDownwards(el())
    vi.advanceTimersByTime(16)

    // 第一个惯性帧就发现没滚动，应当立即收手，不再空转到幅值衰减完
    expect(inertiaFrames).toBe(1)
    expect(offsets).toHaveLength(2) // 一次 touchmove + 一个惯性帧
    expect(clearSpy).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('keeps returning true for live finger drags so preventDefault still fires', async () => {
    const results: boolean[] = []
    const { wrapper, el } = setup((_isHorizontal, _offset, smoothOffset) => {
      results.push(true)
      // 与 VirtualList 的用法一致：只有惯性帧才可能返回 false
      return smoothOffset ? false : true
    })
    await nextTick()

    fireTouch(el(), 'touchstart', 0, 0)
    const move = fireTouch(el(), 'touchmove', 0, 10)

    expect(results).toEqual([true])
    expect(move.defaultPrevented).toBe(true)

    wrapper.unmount()
  })

  it('does not keep inerting after unmount', async () => {
    const offsets: number[] = []
    const { wrapper, el } = setup((_isHorizontal, offset) => {
      offsets.push(offset)
      return true
    })
    await nextTick()

    flingDownwards(el())
    wrapper.unmount()

    const before = offsets.length
    vi.advanceTimersByTime(500)

    expect(offsets).toHaveLength(before)
  })
})
