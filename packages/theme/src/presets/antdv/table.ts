// packages/theme/src/presets/antdv/table.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Table 主题。
 *
 * 使用 --vtg-table-* CSS 变量实现视觉对齐。
 * 亮色/暗色通过 preset CSS（如 presets/antdv.css）中的 :root / .dark 切换。
 *
 * ⚠️ 注意 Tailwind CSS 4 消歧语法：
 * - text-[color:var(...)] 用于文字颜色
 * - text-[length:var(...)] 用于字号
 * - 不要使用 text-[var(...)]，Tailwind 无法推断意图
 */
export const antdvTableTheme = {
  slots: {
    root: 'relative w-full',
    wrapper: 'w-full overflow-auto',
    table: [
      'w-full border-separate border-spacing-0',
      'bg-[var(--vtg-table-bg)]',
      'text-[length:var(--vtg-table-font-size)]',
      'leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    thead: '',
    tbody: '',
    tr: 'group/row transition-colors',
    th: [
      'relative text-left font-medium',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-header-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    td: [
      'align-middle',
      'bg-[var(--vtg-table-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    empty: 'py-16 text-center text-[color:rgba(0,0,0,0.25)]',
    loading: [
      'absolute inset-0 z-[2]',
      'flex items-center justify-center',
      'bg-[rgba(255,255,255,0.65)] backdrop-blur-[1px]',
    ].join(' '),
    headerCellInner: 'inline-flex items-center gap-1',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',
  },
  variants: {
    size: {
      lg: {},
      md: {},
      sm: {},
    },
    bordered: {
      true: {
        table: 'border border-[var(--vtg-table-border-color)]',
        th: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
        td: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'odd:group-even/row:bg-[rgba(0,0,0,0.02)]',
      },
    },
    hoverable: {
      true: {
        td: 'group-hover/row:bg-[var(--vtg-table-row-hover-bg)]',
      },
    },
  },
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'lg',
      class:
        'px-[var(--vtg-table-cell-padding-inline-lg)] py-[var(--vtg-table-cell-padding-block-lg)]',
    },
    {
      slots: ['th', 'td'],
      size: 'md',
      class:
        'px-[var(--vtg-table-cell-padding-inline-md)] py-[var(--vtg-table-cell-padding-block-md)]',
    },
    {
      slots: ['th', 'td'],
      size: 'sm',
      class:
        'px-[var(--vtg-table-cell-padding-inline-sm)] py-[var(--vtg-table-cell-padding-block-sm)]',
    },
  ],
  defaultVariants: {
    size: 'lg',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

export type AntdvTableSlots = keyof typeof antdvTableTheme.slots

export type AntdvTableVariantProps = {
  size?: 'lg' | 'md' | 'sm'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
