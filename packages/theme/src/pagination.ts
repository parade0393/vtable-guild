// packages/theme/src/pagination.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Pagination 组件的默认主题定义。
 */
export const paginationTheme = {
  slots: {
    root: 'flex items-center gap-1 text-sm text-on-surface',
    item: [
      'inline-flex items-center justify-center',
      'min-w-8 h-8 px-2 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    itemActive: [
      'inline-flex items-center justify-center',
      'min-w-8 h-8 px-2 rounded',
      'bg-primary text-white cursor-default',
    ].join(' '),
    prev: [
      'inline-flex items-center justify-center',
      'size-8 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    next: [
      'inline-flex items-center justify-center',
      'size-8 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    ellipsis: 'inline-flex items-center justify-center size-8 text-muted',
    jumper: 'inline-flex items-center gap-2 text-sm text-muted',
    jumperInput: [
      'w-12 h-8 px-2 rounded border border-default',
      'text-center text-sm text-on-surface bg-surface',
      'outline-none focus:border-primary',
    ].join(' '),
    sizeChanger: [
      'h-8 px-2 rounded border border-default',
      'text-sm text-on-surface bg-surface',
      'outline-none focus:border-primary cursor-pointer',
    ].join(' '),
    total: 'text-sm text-muted',
  },
  variants: {
    size: {
      sm: {},
      md: {},
    },
    simple: {
      true: {
        root: 'gap-2',
      },
    },
  },
  compoundSlots: [
    {
      slots: ['item', 'itemActive', 'prev', 'next'],
      size: 'sm',
      class: 'min-w-6 h-6 px-1 text-xs',
    },
  ],
  defaultVariants: {
    size: 'md',
    simple: false,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

export type PaginationSlots = keyof typeof paginationTheme.slots

export type PaginationVariantProps = {
  size?: 'sm' | 'md'
  simple?: boolean
}
