import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VCheckbox',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:checked', 'change'],
  setup(props, { emit }) {
    function handleClick(e: MouseEvent) {
      if (props.disabled) return
      const next = !props.checked
      emit('update:checked', next)
      emit('change', next, e)
    }

    return () => (
      <span
        role="checkbox"
        aria-checked={props.checked}
        aria-disabled={props.disabled}
        class={[
          'inline-flex items-center justify-center w-[var(--vtg-checkbox-size)] h-[var(--vtg-checkbox-size)] rounded-[var(--vtg-checkbox-border-radius)] border cursor-pointer transition-all shrink-0',
          props.disabled && 'opacity-50 cursor-not-allowed',
          props.checked
            ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]'
            : 'bg-[color:var(--color-surface)] border-[color:var(--color-default)]',
        ]}
        onClick={handleClick}
      >
        {props.checked && (
          <svg viewBox="64 64 896 896" width="12" height="12" fill="#fff" aria-hidden="true">
            <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
          </svg>
        )}
      </span>
    )
  },
})
