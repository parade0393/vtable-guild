import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  Teleport,
  Transition,
  useId,
  watch,
  type PropType,
  type VNodeChild,
} from 'vue'
import { cnByCssMode, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import { DownOutlinedIcon } from '@vtable-guild/icons'
import type { PaginationSlots } from '@vtable-guild/theme'
import { getPopupPositionStyle } from '../utils/popupPosition'

export default defineComponent({
  name: 'PaginationSizeSelect',
  props: {
    value: { type: Number, required: true },
    options: { type: Array as PropType<(string | number)[]>, required: true },
    disabled: Boolean,
    label: { type: String, required: true },
    renderText: {
      type: Function as PropType<(value: string | number) => VNodeChild>,
      required: true,
    },
    theme: { type: Object as PropType<Record<PaginationSlots, () => string>>, required: true },
    getPopupContainer: Function as PropType<(trigger: HTMLElement) => HTMLElement>,
  },
  emits: { change: (_value: number) => true },
  setup(props, { emit }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const id = useId()
    const trigger = ref<HTMLButtonElement | null>(null)
    const popup = ref<HTMLUListElement | null>(null)
    const open = ref(false)
    const active = ref(0)
    const position = ref<Record<string, string>>({})
    const container = ref<HTMLElement | string>('body')
    let resizeObserver: ResizeObserver | undefined
    const values = computed(() => {
      const values = props.options.filter((v) => Number.isSafeInteger(Number(v)) && Number(v) > 0)
      if (!values.some((v) => Number(v) === props.value)) values.push(props.value)
      return [...new Map(values.map((v) => [Number(v), v])).values()].sort(
        (a, b) => Number(a) - Number(b),
      )
    })
    function close(focus = false) {
      open.value = false
      if (focus) trigger.value?.focus()
    }
    function reposition() {
      if (!trigger.value || !open.value) return
      const rect = trigger.value.getBoundingClientRect()
      position.value = {
        ...getPopupPositionStyle(rect, container.value, rect.width, popup.value?.scrollHeight),
        minWidth: `${rect.width}px`,
        zIndex: 'var(--vtg-pagination-popup-z)',
      }
    }
    function outside(event: MouseEvent) {
      const node = event.target as Node
      if (!trigger.value?.contains(node) && !popup.value?.contains(node)) close()
    }
    function focusOption() {
      void nextTick(() =>
        popup.value
          ?.querySelectorAll<HTMLElement>('[role="option"]')
          [active.value]?.focus({ preventScroll: true }),
      )
    }
    function show() {
      if (props.disabled || !trigger.value) return
      container.value = props.getPopupContainer?.(trigger.value) ?? document.body
      active.value = Math.max(
        0,
        values.value.findIndex((v) => Number(v) === props.value),
      )
      open.value = true
      reposition()
      void nextTick(() => {
        if (!open.value) return
        reposition()
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(reposition)
          if (trigger.value) resizeObserver.observe(trigger.value)
          if (popup.value) resizeObserver.observe(popup.value)
        }
      })
      focusOption()
    }
    function choose(value: string | number) {
      if (!props.disabled) emit('change', Number(value))
      close(true)
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
      } else if (event.key === 'Tab') close()
      else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        if (!open.value) {
          show()
          return
        }
        const last = values.value.length - 1
        active.value =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : (active.value + (event.key === 'ArrowDown' ? 1 : last)) % values.value.length
        focusOption()
      }
    }
    watch(open, (value) => {
      if (value) {
        document.addEventListener('mousedown', outside)
        window.addEventListener('resize', reposition)
        window.addEventListener('scroll', reposition, true)
      } else cleanup()
    })
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) close()
      },
    )
    function cleanup() {
      resizeObserver?.disconnect()
      resizeObserver = undefined
      if (typeof document === 'undefined') return
      document.removeEventListener('mousedown', outside)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
    onBeforeUnmount(cleanup)
    return () => (
      <>
        <button
          ref={trigger}
          type="button"
          class={cnByCssMode(
            context?.cssMode ?? 'prebuilt',
            context?.classPrefix ?? 'vtg',
            props.theme.item(),
            props.theme.select(),
          )}
          disabled={props.disabled}
          aria-label={props.label}
          aria-haspopup="listbox"
          aria-expanded={open.value}
          aria-disabled={props.disabled}
          aria-controls={open.value ? id : undefined}
          onClick={() => (open.value ? close() : show())}
          onKeydown={keydown}
        >
          {props.renderText(values.value.find((v) => Number(v) === props.value) ?? props.value)}
          <DownOutlinedIcon />
        </button>
        <Teleport to={container.value}>
          <Transition name="vtg-pagination-popup">
            {open.value && (
              <ul
                ref={popup}
                id={id}
                role="listbox"
                aria-label={props.label}
                class={props.theme.popup()}
                data-vtg-preset={context?.themePreset ?? 'antdv'}
                style={position.value}
                onKeydown={keydown}
              >
                {values.value.map((value, index) => (
                  <li
                    key={Number(value)}
                    role="option"
                    tabindex={index === active.value ? 0 : -1}
                    aria-selected={Number(value) === props.value}
                    class={cnByCssMode(
                      context?.cssMode ?? 'prebuilt',
                      context?.classPrefix ?? 'vtg',
                      props.theme.option(),
                      Number(value) === props.value && props.theme.optionActive(),
                    )}
                    onClick={() => choose(value)}
                    onKeydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        choose(value)
                      }
                    }}
                  >
                    {props.renderText(value)}
                  </li>
                ))}
              </ul>
            )}
          </Transition>
        </Teleport>
      </>
    )
  },
})
