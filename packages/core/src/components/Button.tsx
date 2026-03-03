import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'VButton',
  props: {
    type: {
      type: String as PropType<'default' | 'primary' | 'link'>,
      default: 'default',
    },
    size: {
      type: String as PropType<'sm' | 'md'>,
      default: 'md',
    },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    function handleClick(e: MouseEvent) {
      if (props.disabled) return
      emit('click', e)
    }

    return () => {
      const sizeClass = props.size === 'sm' ? 'h-6 px-[7px] text-xs' : 'h-8 px-4 text-sm'

      const typeClass = (() => {
        switch (props.type) {
          case 'primary':
            return 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)] hover:opacity-90'
          case 'link':
            return 'bg-transparent text-[color:var(--color-primary)] border-transparent hover:opacity-80'
          default:
            return 'bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] border-[color:var(--color-default)] hover:text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)]'
        }
      })()

      return (
        <button
          class={[
            'inline-flex items-center justify-center rounded border cursor-pointer transition-all leading-none',
            sizeClass,
            typeClass,
            props.disabled && 'opacity-50 cursor-not-allowed',
          ]}
          disabled={props.disabled}
          onClick={handleClick}
        >
          {slots.default?.()}
        </button>
      )
    }
  },
})
