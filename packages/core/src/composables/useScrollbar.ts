import { ref, computed, onMounted, onBeforeUnmount, type Ref } from 'vue'

export interface UseScrollbarOptions {
  minSize: number
}

export interface ScrollbarAxis {
  /** Thumb size in px */
  thumbSize: Ref<number>
  /** Thumb offset in px */
  thumbOffset: Ref<number>
  /** Whether this axis needs a scrollbar (content overflows) */
  visible: Ref<boolean>
}

export function useScrollbar(
  wrapRef: Ref<HTMLElement | null>,
  viewRef: Ref<HTMLElement | null>,
  options: UseScrollbarOptions,
) {
  const verticalThumbSize = ref(0)
  const verticalThumbOffset = ref(0)
  const verticalVisible = ref(false)

  const horizontalThumbSize = ref(0)
  const horizontalThumbOffset = ref(0)
  const horizontalVisible = ref(false)

  let resizeObserver: ResizeObserver | null = null

  function update() {
    const wrap = wrapRef.value
    if (!wrap) return

    const { clientHeight, scrollHeight, clientWidth, scrollWidth, scrollTop, scrollLeft } = wrap

    // Vertical
    if (scrollHeight > clientHeight) {
      verticalVisible.value = true
      const trackSize = clientHeight
      const thumbSz = Math.max(options.minSize, trackSize * (clientHeight / scrollHeight))
      verticalThumbSize.value = thumbSz
      const maxScroll = scrollHeight - clientHeight
      verticalThumbOffset.value =
        maxScroll > 0 ? (scrollTop / maxScroll) * (trackSize - thumbSz) : 0
    } else {
      verticalVisible.value = false
      verticalThumbSize.value = 0
      verticalThumbOffset.value = 0
    }

    // Horizontal
    if (scrollWidth > clientWidth) {
      horizontalVisible.value = true
      const trackSize = clientWidth
      const thumbSz = Math.max(options.minSize, trackSize * (clientWidth / scrollWidth))
      horizontalThumbSize.value = thumbSz
      const maxScroll = scrollWidth - clientWidth
      horizontalThumbOffset.value =
        maxScroll > 0 ? (scrollLeft / maxScroll) * (trackSize - thumbSz) : 0
    } else {
      horizontalVisible.value = false
      horizontalThumbSize.value = 0
      horizontalThumbOffset.value = 0
    }
  }

  onMounted(() => {
    const wrap = wrapRef.value
    const view = viewRef.value
    if (!wrap) return

    resizeObserver = new ResizeObserver(() => update())
    resizeObserver.observe(wrap)
    if (view) resizeObserver.observe(view)

    update()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  const vertical = computed<ScrollbarAxis>(() => ({
    thumbSize: verticalThumbSize,
    thumbOffset: verticalThumbOffset,
    visible: verticalVisible,
  }))

  const horizontal = computed<ScrollbarAxis>(() => ({
    thumbSize: horizontalThumbSize,
    thumbOffset: horizontalThumbOffset,
    visible: horizontalVisible,
  }))

  return {
    vertical,
    horizontal,
    update,
    verticalThumbSize,
    verticalThumbOffset,
    verticalVisible,
    horizontalThumbSize,
    horizontalThumbOffset,
    horizontalVisible,
  }
}
