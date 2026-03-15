import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Button 主题。
 *
 * 精确对齐 antdv Button 组件样式：
 * - transition: 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)
 * - font-weight: 400 (normal)
 * - leading: 1.5714
 * - box-shadow: 0 2px 0 rgba(0,0,0,0.02)
 * - disabled: 统一灰底灰字灰边，无 opacity
 */
export const antdvButtonTheme = {
  slots: {
    root: 'inline-flex items-center justify-center border font-normal transition-all duration-200 ease-[cubic-bezier(0.645,0.045,0.355,1)] leading-[1.5714] cursor-pointer',
    inner: '',
  },
  variants: {
    type: {
      default: {
        root: 'bg-[color:var(--color-surface)] text-[color:var(--color-on-surface)] border-[color:var(--color-border,#d9d9d9)] shadow-[0_2px_0_rgba(0,0,0,0.02)] hover:text-[color:var(--color-primary-hover)] hover:border-[color:var(--color-primary-hover)]',
      },
      primary: {
        root: 'bg-[color:var(--color-primary)] text-white border-transparent shadow-[0_2px_0_rgba(5,145,255,0.1)] hover:bg-[color:var(--color-primary-hover)] active:bg-[color:var(--color-primary-active,#0958d9)]',
      },
      link: {
        root: 'bg-transparent text-[color:var(--color-primary)] border-transparent shadow-none hover:text-[color:var(--color-primary-hover)] active:text-[color:var(--color-primary-active,#0958d9)]',
      },
    },
    size: {
      sm: {
        root: 'h-[var(--vtg-btn-height-sm)] px-[var(--vtg-btn-padding-sm)] rounded-[var(--vtg-btn-border-radius-sm,4px)] text-[length:var(--vtg-table-font-size)]',
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
        root: 'bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] text-[color:var(--color-text-disabled)] border-[color:var(--color-border,#d9d9d9)] shadow-none hover:bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] hover:text-[color:var(--color-text-disabled)] hover:border-[color:var(--color-border,#d9d9d9)]',
      },
    },
    {
      type: 'primary',
      disabled: true,
      class: {
        root: 'bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] text-[color:var(--color-text-disabled)] border-[color:var(--color-border,#d9d9d9)] shadow-none hover:bg-[color:var(--color-bg-disabled,rgba(0,0,0,0.04))] hover:text-[color:var(--color-text-disabled)] hover:border-[color:var(--color-border,#d9d9d9)]',
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
        root: 'px-1',
      },
    },
  ],
  defaultVariants: {
    type: 'default',
    size: 'md',
    disabled: false,
  },
} as const satisfies ThemeConfig

export type AntdvButtonSlots = keyof typeof antdvButtonTheme.slots
export type AntdvButtonThemeConfig = typeof antdvButtonTheme
