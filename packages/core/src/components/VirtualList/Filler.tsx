/* eslint-disable @typescript-eslint/no-explicit-any */
import { createVNode, defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

export interface InnerProps {
  role?: string
  id?: string
}

export default defineComponent({
  name: 'VirtualFiller',
  props: {
    prefixCls: String,
    height: Number,
    offsetY: Number,
    offsetX: Number,
    scrollWidth: Number,
    onInnerResize: Function as PropType<() => void>,
    innerProps: Object as PropType<InnerProps>,
    rtl: Boolean,
    extra: Object as PropType<VNode>,
  },
  setup(props, { slots }) {
    let resizeObserver: ResizeObserver | null = null
    let observedElement: Element | null = null

    const observeInner = (el: Element | null) => {
      if (observedElement === el) return

      if (resizeObserver && observedElement) {
        resizeObserver.unobserve(observedElement)
      }

      observedElement = el

      if (el) {
        if (!resizeObserver) {
          resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry && (entry.target as HTMLElement).offsetHeight && props.onInnerResize) {
              props.onInnerResize()
            }
          })
        }
        resizeObserver.observe(el)
      }
    }

    return () => {
      let outerStyle: Record<string, any> = {}
      let innerStyle: Record<string, any> = {
        display: 'flex',
        flexDirection: 'column',
      }

      if (props.offsetY !== undefined) {
        outerStyle = {
          height: `${props.height}px`,
          position: 'relative',
          overflow: 'hidden',
        }
        innerStyle = {
          ...innerStyle,
          transform: `translateY(${props.offsetY}px)`,
          [props.rtl ? 'marginRight' : 'marginLeft']: `-${props.offsetX || 0}px`,
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
        }
      }

      return createVNode('div', { style: outerStyle }, [
        createVNode(
          'div',
          {
            ref: observeInner as any,
            style: innerStyle,
            class: props.prefixCls ? `${props.prefixCls}-holder-inner` : undefined,
            ...props.innerProps,
          },
          [slots.default?.(), props.extra],
        ),
      ])
    }
  },
})
