import {
  computed,
  defineComponent,
  inject,
  nextTick,
  ref,
  useId,
  watch,
  type PropType,
  type VNodeChild,
} from 'vue'
import { cnByCssMode, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import { DownOutlinedIcon } from '@vtable-guild/icons'
import type { PaginationSlots } from '@vtable-guild/theme'
import TablePopup from './TablePopup'

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
    const compatClassEnabled = context?.compatClass === true
    const id = useId()
    const trigger = ref<HTMLButtonElement | null>(null)
    const popup = ref<HTMLElement | null>(null)
    const open = ref(false)
    const active = ref(0)
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
    function focusOption() {
      void nextTick(() => {
        if (!open.value) return
        popup.value
          ?.querySelectorAll<HTMLElement>('[role="option"]')
          [active.value]?.focus({ preventScroll: true })
      })
    }
    function setPanel(element: HTMLElement | null) {
      popup.value = element
    }
    function show() {
      if (props.disabled || !trigger.value) return
      active.value = Math.max(
        0,
        values.value.findIndex((v) => Number(v) === props.value),
      )
      open.value = true
    }
    function choose(value: string | number) {
      if (!props.disabled) emit('change', Number(value))
      close(true)
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Tab') close()
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
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) close()
      },
    )
    return () => (
      <>
        <button
          ref={trigger}
          type="button"
          class={[
            cnByCssMode(
              context?.cssMode ?? 'prebuilt',
              context?.classPrefix ?? 'vtg',
              props.theme.item(),
              props.theme.select(),
            ),
            compatClassEnabled && 'ant-pagination-options ant-pagination-options-size-changer',
          ]}
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
        <TablePopup
          as="ul"
          open={open.value}
          anchor={trigger.value}
          getPopupContainer={props.getPopupContainer}
          preset={context?.themePreset ?? 'antdv'}
          matchTriggerWidth
          clipToAnchorAncestors
          initialFocus='[role="option"][tabindex="0"]'
          zIndex="var(--vtg-pagination-popup-z)"
          panelRef={setPanel}
          class={props.theme.popup()}
          panelAttrs={{ id, role: 'listbox', 'aria-label': props.label, onKeydown: keydown }}
          onDismiss={() => close()}
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
        </TablePopup>
      </>
    )
  },
})
