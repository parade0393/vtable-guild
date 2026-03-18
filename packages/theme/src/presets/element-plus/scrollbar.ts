import type { ThemeConfig } from '@vtable-guild/core'

export const elementPlusScrollbarTheme = {
  slots: {
    root: 'relative overflow-hidden',
    wrap: 'overflow-auto scrollbar-none h-full',
    view: '',
    track: 'absolute z-[1] rounded transition-opacity duration-300',
    trackVertical: 'right-0.5 top-0.5 bottom-0.5 w-[var(--vtg-scrollbar-thumb-width)]',
    trackHorizontal: 'bottom-0.5 left-0.5 right-0.5 h-[var(--vtg-scrollbar-thumb-width)]',
    thumb: [
      'relative w-full',
      'rounded-[var(--vtg-scrollbar-thumb-radius)]',
      'bg-[color:var(--vtg-scrollbar-thumb-bg)]',
      'hover:bg-[color:var(--vtg-scrollbar-thumb-hover-bg)]',
      'transition-colors cursor-pointer',
    ].join(' '),
  },
  defaultVariants: {},
} as const satisfies ThemeConfig

export type ElementPlusScrollbarSlots = keyof typeof elementPlusScrollbarTheme.slots
export type ElementPlusScrollbarThemeConfig = typeof elementPlusScrollbarTheme
