import { afterEach, beforeAll, vi } from 'vitest'
import { config } from '@vue/test-utils'

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0),
  })

  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: (handle: number) => window.clearTimeout(handle),
  })

  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    writable: true,
    value: function scrollTo(options: ScrollToOptions | number, y?: number) {
      if (typeof options === 'number') {
        this.scrollLeft = options
        this.scrollTop = y ?? 0
        return
      }

      if (typeof options.left === 'number') {
        this.scrollLeft = options.left
      }

      if (typeof options.top === 'number') {
        this.scrollTop = options.top
      }
    },
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-vtg-preset')
  vi.restoreAllMocks()
})

config.global.renderStubDefaultSlot = true
