import {
  defineComponent,
  h,
  nextTick,
  shallowRef,
  Teleport,
  Transition,
  watch,
  type HTMLAttributes,
  type PropType,
} from 'vue'
import { getPopupPositionStyle, getPopupVerticalBoundary } from '../utils/popupPosition'

export default defineComponent({
  name: 'TablePopup',
  inheritAttrs: false,
  props: {
    open: Boolean,
    anchor: Object as PropType<HTMLElement | null>,
    focusAnchor: Object as PropType<HTMLElement | null>,
    getPopupContainer: Function as PropType<(anchor: HTMLElement) => HTMLElement | string>,
    preset: { type: String, default: 'antdv' },
    as: { type: String, default: 'div' },
    align: { type: String as PropType<'start' | 'end'>, default: 'start' },
    alignmentWidth: { type: Number, default: 0 },
    matchTriggerWidth: Boolean,
    clipToAnchorAncestors: Boolean,
    closeOnFocusOutside: Boolean,
    outsideBoundary: Object as PropType<HTMLElement | null>,
    panelRef: Function as PropType<(element: HTMLElement | null) => void>,
    panelAttrs: Object as PropType<HTMLAttributes>,
    panelKey: String,
    initialFocus: String,
    zIndex: String,
  },
  emits: {
    dismiss: (_reason: 'outside' | 'escape') => true,
  },
  setup(props, { attrs, emit, slots }) {
    const container = shallowRef<HTMLElement | string>('body')
    const position = shallowRef<Record<string, string>>({})
    const panel = shallowRef<HTMLElement | null>(null)

    function reposition() {
      const anchor = props.anchor
      if (!props.open || !anchor) return
      const rect = anchor.getBoundingClientRect()
      const target = container.value
      const custom = typeof target !== 'string' && target !== document.body ? target : undefined
      const containerRect = custom?.getBoundingClientRect()
      const containerStyle = custom ? getComputedStyle(custom) : undefined
      const clippingOverflow = /^(auto|scroll|hidden|clip|overlay)$/
      const clipsX = clippingOverflow.test(containerStyle?.overflowX ?? '')
      const clipsY = clippingOverflow.test(containerStyle?.overflowY ?? '')
      const boundary = props.clipToAnchorAncestors ? getPopupVerticalBoundary(anchor) : undefined
      const verticalBoundary =
        clipsY && custom && containerRect
          ? {
              top: Math.max(containerRect.top + custom.clientTop, boundary?.top ?? 0),
              bottom: Math.min(
                containerRect.top + custom.clientTop + custom.clientHeight,
                boundary?.bottom ?? window.innerHeight,
              ),
            }
          : boundary
      const start = (containerRect?.left ?? 0) + (custom?.clientLeft ?? 0)
      // A mount container supplies coordinates, but visible overflow still has viewport space.
      const availableStart = clipsX ? Math.max(0, start) : 0
      const availableEnd =
        clipsX && custom
          ? Math.min(window.innerWidth, start + custom.clientWidth)
          : window.innerWidth
      const width = Math.max(0, availableEnd - availableStart)
      const panelWidth = panel.value?.offsetWidth ?? 0
      const triggerWidth = props.matchTriggerWidth ? rect.width : 0
      const desiredWidth = Math.max(panelWidth, triggerWidth, props.alignmentWidth)
      const alignEnd = props.align === 'end' || rect.left + desiredWidth > availableEnd
      const gutter = props.align === 'end' && !custom ? Math.min(8, width / 2) : 0
      const maxWidth = Math.max(0, width - 2 * gutter)
      const usedWidth = Math.min(maxWidth, Math.max(panelWidth, triggerWidth))
      const left = alignEnd ? rect.right - usedWidth : rect.left
      const height = panel.value
        ? panel.value.scrollHeight + panel.value.offsetHeight - panel.value.clientHeight
        : undefined
      const style = getPopupPositionStyle(rect, target, desiredWidth, height, verticalBoundary)
      delete style.right
      const clampedLeft = Math.max(
        availableStart + gutter,
        Math.min(left, availableEnd - gutter - usedWidth),
      )
      style.left = `${clampedLeft - start + (custom?.scrollLeft ?? 0)}px`
      if (custom) {
        style.top = `${parseFloat(style.top) - custom.clientTop}px`
      }
      style.maxWidth = `${maxWidth}px`
      if (props.matchTriggerWidth) style.minWidth = `${Math.min(triggerWidth, maxWidth)}px`
      if (props.zIndex) style.zIndex = props.zIndex
      position.value = style
    }

    function escape(event: KeyboardEvent) {
      if (!props.open || event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      emit('dismiss', 'escape')
      const focusTarget = props.focusAnchor ?? props.anchor
      focusTarget?.focus({ preventScroll: true })
    }

    watch(
      panel,
      (element, _, onCleanup) => {
        props.panelRef?.(element)
        element?.addEventListener('keydown', escape)
        onCleanup(() => element?.removeEventListener('keydown', escape))
      },
      { flush: 'sync' },
    )

    watch(
      () => [props.open, props.anchor, props.getPopupContainer, props.panelKey] as const,
      async ([open, anchor, getContainer], _, onCleanup) => {
        if (!open || !anchor || typeof document === 'undefined') return
        const trigger = anchor
        let active = true
        let observer: ResizeObserver | undefined
        container.value = getContainer?.(anchor) ?? document.body
        reposition()

        function outside(event: Event) {
          const target = event.target as Node
          if (
            !trigger.contains(target) &&
            !props.outsideBoundary?.contains(target) &&
            !panel.value?.contains(target)
          ) {
            emit('dismiss', 'outside')
          }
        }
        trigger.addEventListener('keydown', escape)
        document.addEventListener('mousedown', outside, true)
        document.addEventListener('touchstart', outside, true)
        if (props.closeOnFocusOutside) document.addEventListener('focusin', outside)
        window.addEventListener('resize', reposition)
        window.addEventListener('scroll', reposition, true)
        onCleanup(() => {
          active = false
          observer?.disconnect()
          trigger.removeEventListener('keydown', escape)
          document.removeEventListener('mousedown', outside, true)
          document.removeEventListener('touchstart', outside, true)
          document.removeEventListener('focusin', outside)
          window.removeEventListener('resize', reposition)
          window.removeEventListener('scroll', reposition, true)
        })
        await nextTick()
        if (!active) return
        reposition()
        if (props.initialFocus) {
          panel.value
            ?.querySelector<HTMLElement>(props.initialFocus)
            ?.focus({ preventScroll: true })
        }
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(reposition)
          observer.observe(anchor)
          if (panel.value) observer.observe(panel.value)
        }
      },
      { immediate: true },
    )

    return () => (
      <Teleport to={container.value}>
        <Transition name="vtg-table-popup">
          {props.open &&
            props.anchor &&
            h(
              props.as,
              {
                ...attrs,
                ...props.panelAttrs,
                key: props.panelKey,
                ref: panel,
                class: ['vtg-table-popup', attrs.class, props.panelAttrs?.class],
                style: [attrs.style, props.panelAttrs?.style, position.value],
                'data-vtg-preset': props.preset,
              },
              slots.default?.(),
            )}
        </Transition>
      </Teleport>
    )
  },
})
