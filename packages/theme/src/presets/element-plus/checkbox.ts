import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Checkbox 主题。
 *
 * 与 antdv 的主要差异：
 * - size: 14px（antdv 16px）
 * - border-radius: 2px（antdv 4px）
 * - transition: 0.25s cubic-bezier(0.71, -0.46, 0.29, 1.46) bounce easing
 * - disabled checked: bg #f2f6fc, checkmark #a8abb2
 */
export const elementPlusCheckboxTheme = {
  slots: {
    root: [
      'relative inline-flex items-center justify-center',
      'w-[var(--vtg-checkbox-size)] h-[var(--vtg-checkbox-size)]',
      'rounded-[var(--vtg-checkbox-border-radius)]',
      'border border-[color:var(--color-border,#dcdfe6)]',
      'bg-[color:var(--color-surface)]',
      'cursor-pointer transition-all duration-[250ms] ease-[cubic-bezier(0.71,-0.46,0.29,1.46)] shrink-0',
      'hover:border-[color:var(--color-primary)]',
    ].join(' '),
    indicator: '',
  },
  variants: {
    checked: {
      true: {
        root: 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]',
      },
    },
    indeterminate: {
      true: {
        root: 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]',
      },
    },
    disabled: {
      true: {
        root: 'bg-[color:var(--color-bg-disabled,#f5f7fa)] border-[color:var(--color-border,#dcdfe6)] cursor-not-allowed hover:border-[color:var(--color-border,#dcdfe6)]',
      },
    },
  },
  defaultVariants: {
    checked: false,
    indeterminate: false,
    disabled: false,
  },
} as const satisfies ThemeConfig
