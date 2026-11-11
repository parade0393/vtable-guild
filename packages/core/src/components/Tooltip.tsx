import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  Teleport,
  Transition,
  type PropType,
  type VNodeChild,
  nextTick,
} from 'vue'
import { useTheme } from '../composables/useTheme'
import { getFullscreenContainer } from '../utils/fullscreen'
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
      'leading-[1.5715]',
      'bg-[color:var(--vtg-tooltip-bg)]',
      'rounded-[var(--vtg-tooltip-border-radius)]',
      'p-[var(--vtg-tooltip-padding)]',
      'shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]',
    ].join(' '),
    arrow: 'absolute block pointer-events-none',
    arrowOuter: 'absolute w-0 h-0',
    arrowInner: 'absolute w-0 h-0',
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
    type Placement = 'top' | 'bottom' | 'left' | 'right'
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const
    // 实际方向：首选方向放不下而对侧放得下时翻转，例如全屏后贴着屏幕顶边的工具栏。
    const placement = ref<Placement>(props.placement)
    // body 之外的挂载容器：触发元素处于浏览器全屏元素内时，body 上的浮层不可见。
    const container = shallowRef<HTMLElement | null>(null)
    let rafId: number | null = null

    function syncContainer() {
      container.value = getFullscreenContainer(triggerRef.value)
    }

    function updatePosition() {
      const trigger = triggerRef.value
      const tooltip = tooltipRef.value
      if (!trigger || !tooltip) return

      const rect = trigger.getBoundingClientRect()
      const tipRect = tooltip.getBoundingClientRect()
      // 绝对定位的原点：body 下是文档，容器下是容器的 padding box。
      const origin = container.value
      const originRect = origin?.getBoundingClientRect()
      const scrollX =
        origin && originRect
          ? origin.scrollLeft - originRect.left - origin.clientLeft
          : window.scrollX
      const scrollY =
        origin && originRect ? origin.scrollTop - originRect.top - origin.clientTop : window.scrollY

      let top = 0
      let left = 0
      const gap = 8

      const available = {
        top: rect.top,
        bottom: window.innerHeight - rect.bottom,
        left: rect.left,
        right: window.innerWidth - rect.right,
      }
      const preferred = props.placement
      const size = preferred === 'top' || preferred === 'bottom' ? tipRect.height : tipRect.width
      // size 为 0 表示尚未完成布局，保持首选方向。
      const flip =
        size > 0 &&
        available[preferred] < size + gap &&
        available[opposite[preferred]] >= size + gap
      placement.value = flip ? opposite[preferred] : preferred

      switch (placement.value) {
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

    function scheduleUpdatePosition() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        rafId = null
        updatePosition()
      })
    }

    function handleFullscreenChange() {
      syncContainer()
      nextTick(() => scheduleUpdatePosition())
    }

    function bindViewportListeners() {
      window.addEventListener('resize', scheduleUpdatePosition)
      window.addEventListener('scroll', scheduleUpdatePosition, true)
      document.addEventListener('fullscreenchange', handleFullscreenChange)
    }

    function unbindViewportListeners() {
      window.removeEventListener('resize', scheduleUpdatePosition)
      window.removeEventListener('scroll', scheduleUpdatePosition, true)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
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

    watch(isControlled, (controlled) => {
      if (controlled) {
        // Controlled suppression must discard the previous hover and any delayed work.
        clearTimers()
        internalOpen.value = false
      }
    })

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
        syncContainer()
        bindViewportListeners()
        nextTick(() => scheduleUpdatePosition())
      } else {
        unbindViewportListeners()
      }
    })

    watch(
      () => props.placement,
      (value) => {
        placement.value = value
        if (visible.value) {
          nextTick(() => scheduleUpdatePosition())
        }
      },
    )

    onMounted(() => {
      if (visible.value) {
        syncContainer()
        bindViewportListeners()
        nextTick(() => scheduleUpdatePosition())
      }
    })

    onBeforeUnmount(() => {
      clearTimers()
      unbindViewportListeners()
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    })

    const arrowPositionStyle = computed(() => {
      const horizontalBase = 14
      const horizontalHeight = 8
      const verticalBase = 14
      const verticalHeight = 8

      switch (placement.value) {
        case 'top':
          return {
            bottom: '-7px',
            left: '50%',
            width: `${horizontalBase}px`,
            height: `${horizontalHeight}px`,
            transform: 'translateX(-50%)',
          }
        case 'bottom':
          return {
            top: '-7px',
            left: '50%',
            width: `${horizontalBase}px`,
            height: `${horizontalHeight}px`,
            transform: 'translateX(-50%)',
          }
        case 'left':
          return {
            right: '-7px',
            top: '50%',
            width: `${verticalHeight}px`,
            height: `${verticalBase}px`,
            transform: 'translateY(-50%)',
          }
        case 'right':
          return {
            left: '-7px',
            top: '50%',
            width: `${verticalHeight}px`,
            height: `${verticalBase}px`,
            transform: 'translateY(-50%)',
          }
        default:
          return {
            bottom: '-7px',
            left: '50%',
            width: `${horizontalBase}px`,
            height: `${horizontalHeight}px`,
            transform: 'translateX(-50%)',
          }
      }
    })

    const arrowOuterStyle = computed(() => {
      const color = props.color ?? 'var(--vtg-tooltip-arrow-outer-color, var(--vtg-tooltip-bg))'

      switch (placement.value) {
        case 'top':
          return {
            left: '0',
            top: '0',
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: `8px solid ${color}`,
          }
        case 'bottom':
          return {
            left: '0',
            top: '0',
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: `8px solid ${color}`,
          }
        case 'left':
          return {
            left: '0',
            top: '0',
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: `8px solid ${color}`,
          }
        case 'right':
          return {
            left: '0',
            top: '0',
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: `8px solid ${color}`,
          }
        default:
          return {
            left: '0',
            top: '0',
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: `8px solid ${color}`,
          }
      }
    })

    const arrowInnerStyle = computed(() => {
      const color = props.color ?? 'var(--vtg-tooltip-bg)'

      switch (placement.value) {
        case 'top':
          return {
            left: '1px',
            top: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `7px solid ${color}`,
          }
        case 'bottom':
          return {
            left: '1px',
            top: '1px',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `7px solid ${color}`,
          }
        case 'left':
          return {
            left: '0',
            top: '1px',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: `7px solid ${color}`,
          }
        case 'right':
          return {
            left: '1px',
            top: '1px',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: `7px solid ${color}`,
          }
        default:
          return {
            left: '1px',
            top: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `7px solid ${color}`,
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

      const colorStyle = props.color
        ? {
            background: props.color,
            borderColor: props.color,
          }
        : undefined

      return (
        <>
          {triggerNode}
          <Teleport to={container.value ?? 'body'}>
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
                  <div class={themeSlots.content()} style={colorStyle}>
                    {titleContent}
                    {props.arrow && (
                      <div class={themeSlots.arrow()} style={arrowPositionStyle.value}>
                        <div class={themeSlots.arrowOuter()} style={arrowOuterStyle.value} />
                        <div class={themeSlots.arrowInner()} style={arrowInnerStyle.value} />
                      </div>
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
