import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VInput',
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    bare: { type: Boolean, default: false },
    inputClass: { type: [String, Array, Object], default: undefined },
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
          !props.bare &&
            'w-full box-border rounded-[var(--vtg-input-border-radius)] h-[var(--vtg-input-height)]',
          !props.bare &&
            'px-[var(--vtg-input-padding-inline)] text-[length:var(--vtg-input-font-size)]',
          !props.bare &&
            'font-[family-name:var(--vtg-table-font-family)] leading-[var(--vtg-table-line-height)]',
          !props.bare && 'bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)]',
          !props.bare &&
            'border border-[color:var(--color-default)] outline-none transition-colors',
          !props.bare && 'focus:border-[color:var(--color-primary)]',
          props.bare && 'min-w-0 bg-transparent outline-none',
          props.disabled && 'opacity-50 cursor-not-allowed',
          props.inputClass,
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
