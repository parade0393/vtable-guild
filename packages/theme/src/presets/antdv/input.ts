import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Input 主题。
 *
 * 精确对齐 antdv Input 组件样式：
 * - border-radius: 6px
 * - hover: border 变 primary-hover
 * - focus: border 变 primary, shadow 0 0 0 2px rgba(5,145,255,0.1)
 * - placeholder: rgba(0,0,0,0.25)
 * - disabled: 灰底灰字，无 opacity
 * - bare 变体: 无边框无背景（用于搜索框内嵌）
 */
export const antdvInputTheme = {
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

export type AntdvInputSlots = keyof typeof antdvInputTheme.slots
export type AntdvInputThemeConfig = typeof antdvInputTheme
