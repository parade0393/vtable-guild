import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Checkbox 主题。
 *
 * 精确对齐 antdv Checkbox 组件样式：
 * - size: 16px (via CSS var)
 * - border-radius: 4px
 * - transition: 0.3s
 * - hover: border 变 primary
 * - disabled: 灰底灰边，无 opacity
 */
export const antdvCheckboxTheme = {
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
        root: '',
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

export type AntdvCheckboxSlots = keyof typeof antdvCheckboxTheme.slots
export type AntdvCheckboxThemeConfig = typeof antdvCheckboxTheme
