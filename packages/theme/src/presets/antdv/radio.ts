import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Radio 主题。
 *
 * 精确对齐 antdv Radio 组件样式：
 * - size: 16px (via CSS var)
 * - rounded-full
 * - transition: 0.3s, cubic-bezier(0.78, 0.14, 0.15, 0.86)
 * - checked: primary bg, inner dot scale(0.375)
 * - disabled: 灰底灰边，无 opacity
 */
export const antdvRadioTheme = {
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

export type AntdvRadioSlots = keyof typeof antdvRadioTheme.slots
export type AntdvRadioThemeConfig = typeof antdvRadioTheme
