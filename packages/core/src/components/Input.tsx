import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VInput',
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:value', 'change', 'pressEnter'],
  setup(props, { emit }) {
    function handleInput(e: Event) {
      const val = (e.target as HTMLInputElement).value
      emit('update:value', val)
      emit('change', val)
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        emit('pressEnter', e)
      }
    }

    return () => (
      <input
        class={[
          'w-full box-border rounded-[var(--vtg-input-border-radius)] h-[var(--vtg-input-height)]',
          'px-[var(--vtg-input-padding-inline)] text-[length:var(--vtg-input-font-size)]',
          'bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)]',
          'border border-[color:var(--color-default)] outline-none transition-colors',
          'focus:border-[color:var(--color-primary)]',
          props.disabled && 'opacity-50 cursor-not-allowed',
        ]}
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onInput={handleInput}
        onKeydown={handleKeydown}
      />
    )
  },
})
