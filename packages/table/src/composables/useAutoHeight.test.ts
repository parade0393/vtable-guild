import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, shallowRef, watch, type Ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useAutoHeight, type UseAutoHeightReturn } from './useAutoHeight'

interface Harness {
  component: VueWrapper
  result: UseAutoHeightReturn
  targets: Set<Element>
  wrapperRef: Ref<HTMLElement | null>
  headerRef: Ref<HTMLElement | null>
  summaryRef: Ref<HTMLElement | null>
  enabledRef: Ref<boolean>
  hasDataRef: Ref<boolean>
  triggerResize: () => void
  runFrame: () => void
}

/**
 * ResizeObserver + rAF stub（与 useColumnMetrics.test 同一套路）。
 * options 的各 getter 挂在真实 Vue ref 上：ref 换绑 / 启停都要经过
 * flush: 'post' 的 watch 才算真正覆盖到生产路径。
 */
function mountAutoHeight(initial: {
  wrapper: HTMLElement
  header?: HTMLElement | null
  summary?: HTMLElement | null
  enabled?: boolean
  hasData?: boolean
}): Harness {
  const targets = new Set<Element>()
  let onResize = () => {}
  let onFrame: FrameRequestCallback | undefined
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    onFrame = callback
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        onResize = callback
      }
      observe(target: Element) {
        targets.add(target)
      }
      unobserve(target: Element) {
        targets.delete(target)
      }
      disconnect() {
        targets.clear()
      }
    },
  )

  const harness = {} as Harness

  harness.targets = targets
  harness.triggerResize = () => onResize()
  harness.runFrame = () => onFrame?.(0)

  harness.component = mount(
    defineComponent({
      setup() {
        const wrapperRef = ref<HTMLElement | null>(initial.wrapper)
        const headerRef = ref<HTMLElement | null>(initial.header ?? null)
        const summaryRef = ref<HTMLElement | null>(initial.summary ?? null)
        const enabledRef = shallowRef(initial.enabled ?? true)
        const hasDataRef = shallowRef(initial.hasData ?? true)
        Object.assign(harness, {
          wrapperRef,
          headerRef,
          summaryRef,
          enabledRef,
          hasDataRef,
        })
        harness.result = useAutoHeight({
          enabled: () => enabledRef.value,
          wrapperEl: () => wrapperRef.value,
          headerEl: () => headerRef.value,
          summaryEl: () => summaryRef.value,
          hasData: () => hasDataRef.value,
        })
        return () => h('div')
      },
    }),
  )

  return harness
}

function mockRect(el: HTMLElement, height: number) {
  vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => ({ height }) as DOMRect)
}

