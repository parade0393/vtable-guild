import { defineComponent, ref, onBeforeUnmount } from 'vue'

export default defineComponent({
  name: 'ScrollbarBar',
  props: {
    vertical: { type: Boolean, default: true },
    thumbSize: { type: Number, required: true },
    thumbOffset: { type: Number, required: true },
    visible: { type: Boolean, default: false },
    always: { type: Boolean, default: false },
    trackClass: { type: String, default: '' },
    trackDirectionClass: { type: String, default: '' },
    thumbClass: { type: String, default: '' },
  },
  emits: ['scroll'],
  setup(props, { emit }) {
    const trackRef = ref<HTMLElement | null>(null)
    const dragging = ref(false)
    const hovering = ref(false)
    let dragStartOffset = 0

    function handleThumbMouseDown(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      dragging.value = true

      const thumbOffset = props.vertical ? e.clientY : e.clientX
      dragStartOffset = thumbOffset - props.thumbOffset

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.onselectstart = () => false
    }

    function handleMouseMove(e: MouseEvent) {
      if (!dragging.value || !trackRef.value) return

      const track = trackRef.value
      const trackRect = track.getBoundingClientRect()
      const trackSize = props.vertical ? trackRect.height : trackRect.width
      const mousePos = props.vertical ? e.clientY : e.clientX

      const newOffset = mousePos - dragStartOffset
      const maxOffset = trackSize - props.thumbSize
      const clampedOffset = Math.max(0, Math.min(newOffset, maxOffset))

      const ratio = maxOffset > 0 ? clampedOffset / maxOffset : 0

      emit('scroll', { ratio, vertical: props.vertical })
    }

    function handleMouseUp() {
      dragging.value = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.onselectstart = null
    }

    function handleTrackMouseDown(e: MouseEvent) {
      if (e.target === trackRef.value) {
        e.preventDefault()
        const track = trackRef.value!
        const trackRect = track.getBoundingClientRect()
        const trackSize = props.vertical ? trackRect.height : trackRect.width
        const clickPos = props.vertical ? e.clientY - trackRect.top : e.clientX - trackRect.left

        const thumbCenter = clickPos - props.thumbSize / 2
        const maxOffset = trackSize - props.thumbSize
        const clampedOffset = Math.max(0, Math.min(thumbCenter, maxOffset))
        const ratio = maxOffset > 0 ? clampedOffset / maxOffset : 0

        emit('scroll', { ratio, vertical: props.vertical })
      }
    }

    function handleMouseEnter() {
      hovering.value = true
    }

    function handleMouseLeave() {
      hovering.value = false
    }

    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.onselectstart = null
    })

    return () => {
      const showBar = props.always || props.visible || hovering.value || dragging.value
      const thumbStyle = props.vertical
        ? { height: `${props.thumbSize}px`, transform: `translateY(${props.thumbOffset}px)` }
        : { width: `${props.thumbSize}px`, transform: `translateX(${props.thumbOffset}px)` }

      return (
        <div
          ref={trackRef}
          class={[props.trackClass, props.trackDirectionClass]}
          style={showBar ? { opacity: 1 } : undefined}
          onMousedown={handleTrackMouseDown}
          onMouseenter={handleMouseEnter}
          onMouseleave={handleMouseLeave}
        >
          <div class={props.thumbClass} style={thumbStyle} onMousedown={handleThumbMouseDown} />
        </div>
      )
    }
  },
})
