import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useColumnMetrics, type UseColumnMetricsReturn } from './useColumnMetrics'

describe('useColumnMetrics', () => {
  it('remeasures a shrinking header table even when the viewport and column declarations stay unchanged', () => {
    const wrap = document.createElement('div')
    wrap.innerHTML =
      '<table><thead><tr><th data-vtg-leaf-col="0"></th><th data-vtg-leaf-col="1"></th></tr></thead></table>'
    const table = wrap.querySelector('table')!
    const widths = [100, 100]
    wrap.querySelectorAll('th').forEach((cell, index) => {
      vi.spyOn(cell, 'getBoundingClientRect').mockImplementation(
        () => ({ width: widths[index] }) as DOMRect,
      )
    })
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
    let result!: UseColumnMetricsReturn
    const component = mount(
      defineComponent({
        setup() {
          result = useColumnMetrics({
            enabled: () => true,
            hasHeader: () => true,
            headerEl: () => wrap,
            columns: () => [
              { key: 'a', width: 100 },
              { key: 'b', width: 100 },
            ],
            columnWidths: reactive({}),
          })
          return () => h('div')
        },
      }),
    )
    try {
      onFrame?.(0)
      expect(result.metrics.value).toEqual({ widths: [100, 100], total: 200 })
      expect(targets.has(wrap)).toBe(true)
      expect(targets.has(table)).toBe(true)
      for (const width of [80, 60, 50]) {
        widths[1] = width
        onResize()
        onFrame?.(0)
        expect(result.metrics.value).toEqual({ widths: [100, width], total: 100 + width })
      }
    } finally {
      component.unmount()
      expect(targets.size).toBe(0)
      vi.unstubAllGlobals()
    }
  })
})
