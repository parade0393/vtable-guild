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
    checkMark: [
      'pointer-events-none absolute box-content',
      'top-1/2 left-1/2',
      'w-[3px] h-[7px]',
      'border border-transparent border-l-0 border-t-0',
      'border-[color:var(--vtg-checkbox-check-color,#fff)]',
      '[transform:translate(-45%,_-60%)_rotate(45deg)]',
      '[transform-origin:center]',
    ].join(' '),
    indeterminateMark: [
      'pointer-events-none absolute left-0 right-0 top-[5px]',
      'w-[12px] rounded-none translate-x-0 translate-y-0',
      'h-[2px] bg-[color:var(--vtg-checkbox-indeterminate-color,#fff)]',
      '[transform:scale(.5)]',
    ].join(' '),
  },
  variants: {
    checked: {
      true: {
        root: [
          'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]',
          'hover:bg-[color:var(--color-primary)] hover:border-[color:var(--color-primary)]',
        ].join(' '),
      },
    },
    indeterminate: {
      true: {
        root: [
          'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]',
          'hover:bg-[color:var(--color-primary)] hover:border-[color:var(--color-primary)]',
        ].join(' '),
      },
    },
    disabled: {
      true: {
        root: [
          'bg-[color:var(--color-bg-disabled,#f5f7fa)]',
          'border-[color:var(--color-border,#dcdfe6)]',
          'cursor-not-allowed hover:border-[color:var(--color-border,#dcdfe6)]',
          '[--vtg-checkbox-check-color:var(--color-text-placeholder,#a8abb2)]',
          '[--vtg-checkbox-indeterminate-color:var(--color-text-placeholder,#a8abb2)]',
        ].join(' '),
      },
    },
  },
  defaultVariants: {
    checked: false,
    indeterminate: false,
    disabled: false,
  },
} as const satisfies ThemeConfig
