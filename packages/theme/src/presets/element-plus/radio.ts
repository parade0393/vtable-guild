import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Radio 主题。
 *
 * 与 antdv 的主要差异：
 * - size: 14px（antdv 16px）
 * - inner dot: 4px fixed（antdv 用 scale 实现）
 * - checked: border + bg primary, dot 白色
 * - transition: 0.15s ease-in（更快）
 */
export const elementPlusRadioTheme = {
  slots: {
    root: [
      'inline-flex items-center justify-center',
      'w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)]',
      'rounded-full',
      'border border-[length:var(--vtg-radio-border-width)] border-[color:var(--color-border,#dcdfe6)]',
      'bg-[color:var(--color-surface)]',
      'cursor-pointer transition-all duration-150 ease-in shrink-0',
      'hover:border-[color:var(--color-primary)]',
    ].join(' '),
    dot: 'rounded-full w-[var(--vtg-radio-size)] h-[var(--vtg-radio-size)] transition-transform duration-150 ease-in',
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
        root: 'bg-[color:var(--color-bg-disabled,#f5f7fa)] cursor-not-allowed hover:border-[color:var(--color-border,#dcdfe6)]',
      },
    },
  },
  defaultVariants: {
    checked: false,
    disabled: false,
  },
} as const satisfies ThemeConfig
