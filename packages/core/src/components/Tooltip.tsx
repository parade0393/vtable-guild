import {
  defineComponent,
  ref,
  computed,
  watch,
  onBeforeUnmount,
  Teleport,
  Transition,
  type PropType,
  type VNodeChild,
  nextTick,
} from 'vue'

export default defineComponent({
  name: 'VTooltip',
  props: {
    title: { type: [String, Object] as PropType<string | VNodeChild>, default: undefined },
    placement: {
      type: String as PropType<'top' | 'bottom' | 'left' | 'right'>,
      default: 'top',
    },
    open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    mouseEnterDelay: { type: Number, default: 0.1 },
    mouseLeaveDelay: { type: Number, default: 0.1 },
    color: { type: String, default: undefined },
    arrow: { type: Boolean, default: true },
    destroyOnHide: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const triggerRef = ref<HTMLElement | null>(null)
    const tooltipRef = ref<HTMLElement | null>(null)
    const internalOpen = ref(false)
    let enterTimer: ReturnType<typeof setTimeout> | null = null
    let leaveTimer: ReturnType<typeof setTimeout> | null = null

    const isControlled = computed(() => props.open !== undefined)
    const visible = computed(() => (isControlled.value ? props.open : internalOpen.value))

    const pos = ref({ top: 0, left: 0 })

    function updatePosition() {
      const trigger = triggerRef.value
      const tooltip = tooltipRef.value
      if (!trigger || !tooltip) return

      const rect = trigger.getBoundingClientRect()
      const tipRect = tooltip.getBoundingClientRect()
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      let top = 0
      let left = 0
      const gap = 8

      switch (props.placement) {
        case 'top':
          top = rect.top + scrollY - tipRect.height - gap
          left = rect.left + scrollX + rect.width / 2 - tipRect.width / 2
          break
        case 'bottom':
          top = rect.bottom + scrollY + gap
          left = rect.left + scrollX + rect.width / 2 - tipRect.width / 2
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2 - tipRect.height / 2
          left = rect.left + scrollX - tipRect.width - gap
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2 - tipRect.height / 2
          left = rect.right + scrollX + gap
          break
      }

      pos.value = { top, left }
    }

    function clearTimers() {
      if (enterTimer) {
        clearTimeout(enterTimer)
        enterTimer = null
      }
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }
    }

    function handleMouseEnter() {
      if (isControlled.value) return
      clearTimers()
      enterTimer = setTimeout(() => {
        internalOpen.value = true
      }, props.mouseEnterDelay * 1000)
    }

    function handleMouseLeave() {
      if (isControlled.value) return
      clearTimers()
      leaveTimer = setTimeout(() => {
        internalOpen.value = false
      }, props.mouseLeaveDelay * 1000)
    }

    watch(visible, (v) => {
      if (v) {
        nextTick(() => updatePosition())
      }
    })

    onBeforeUnmount(() => clearTimers())

    const arrowStyle = computed(() => {
      const bg = props.color || 'var(--vtg-tooltip-bg, rgba(0, 0, 0, 0.85))'
      switch (props.placement) {
        case 'top':
          return {
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            background: bg,
          }
        case 'bottom':
          return {
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            background: bg,
          }
        case 'left':
          return {
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            background: bg,
          }
        case 'right':
          return {
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            background: bg,
          }
        default:
          return {
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            background: bg,
          }
      }
    })

    const shouldRender = computed(() => {
      if (props.destroyOnHide) return visible.value
      return true
    })

    return () => {
      const titleContent = slots.title?.() ?? props.title
      if (titleContent == null) {
        return slots.default?.()
      }

      const triggerNode = (
        <span
          ref={triggerRef}
          onMouseenter={handleMouseEnter}
          onMouseleave={handleMouseLeave}
          style={
            props.block
              ? { display: 'flex', flex: '1 1 auto', minWidth: 0 }
              : { display: 'inline-flex' }
          }
        >
          {slots.default?.()}
        </span>
      )

      const bg = props.color || 'var(--vtg-tooltip-bg, rgba(0, 0, 0, 0.85))'

      return (
        <>
          {triggerNode}
          <Teleport to="body">
            <Transition
              enterActiveClass="vtg-tooltip-enter-active"
              leaveActiveClass="vtg-tooltip-leave-active"
              enterFromClass="vtg-tooltip-enter-from"
              leaveToClass="vtg-tooltip-leave-to"
            >
              {shouldRender.value && visible.value && (
                <div
                  ref={tooltipRef}
                  role="tooltip"
                  onMouseenter={handleMouseEnter}
                  onMouseleave={handleMouseLeave}
                  style={{
                    position: 'absolute',
                    top: `${pos.value.top}px`,
                    left: `${pos.value.left}px`,
                    zIndex: 1070,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      background: bg,
                      color: '#fff',
                      borderRadius: 'var(--vtg-tooltip-border-radius, 6px)',
                      padding: 'var(--vtg-tooltip-padding, 6px 8px)',
                      fontSize: 'var(--vtg-tooltip-font-size, 14px)',
                      maxWidth: '250px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                      position: 'relative',
                      wordWrap: 'break-word',
                    }}
                  >
                    {titleContent}
                    {props.arrow && (
                      <div
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          ...arrowStyle.value,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </Transition>
          </Teleport>
        </>
      )
    }
  },
})
