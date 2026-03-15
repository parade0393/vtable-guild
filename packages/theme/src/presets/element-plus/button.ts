import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Button 主题。
 *
 * 与 antdv 的主要差异：
 * - font-weight: 500（antdv 400）
 * - transition: 0.1s（antdv 0.2s）
 * - border-radius: 4px base / 3px sm（antdv 6px/4px）
 * - Primary hover: bg #79bbff (light-3)，active: #337ecc (dark-2)
 * - Default hover: text #409eff, bg #ecf5ff, border #c6e2ff
 * - 无 box-shadow
 */
export const elementPlusButtonTheme = {
  slots: {
    root: 'inline-flex items-center justify-center border font-medium transition-all duration-100 leading-[1] cursor-pointer',
    inner: '',
  },
  variants: {
    type: {
      default: {
        root: 'bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] border-[color:var(--color-border,#dcdfe6)] hover:text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light-9,#ecf5ff)] hover:border-[color:var(--color-primary-light-7,#c6e2ff)]',
      },
      primary: {
        root: 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light-3,#79bbff)] hover:border-[color:var(--color-primary-light-3,#79bbff)] active:bg-[color:var(--color-primary-active,#337ecc)] active:border-[color:var(--color-primary-active,#337ecc)]',
      },
      link: {
        root: 'bg-transparent text-[color:var(--color-primary)] border-transparent hover:text-[color:var(--color-primary-light-3,#79bbff)] active:text-[color:var(--color-primary-active,#337ecc)]',
      },
    },
    size: {
      sm: {
        root: 'h-[var(--vtg-btn-height-sm)] px-[var(--vtg-btn-padding-sm)] rounded-[var(--vtg-btn-border-radius-sm,3px)] text-[length:var(--vtg-table-font-size)]',
      },
      md: {
        root: 'h-[var(--vtg-btn-height-md)] px-[var(--vtg-btn-padding-md)] rounded-[var(--vtg-btn-border-radius)] text-[length:var(--vtg-table-font-size)]',
      },
    },
    disabled: {
      true: {
        root: 'cursor-not-allowed',
      },
    },
  },
  compoundVariants: [
    {
      type: 'default',
      disabled: true,
      class: {
        root: 'bg-[color:var(--color-surface)] text-[color:var(--color-text-disabled)] border-[color:var(--color-border,#dcdfe6)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text-disabled)] hover:border-[color:var(--color-border,#dcdfe6)]',
      },
    },
    {
      type: 'primary',
      disabled: true,
      class: {
        root: 'bg-[color:var(--color-primary-light-7,#c6e2ff)] text-white border-[color:var(--color-primary-light-7,#c6e2ff)] hover:bg-[color:var(--color-primary-light-7,#c6e2ff)] hover:text-white hover:border-[color:var(--color-primary-light-7,#c6e2ff)]',
      },
    },
    {
      type: 'link',
      disabled: true,
      class: {
        root: 'text-[color:var(--color-text-disabled)] hover:text-[color:var(--color-text-disabled)]',
      },
    },
    {
      type: 'link',
      size: 'sm',
      class: {
        root: 'px-[3px]',
      },
    },
  ],
  defaultVariants: {
    type: 'default',
    size: 'md',
    disabled: false,
  },
} as const satisfies ThemeConfig
