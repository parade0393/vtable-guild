import { onUnmounted, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

function smoothScrollOffset(offset: number): number {
  return Math.floor(offset ** 0.5)
}

function getPageXY(e: MouseEvent | TouchEvent, horizontal: boolean): number {
  return (
    ('touches' in e ? e.touches[0] : e)[horizontal ? 'pageX' : 'pageY'] -
    window[horizontal ? 'scrollX' : 'scrollY']
  )
}

export default function useScrollDrag(
  inVirtual: ComputedRef<boolean>,
  componentRef: Ref<HTMLElement | undefined>,
  onScrollOffset: (offset: number) => void,
) {
  let cachedElement: HTMLElement | null = null
  let cachedDocument: Document | null = null
  let mouseDownLock = false
  let rafId: number | null = null
  let offset = 0

  const stopScroll = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const continueScroll = () => {
    stopScroll()
    rafId = requestAnimationFrame(() => {
      onScrollOffset(offset)
      continueScroll()
    })
  }

  const clearDragState = () => {
    mouseDownLock = false
    stopScroll()
  }

  const onMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).draggable || e.button !== 0) return

    const event = e as MouseEvent & { _virtualHandled?: boolean }
    if (!event._virtualHandled) {
      event._virtualHandled = true
      mouseDownLock = true
    }
  }

  const onMouseMove = (e: MouseEvent) => {
    if (mouseDownLock && cachedElement) {
      const mouseY = getPageXY(e, false)
      const { top, bottom } = cachedElement.getBoundingClientRect()

      if (mouseY <= top) {
        offset = -smoothScrollOffset(top - mouseY)
        continueScroll()
      } else if (mouseY >= bottom) {
        offset = smoothScrollOffset(mouseY - bottom)
        continueScroll()
      } else {
        stopScroll()
      }
    }
  }

  const teardown = () => {
    if (cachedElement) {
      cachedElement.removeEventListener('mousedown', onMouseDown)
      cachedElement = null
    }
    if (cachedDocument) {
      cachedDocument.removeEventListener('mouseup', clearDragState)
      cachedDocument.removeEventListener('mousemove', onMouseMove)
      cachedDocument.removeEventListener('dragend', clearDragState)
      cachedDocument = null
    }
    clearDragState()
  }

  onUnmounted(teardown)

  watch(
    [inVirtual, componentRef],
    ([enabled, ele]) => {
      if (enabled && ele) {
        cachedElement = ele
        cachedDocument = ele.ownerDocument
        cachedElement.addEventListener('mousedown', onMouseDown)
        cachedDocument.addEventListener('mouseup', clearDragState)
        cachedDocument.addEventListener('mousemove', onMouseMove)
        cachedDocument.addEventListener('dragend', clearDragState)
      } else {
        teardown()
      }
    },
    { immediate: true },
  )
}

export { getPageXY }
