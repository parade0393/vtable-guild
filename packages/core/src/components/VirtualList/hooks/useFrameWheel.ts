import isFirefox from '../utils/isFirefox'
import useOriginScroll from './useOriginScroll'
import { onUnmounted, ref } from 'vue'
import type { ComputedRef } from 'vue'

export default function useFrameWheel(
  inVirtual: ComputedRef<boolean>,
  isScrollAtTop: ComputedRef<boolean>,
  isScrollAtBottom: ComputedRef<boolean>,
  isScrollAtLeft: ComputedRef<boolean>,
  isScrollAtRight: ComputedRef<boolean>,
  horizontalScroll: boolean,
  onWheelDelta: (offset: number, isHorizontal: boolean) => void,
): [(e: WheelEvent) => void, (e: Event & { detail?: number }) => void] {
  const offsetRef = ref(0)
  let nextFrame: number | null = null
  const wheelValueRef = ref<number | null>(null)
  const isMouseScrollRef = ref(false)

  const originScroll = useOriginScroll(
    isScrollAtTop,
    isScrollAtBottom,
    isScrollAtLeft,
    isScrollAtRight,
  )

  function onWheelY(e: WheelEvent, deltaY: number) {
    if (nextFrame) cancelAnimationFrame(nextFrame)

    if (originScroll(false, deltaY)) return

    const event = e as WheelEvent & { _virtualHandled?: boolean }
    if (!event._virtualHandled) event._virtualHandled = true
    else return

    offsetRef.value += deltaY
    wheelValueRef.value = deltaY

    if (!isFirefox) e.preventDefault()

    nextFrame = requestAnimationFrame(() => {
      const patchMultiple = isMouseScrollRef.value ? 10 : 1
      onWheelDelta(offsetRef.value * patchMultiple, false)
      offsetRef.value = 0
    })
  }

  function onWheelX(event: WheelEvent, deltaX: number) {
    onWheelDelta(deltaX, true)
    if (!isFirefox) event.preventDefault()
  }

  const wheelDirectionRef = ref<'x' | 'y' | 'sx' | null>(null)
  let wheelDirectionClean: number | null = null

  function onWheel(event: WheelEvent) {
    if (!inVirtual.value) return

    if (wheelDirectionClean) cancelAnimationFrame(wheelDirectionClean)
    wheelDirectionClean = requestAnimationFrame(() => {
      wheelDirectionRef.value = null
    })

    const { deltaX, deltaY, shiftKey } = event
    let mergedDeltaX = deltaX
    let mergedDeltaY = deltaY

    if (
      wheelDirectionRef.value === 'sx' ||
      (!wheelDirectionRef.value && (shiftKey || false) && deltaY && !deltaX)
    ) {
      mergedDeltaX = deltaY
      mergedDeltaY = 0
      wheelDirectionRef.value = 'sx'
    }

    const absX = Math.abs(mergedDeltaX)
    const absY = Math.abs(mergedDeltaY)

    if (wheelDirectionRef.value === null) {
      wheelDirectionRef.value = horizontalScroll && absX > absY ? 'x' : 'y'
    }

    if (wheelDirectionRef.value === 'y') onWheelY(event, mergedDeltaY)
    else onWheelX(event, mergedDeltaX)
  }

  function onFireFoxScroll(event: Event & { detail?: number }) {
    if (!inVirtual.value) return
    isMouseScrollRef.value = event.detail === wheelValueRef.value
  }

  onUnmounted(() => {
    if (nextFrame) cancelAnimationFrame(nextFrame)
    if (wheelDirectionClean) cancelAnimationFrame(wheelDirectionClean)
  })

  return [onWheel, onFireFoxScroll]
}