describe('useAutoHeight', () => {
  it('measures synchronously on mount and deducts header and fixed summary heights', () => {
    const wrapper = document.createElement('div')
    const header = document.createElement('div')
    const summary = document.createElement('div')
    mockRect(wrapper, 600)
    mockRect(header, 55)
    mockRect(summary, 47)

    const harness = mountAutoHeight({ wrapper, header, summary })
    try {
      // 挂载即测：不依赖 ResizeObserver 的首次回调时机（那要等下一渲染帧）。
      expect(harness.result.bodyHeight.value).toBe(498)
      expect(harness.targets.has(wrapper)).toBe(true)
      expect(harness.targets.has(header)).toBe(true)
      expect(harness.targets.has(summary)).toBe(true)

      // 父区域 / 表头变化后重算（浏览器缩放、窗口拖拽走的就是这条 RO 路径）。
      mockRect(wrapper, 700)
      harness.triggerResize()
      harness.runFrame()
      expect(harness.result.bodyHeight.value).toBe(598)

      mockRect(header, 80)
      harness.triggerResize()
      harness.runFrame()
      expect(harness.result.bodyHeight.value).toBe(573)
    } finally {
      harness.component.unmount()
    }
    expect(harness.targets.size).toBe(0)
    vi.unstubAllGlobals()
  })

  it('does not deduct a missing header or summary', () => {
    const wrapper = document.createElement('div')
    mockRect(wrapper, 600)

    const harness = mountAutoHeight({ wrapper })
    try {
      expect(harness.result.bodyHeight.value).toBe(600)
    } finally {
      harness.component.unmount()
    }
    vi.unstubAllGlobals()
  })

  it('clamps zero-height containers to the minimum viewport', () => {
    const wrapper = document.createElement('div')
    const header = document.createElement('div')
    mockRect(wrapper, 0)
    mockRect(header, 55)

    const harness = mountAutoHeight({ wrapper, header })
    try {
      // 0 会让 core VirtualList 的 falsy 检查静默关闭窗口化、全量渲染行。
      expect(harness.result.bodyHeight.value).toBe(1)
    } finally {
      harness.component.unmount()
    }
    vi.unstubAllGlobals()
  })

  it('dedupes sub-pixel jitter and updates on real changes', () => {
    const wrapper = document.createElement('div')
    mockRect(wrapper, 600)

    const harness = mountAutoHeight({ wrapper })
    let emissions = 0
    const stopWatch = watch(
      harness.result.bodyHeight,
      () => {
        emissions += 1
      },
      // 同步计数：断言在 runFrame 后立刻发生，等不到默认的 pre 队列。
      { flush: 'sync' },
    )
    try {
      // 挂载赋值发生在 watch 注册之前，这里计数为 0。
      expect(harness.result.bodyHeight.value).toBe(600)
      expect(emissions).toBe(0)

      // 599.6 与 600 相差 0.4（≤ 0.5 epsilon）但 floor 后是 599：去重必须拦下它。
      mockRect(wrapper, 599.6)
      harness.triggerResize()
      harness.runFrame()
      expect(harness.result.bodyHeight.value).toBe(600)
      expect(emissions).toBe(0)

      mockRect(wrapper, 580)
      harness.triggerResize()
      harness.runFrame()
      expect(harness.result.bodyHeight.value).toBe(580)
      expect(emissions).toBe(1)
    } finally {
      stopWatch()
      harness.component.unmount()
    }
    vi.unstubAllGlobals()
  })

  it('resets when disabled and re-observes when re-enabled', async () => {
    const wrapper = document.createElement('div')
    mockRect(wrapper, 600)

    const harness = mountAutoHeight({ wrapper })
    try {
      expect(harness.result.bodyHeight.value).toBe(600)

      harness.enabledRef.value = false
      await nextTick()
      expect(harness.result.bodyHeight.value).toBeUndefined()
      expect(harness.targets.size).toBe(0)

      harness.enabledRef.value = true
      await nextTick()
      expect(harness.result.bodyHeight.value).toBe(600)
      expect(harness.targets.has(wrapper)).toBe(true)
    } finally {
      harness.component.unmount()
    }
    expect(harness.targets.size).toBe(0)
    vi.unstubAllGlobals()
  })

  it('rebinds the observer when the header element is swapped', async () => {
    const wrapper = document.createElement('div')
    const headerA = document.createElement('div')
    mockRect(wrapper, 600)
    mockRect(headerA, 55)

    const harness = mountAutoHeight({ wrapper, header: headerA })
    try {
      expect(harness.result.bodyHeight.value).toBe(545)

      const headerB = document.createElement('div')
      mockRect(headerB, 80)
      harness.headerRef.value = headerB
      await nextTick()
      expect(harness.targets.has(headerB)).toBe(true)

      mockRect(wrapper, 700)
      harness.triggerResize()
      harness.runFrame()
      expect(harness.result.bodyHeight.value).toBe(620)
    } finally {
      harness.component.unmount()
    }
    expect(harness.targets.size).toBe(0)
    vi.unstubAllGlobals()
  })

  it('warns only after consecutive visible zero-height measurements with data', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = document.createElement('div')
    const header = document.createElement('div')
    mockRect(wrapper, 0)
    mockRect(header, 55)
    vi.spyOn(wrapper, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)

    const harness = mountAutoHeight({ wrapper, header })
    try {
      // 挂载即第一次可见的零高测量（streak 1），不告警。
      expect(warnSpy).not.toHaveBeenCalled()

      harness.triggerResize()
      harness.runFrame()
      // 连续第二次仍无可用高度 → 提示高度链配置问题。
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain("scroll.y: 'auto'")
    } finally {
      harness.component.unmount()
      warnSpy.mockRestore()
    }
    vi.unstubAllGlobals()
  })

  it('does not warn without data or for hidden containers', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = document.createElement('div')
    const header = document.createElement('div')
    mockRect(wrapper, 0)
    mockRect(header, 55)
    vi.spyOn(wrapper, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)

    // 无数据：空表格容器矮是正常的，不提示配置问题。
    const emptyHarness = mountAutoHeight({ wrapper, header, hasData: false })
    try {
      for (let i = 0; i < 3; i += 1) {
        emptyHarness.triggerResize()
        emptyHarness.runFrame()
      }
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      emptyHarness.component.unmount()
    }

    // display:none：rects 为空（隐藏 tab、折叠面板），同样不告警。
    const hiddenWrapper = document.createElement('div')
    mockRect(hiddenWrapper, 0)
    vi.spyOn(hiddenWrapper, 'getClientRects').mockReturnValue([] as unknown as DOMRectList)
    const hiddenHarness = mountAutoHeight({ wrapper: hiddenWrapper, header })
    try {
      for (let i = 0; i < 3; i += 1) {
        hiddenHarness.triggerResize()
        hiddenHarness.runFrame()
      }
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      hiddenHarness.component.unmount()
      warnSpy.mockRestore()
    }
    vi.unstubAllGlobals()
  })
})
