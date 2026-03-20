/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  computed,
  createVNode,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import type { CSSProperties, PropType } from 'vue'

function getPageXY(e: MouseEvent | TouchEvent, horizontal: boolean): number {
  return (
    ('touches' in e ? e.touches[0] : e)[horizontal ? 'pageX' : 'pageY'] -
    window[horizontal ? 'scrollX' : 'scrollY']
  )
}

export type ScrollBarDirectionType = 'ltr' | 'rtl'

export interface ScrollBarRef {
  delayHidden: () => void
}

export default defineComponent({
  name: 'VirtualScrollBar',
  props: {
    prefixCls: { type: String, required: true },
    scrollOffset: { type: Number, required: true },
    scrollRange: { type: Number, required: true },
    rtl: { type: Boolean, required: true },
    onScroll: {
      type: Function as PropType<(offset: number, horizontal?: boolean) => void>,
      required: true,
    },
    onStartMove: { type: Function as PropType<() => void>, required: true },
    onStopMove: { type: Function as PropType<() => void>, required: true },
    horizontal: { type: Boolean, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    thumbStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    spinSize: { type: Number, required: true },
    containerSize: { type: Number, required: true },
    showScrollBar: {
      type: [Boolean, String] as PropType<boolean | 'optional'>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const dragging = ref(false)
    const pageXY = ref<number | null>(null)
    const startTop = ref<number | null>(null)
    const isLTR = computed(() => !props.rtl)

    const scrollbarRef = shallowRef<HTMLDivElement>()
    const thumbRef = shallowRef<HTMLDivElement>()

    const visible = ref(props.showScrollBar === 'optional' ? true : props.showScrollBar)
    let visibleTimeout: ReturnType<typeof setTimeout> | null = null

    const delayHidden = () => {
      if (props.showScrollBar === true || props.showScrollBar === false) return
      if (visibleTimeout) clearTimeout(visibleTimeout)
      visible.value = true
      visibleTimeout = setTimeout(() => {
        visible.value = false
      }, 3000)
    }

    const enableScrollRange = computed(() => props.scrollRange - props.containerSize || 0)
    const enableOffsetRange = computed(() => props.containerSize - props.spinSize || 0)

    const top = computed(() => {
      if (props.scrollOffset === 0 || enableScrollRange.value === 0) return 0
      return (props.scrollOffset / enableScrollRange.value) * enableOffsetRange.value
    })

    const stateRef = shallowRef({
      top: top.value,
      dragging: dragging.value,
      pageY: pageXY.value,
      startTop: startTop.value,
    })

    watch([top, dragging, pageXY, startTop], () => {
      stateRef.value = {
        top: top.value,
        dragging: dragging.value,
        pageY: pageXY.value,
        startTop: startTop.value,
      }
    })

    const onContainerMouseDown = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
    }

    const onThumbMouseDown = (e: MouseEvent | TouchEvent) => {
      dragging.value = true
      pageXY.value = getPageXY(e, props.horizontal || false)
      startTop.value = stateRef.value.top
      props.onStartMove?.()
      e.stopPropagation()
      e.preventDefault()
    }

    onMounted(() => {
      const onScrollbarTouchStart = (e: TouchEvent) => {
        e.preventDefault()
      }

      const scrollbarEle = scrollbarRef.value
      const thumbEle = thumbRef.value

      if (scrollbarEle && thumbEle) {
        scrollbarEle.addEventListener('touchstart', onScrollbarTouchStart, { passive: false })
        thumbEle.addEventListener('touchstart', onThumbMouseDown as any, { passive: false })

        onUnmounted(() => {
          scrollbarEle.removeEventListener('touchstart', onScrollbarTouchStart)
          thumbEle.removeEventListener('touchstart', onThumbMouseDown as any)
        })
      }
    })

    watch(dragging, (isDragging, _prev, onCleanup) => {
      if (isDragging) {
        let moveRafId: number | null = null

        const onMouseMove = (e: MouseEvent | TouchEvent) => {
          const {
            dragging: stateDragging,
            pageY: statePageY,
            startTop: stateStartTop,
          } = stateRef.value
          if (moveRafId !== null) cancelAnimationFrame(moveRafId)

          const rect = scrollbarRef.value!.getBoundingClientRect()
          const scale = props.containerSize / (props.horizontal ? rect.width : rect.height)

          if (stateDragging) {
            const offset = (getPageXY(e, props.horizontal || false) - (statePageY || 0)) * scale
            let newTop = stateStartTop || 0

            if (!isLTR.value && props.horizontal) newTop -= offset
            else newTop += offset

            const tmpEnableScrollRange = enableScrollRange.value
            const tmpEnableOffsetRange = enableOffsetRange.value
            const ptg = tmpEnableOffsetRange ? newTop / tmpEnableOffsetRange : 0

            let newScrollTop = Math.ceil(ptg * tmpEnableScrollRange)
            newScrollTop = Math.max(newScrollTop, 0)
            newScrollTop = Math.min(newScrollTop, tmpEnableScrollRange)

            moveRafId = requestAnimationFrame(() => {
              props.onScroll?.(newScrollTop, props.horizontal)
            })
          }
        }

        const onMouseUp = () => {
          dragging.value = false
          props.onStopMove()
        }

        window.addEventListener('mousemove', onMouseMove, { passive: true })
        window.addEventListener('touchmove', onMouseMove, { passive: true })
        window.addEventListener('mouseup', onMouseUp, { passive: true })
        window.addEventListener('touchend', onMouseUp, { passive: true })

        onCleanup(() => {
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('touchmove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          window.removeEventListener('touchend', onMouseUp)
          if (moveRafId !== null) cancelAnimationFrame(moveRafId)
        })
      }
    })

    watch(
      () => props.scrollOffset,
      (_n, _o, onCleanup) => {
        delayHidden()
        onCleanup(() => {
          if (visibleTimeout) clearTimeout(visibleTimeout)
        })
      },
    )

    expose({ delayHidden })

    return () => {
      const { prefixCls, horizontal } = props
      const scrollbarPrefixCls = `${prefixCls}-scrollbar`

      const containerStyle: CSSProperties = {
        position: 'absolute',
        visibility: visible.value ? undefined : 'hidden',
      }

      const tStyle: CSSProperties = {
        position: 'absolute',
        borderRadius: '99px',
        background: 'var(--vc-virtual-list-scrollbar-bg, rgba(0, 0, 0, 0.5))',
        cursor: 'pointer',
        userSelect: 'none',
      }

      if (horizontal) {
        Object.assign(containerStyle, { height: '8px', left: 0, right: 0, bottom: 0 })
        Object.assign(tStyle, {
          height: '100%',
          width: `${props.spinSize}px`,
          [isLTR.value ? 'left' : 'right']: `${top.value}px`,
        })
      } else {
        Object.assign(containerStyle, {
          width: '8px',
          top: 0,
          bottom: 0,
          [isLTR.value ? 'right' : 'left']: 0,
        })
        Object.assign(tStyle, {
          width: '100%',
          height: `${props.spinSize}px`,
          top: `${top.value}px`,
        })
      }

      return createVNode(
        'div',
        {
          ref: scrollbarRef,
          class: [
            scrollbarPrefixCls,
            {
              [`${scrollbarPrefixCls}-horizontal`]: horizontal,
              [`${scrollbarPrefixCls}-vertical`]: !horizontal,
              [`${scrollbarPrefixCls}-visible`]: visible.value,
            },
          ],
          style: { ...containerStyle, ...props.style },
          onMousedown: onContainerMouseDown,
          onMousemove: delayHidden,
        },
        [
          createVNode('div', {
            ref: thumbRef,
            class: [
              `${scrollbarPrefixCls}-thumb`,
              { [`${scrollbarPrefixCls}-thumb-moving`]: dragging.value },
            ],
            style: { ...tStyle, ...props.thumbStyle },
            onMousedown: onThumbMouseDown,
          }),
        ],
      )
    }
  },
})
