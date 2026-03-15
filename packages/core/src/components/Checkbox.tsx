import { defineComponent, type PropType } from 'vue'
import { useTheme } from '../composables/useTheme'
import type { ThemeConfig, SlotProps } from '../utils/types'

/**
 * 默认 Checkbox 主题（antdv 预设）。
 *
 * 与 packages/theme/src/presets/antdv/checkbox.ts 保持一致。
 */
const defaultCheckboxTheme = {
  slots: {
    root: [
      'inline-flex items-center justify-center',
      'w-[var(--vtg-checkbox-size)] h-[var(--vtg-checkbox-size)]',
      'rounded-[var(--vtg-checkbox-border-radius)]',
      'border border-[color:var(--color-border,#d9d9d9)]',
      'bg-[color:var(--color-surface)]',
      'cursor-pointer transition-all duration-300 shrink-0',
      'hover:border-[color:var(--color-primary)]',
    ].join(' '),
    indicator: '',
  },
  variants: {
    checked: {
      true: {
        root: 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-hover)] hover:border-transparent',
      },
    },
    indeterminate: {
      true: {
        root: 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]',
      },
    },
    disabled: {
      true: {
        root: 'bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] border-[color:var(--color-border,#d9d9d9)] cursor-not-allowed hover:border-[color:var(--color-border,#d9d9d9)]',
      },
    },
  },
  defaultVariants: {
    checked: false,
    indeterminate: false,
    disabled: false,
  },
} as const satisfies ThemeConfig

type CheckboxSlots = keyof typeof defaultCheckboxTheme.slots

export default defineComponent({
  name: 'VCheckbox',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<CheckboxSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
  },
  emits: ['update:checked', 'change'],
  setup(props, { emit }) {
    const { slots: themeSlots } = useTheme('checkbox', defaultCheckboxTheme, props)

    function handleClick(e: MouseEvent) {
      if (props.disabled) return
      const next = !props.checked
      emit('update:checked', next)
      emit('change', next, e)
    }

    return () => (
      <span
        role="checkbox"
        aria-checked={props.indeterminate ? 'mixed' : props.checked}
        aria-disabled={props.disabled}
        class={themeSlots.root()}
        onClick={handleClick}
      >
        {props.indeterminate && !props.checked ? (
          <svg viewBox="0 0 1024 1024" width="12" height="12" fill="#fff" aria-hidden="true">
            <path d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
          </svg>
        ) : props.checked ? (
          <svg viewBox="64 64 896 896" width="12" height="12" fill="#fff" aria-hidden="true">
            <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" />
          </svg>
        ) : null}
      </span>
    )
  },
})
