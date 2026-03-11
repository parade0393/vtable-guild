import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VRadio',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:checked', 'change'],
  setup(props, { emit }) {
    function handleClick(e: MouseEvent) {
      if (props.disabled || props.checked) return
      emit('update:checked', true)
      emit('change', true, e)
    }

    return () => (
      <span
        role="radio"
        aria-checked={props.checked}
        aria-disabled={props.disabled}
        class={[
          'inline-flex items-center justify-center w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)] rounded-full border shrink-0 transition-all',
          'border-[length:var(--vtg-radio-border-width)]',
          props.disabled && 'opacity-50 cursor-not-allowed',
          props.checked
            ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]'
            : 'border-[color:var(--color-default)] bg-[color:var(--color-surface)]',
        ]}
        onClick={handleClick}
      >
        <span
          aria-hidden="true"
          class={[
            'rounded-full w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)] transition-transform duration-200',
            'bg-[color:var(--color-surface)]',
            props.checked ? 'scale-[0.375]' : 'scale-0',
          ]}
        />
      </span>
    )
  },
})
