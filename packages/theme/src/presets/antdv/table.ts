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
/** 对齐类映射，由 cell 组件消费，同时确保类名进入 theme dist 被 Tailwind 扫描 */
export const TABLE_ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export const antdvTableTheme = {
  slots: {
    root: 'relative w-full',
    wrapper: 'w-full overflow-auto',
    table: [
      'w-full border-separate border-spacing-0',
      'bg-[var(--vtg-table-bg)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)]',
      'leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    thead: '',
    tbody: '',
    tr: 'group/row transition-colors',
    th: [
      'relative text-left font-semibold',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-header-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
      // 表头 cell 间分割线（::before 伪元素）
      'before:absolute before:end-0 before:top-1/2 before:-translate-y-1/2',
      'before:block before:w-px before:h-[1.6em]',
      'before:bg-[var(--vtg-table-header-split-color)]',
      'last:before:bg-transparent',
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
    headerCellInner: 'flex items-center',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',

    // ---- 排序相关 ----
    thSortable: 'cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]',
    sortButton: 'inline-flex flex-col items-center justify-center text-xs leading-none ml-1',
    sortIconDown: '-mt-[0.225em]',
    sortAreaWrapper: 'flex flex-auto items-center justify-between min-w-0',
    sortAreaTitle: 'flex-1 min-w-0',

    // ---- 筛选图标相关 ----
    filterIconWrapper: 'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center',
    filterIcon:
      'inline-flex items-center justify-center cursor-pointer transition-colors text-xs px-1 self-stretch rounded-md hover:bg-black/6',

    // ---- 筛选下拉相关 ----
    filterDropdown: 'rounded-lg bg-[color:var(--color-surface)] shadow-lg text-sm',
    filterDropdownList: 'max-h-64 overflow-auto p-1 m-0 list-none min-w-[120px]',
    filterDropdownItem: 'flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm',
    filterDropdownItemSelected:
      'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-hover-bg)]',
    filterDropdownItemHover: 'hover:bg-[color:var(--color-control-item-hover-bg)]',
    filterDropdownActions:
      'flex items-center justify-between gap-2 px-2 py-2 border-t border-[color:var(--color-default)]',
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
        th: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0 before:hidden',
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

/** 窄类型：保留 `as const` 的字面量 slot key，供 resolver 返回。 */
export type AntdvTableThemeConfig = typeof antdvTableTheme
