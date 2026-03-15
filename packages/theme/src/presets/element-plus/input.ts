import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Input 主题。
 *
 * 与 antdv 的主要差异：
 * - border-radius: 4px（antdv 6px）
 * - hover border: #c0c4cc（非 primary）
 * - focus: border #409eff，无 shadow（antdv 有 focus shadow）
 * - placeholder: #a8abb2
 */
export const elementPlusInputTheme = {
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
      'border border-[color:var(--color-border,#dcdfe6)]',
      'outline-none transition-all duration-200',
      'focus:border-[color:var(--color-primary)]',
      'placeholder:text-[color:var(--color-text-placeholder,#a8abb2)]',
      'hover:border-[color:var(--color-border-hover,#c0c4cc)]',
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
        root: 'bg-[color:var(--color-bg-disabled,#f5f7fa)] text-[color:var(--color-text-disabled)] cursor-not-allowed',
      },
    },
  },
  defaultVariants: {
    bare: false,
    disabled: false,
  },
} as const satisfies ThemeConfig
