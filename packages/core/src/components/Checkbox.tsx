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
      'relative inline-flex items-center justify-center',
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
        {/* Checked: border-based checkmark (antdv ::after style) */}
        <span
          aria-hidden="true"
          style={{
            display: props.checked ? 'block' : 'none',
            boxSizing: 'border-box',
            position: 'absolute',
            top: '50%',
            insetInlineStart: '21.5%',
            width: '5.71px',
            height: '9.14px',
            borderBottom: '2px solid #fff',
            borderRight: '2px solid #fff',
            transform: 'rotate(45deg) scale(1) translate(-50%, -50%)',
            transformOrigin: 'top left',
          }}
        />
        {/* Indeterminate: solid square (antdv ::after style) */}
        <span
          aria-hidden="true"
          style={{
            display: props.indeterminate && !props.checked ? 'block' : 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            backgroundColor: '#fff',
            transform: 'translate(-50%, -50%)',
            borderRadius: '1px',
          }}
        />
      </span>
    )
  },
})
