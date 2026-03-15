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
import { useTheme } from '../composables/useTheme'
import type { ThemeConfig, SlotProps } from '../utils/types'

/**
 * 默认 Tooltip 主题（antdv 预设）。
 *
 * 与 packages/theme/src/presets/antdv/tooltip.ts 保持一致。
 * 仅包含视觉样式，定位逻辑保留 inline style。
 */
const defaultTooltipTheme = {
  slots: {
    content: [
      'text-white max-w-[250px] break-words relative',
      'text-[length:var(--vtg-tooltip-font-size)]',
      'bg-[color:var(--vtg-tooltip-bg)]',
      'rounded-[var(--vtg-tooltip-border-radius)]',
      'p-[var(--vtg-tooltip-padding)]',
      'shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]',
    ].join(' '),
    arrow: 'absolute w-2 h-2 rotate-45 bg-[color:var(--vtg-tooltip-bg)]',
  },
  defaultVariants: {},
} as const satisfies ThemeConfig

type TooltipSlots = keyof typeof defaultTooltipTheme.slots

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
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<TooltipSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const { slots: themeSlots } = useTheme('tooltip', defaultTooltipTheme, props)

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

    const arrowPositionStyle = computed(() => {
      switch (props.placement) {
        case 'top':
          return { bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
        case 'bottom':
          return { top: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
        case 'left':
          return { right: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }
        case 'right':
          return { left: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }
        default:
          return { bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
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
                    class={themeSlots.content()}
                    style={props.color ? { background: props.color } : undefined}
                  >
                    {titleContent}
                    {props.arrow && (
                      <div
                        class={themeSlots.arrow()}
                        style={{
                          ...arrowPositionStyle.value,
                          ...(props.color ? { background: props.color } : {}),
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
