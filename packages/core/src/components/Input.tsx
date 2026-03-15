import { defineComponent, type PropType } from 'vue'
import { useTheme } from '../composables/useTheme'
import type { ThemeConfig, SlotProps } from '../utils/types'

/**
 * 默认 Input 主题（antdv 预设）。
 *
 * 与 packages/theme/src/presets/antdv/input.ts 保持一致。
 */
const defaultInputTheme = {
  slots: {
    root: [
      'w-full box-border',
      'rounded-[var(--vtg-input-border-radius)]',
      'h-[var(--vtg-input-height)]',
      'px-[var(--vtg-input-padding-inline)]',
      'text-[length:var(--vtg-input-font-size)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'leading-[var(--vtg-table-line-height)]',
      'bg-[color:var(--color-surface)]',
      'text-[color:var(--color-on-surface)]',
      'border border-[color:var(--color-border,#d9d9d9)]',
      'outline-none transition-all duration-200',
      'focus:border-[color:var(--color-primary)]',
      'focus:shadow-[0_0_0_2px_rgba(5,145,255,0.1)]',
      'placeholder:text-[color:var(--color-text-placeholder,rgba(0,0,0,0.25))]',
      'hover:border-[color:var(--color-primary-hover)]',
    ].join(' '),
  },
  variants: {
    bare: {
      true: {
        root: 'min-w-0 bg-transparent outline-none border-0 shadow-none p-0 focus:shadow-none',
      },
    },
    disabled: {
      true: {
        root: 'bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] text-[color:var(--color-text-disabled)] cursor-not-allowed',
      },
    },
  },
  defaultVariants: {
    bare: false,
    disabled: false,
  },
} as const satisfies ThemeConfig

type InputSlots = keyof typeof defaultInputTheme.slots

export default defineComponent({
  name: 'VInput',
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    bare: { type: Boolean, default: false },
    inputClass: { type: [String, Array, Object], default: undefined },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<InputSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
  },
  emits: ['update:value', 'change', 'pressEnter'],
  setup(props, { emit }) {
    const { slots: themeSlots } = useTheme('input', defaultInputTheme, props)

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
        class={[themeSlots.root(), props.inputClass]}
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
