// packages/theme/src/table.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Table 组件的默认主题定义。
 *
 * 使用语义化颜色 token（bg-surface、text-muted、border-default 等），
 * 暗色模式通过 CSS 变量切换，无需 dark: 前缀。
 */
export const tableTheme = {
  slots: {
    root: 'w-full',
    wrapper: 'overflow-auto',
    table: 'w-full border-collapse text-sm text-on-surface',
    thead: '',
    tbody: '',
    tr: 'border-b border-default transition-colors',
    th: 'px-4 py-3 text-left font-medium text-muted',
    td: 'px-4 py-3',
    empty: 'py-8 text-center text-muted',
    loading: 'absolute inset-0 flex items-center justify-center bg-surface/60',
    sortIcon: 'ml-1 inline-block size-4 text-muted',
    filterIcon: 'ml-1 inline-block size-4 text-muted',
    selectionCell: 'w-12 px-4 py-3 text-center',
    expandIcon: 'inline-flex size-4 cursor-pointer text-muted',
    resizeHandle: 'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary',
  },
  variants: {
    size: {
      sm: {}, // 具体样式由 compoundSlots 统一定义
      md: {},
      lg: {},
    },
    bordered: {
      true: {
        table: 'border border-default',
        th: 'border border-default',
        td: 'border border-default',
      },
    },
    striped: {
      true: { tr: 'even:bg-elevated/50' },
    },
    hoverable: {
      true: { tr: 'hover:bg-surface-hover' },
    },
  },
  // ---------- compoundSlots ----------
  // th 和 td 在各 size 下共享相同的 padding 和字号，
  // 使用 compoundSlots 避免在 variants.size 中重复写两遍。
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'sm',
      class: 'px-2 py-1.5 text-xs',
    },
    {
      slots: ['th', 'td'],
      size: 'md',
      class: 'px-4 py-3 text-sm',
    },
    {
      slots: ['th', 'td'],
      size: 'lg',
      class: 'px-6 py-4 text-base',
    },
  ],
  compoundVariants: [
    // bordered + sm 时缩小 padding
    {
      bordered: true,
      size: 'sm',
      class: { th: 'px-2 py-1', td: 'px-2 py-1' },
    },
  ],
  defaultVariants: {
    size: 'md',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

/** Table 主题的 slot 名联合类型 */
export type TableSlots = keyof typeof tableTheme.slots

/** Table 主题的 variant props 类型（size, bordered, striped, hoverable） */
export type TableVariantProps = {
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
