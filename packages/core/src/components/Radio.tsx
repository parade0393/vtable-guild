import { defineComponent, type PropType } from 'vue'
import { useTheme } from '../composables/useTheme'
import type { ThemeConfig, SlotProps } from '../utils/types'

/**
 * 默认 Radio 主题（antdv 预设）。
 *
 * 与 packages/theme/src/presets/antdv/radio.ts 保持一致。
 */
const defaultRadioTheme = {
  slots: {
    root: [
      'inline-flex items-center justify-center',
      'w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)]',
      'rounded-full',
      'border border-[length:var(--vtg-radio-border-width)] border-[color:var(--color-border,#d9d9d9)]',
      'bg-[color:var(--color-surface)]',
      'cursor-pointer transition-all duration-300 shrink-0',
      'hover:border-[color:var(--color-primary)]',
    ].join(' '),
    dot: 'rounded-full w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)] transition-transform duration-300 ease-[cubic-bezier(0.78,0.14,0.15,0.86)]',
  },
  variants: {
    checked: {
      true: {
        root: 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]',
        dot: 'scale-[0.375] bg-[color:var(--color-surface)]',
      },
    },
    disabled: {
      true: {
        root: 'bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] cursor-not-allowed hover:border-[color:var(--color-border,#d9d9d9)]',
      },
    },
  },
  defaultVariants: {
    checked: false,
    disabled: false,
  },
} as const satisfies ThemeConfig

type RadioSlots = keyof typeof defaultRadioTheme.slots

export default defineComponent({
  name: 'VRadio',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<RadioSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
  },
  emits: ['update:checked', 'change'],
  setup(props, { emit }) {
    const { slots: themeSlots } = useTheme('radio', defaultRadioTheme, props)

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
        class={themeSlots.root()}
        onClick={handleClick}
      >
        <span aria-hidden="true" class={themeSlots.dot()} />
      </span>
    )
  },
})
