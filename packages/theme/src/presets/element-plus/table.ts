import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Table 主题。
 *
 * 使用 --vtg-table-* CSS 变量实现视觉对齐。
 * 亮色/暗色通过 preset CSS（如 presets/element-plus.css）中的 :root / .dark 切换。
 *
 * 与 antdv 的主要视觉差异：
 * - th font-weight: medium（antdv 为 semibold）
 * - header bg: 白色（antdv 为 #fafafa）
 * - 无表头分割线（antdv 有 ::before 伪元素）
 * - header text color: muted（antdv 同正文色）
 * - dropdown border-radius: 4px（antdv 为 8px）
 * - 选中项样式：文字高亮（antdv 为背景高亮）
 * - sort caret 间距更小
 */

/** 对齐类映射，由 cell 组件消费 */
export const TABLE_ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export const elementPlusTableTheme = {
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
      'relative text-left font-medium',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-header-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
      // Element Plus: 无表头分割线
    ].join(' '),
    td: [
      'align-middle',
      'bg-[var(--vtg-table-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    empty: 'py-16 text-center text-[color:var(--color-muted)]',
    loading: [
      'absolute inset-0 z-[2]',
      'flex items-center justify-center',
      'bg-[rgba(255,255,255,0.9)]',
    ].join(' '),
    headerCellInner: 'flex items-center',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',

    // ---- 排序相关 ----
    thSortable: 'cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]',
    sortButton: 'inline-flex flex-col items-center justify-center text-xs leading-none ml-1',
    sortIconDown: '-mt-px',
    sortAreaWrapper: 'flex flex-auto items-center min-w-0',
    sortAreaTitle: 'min-w-0',

    // ---- 筛选图标相关 ----
    filterIconWrapper: 'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center',
    filterIcon:
      'inline-flex items-center justify-center cursor-pointer transition-colors text-xs px-1 self-stretch',

    // ---- 筛选下拉相关 ----
    filterDropdown:
      'rounded bg-[color:var(--color-surface)] shadow-lg text-sm border border-[color:var(--color-default)]',
    filterDropdownList: 'max-h-64 overflow-auto p-1.5 m-0 list-none min-w-[120px]',
    filterDropdownItem: 'flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm',
    filterDropdownItemSelected: 'text-[color:var(--color-primary)] font-medium',
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
        th: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
        td: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'odd:group-even/row:bg-[var(--color-surface-hover)]',
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
    size: 'md',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

/** 标记 element-plus 主题已实现 */
export const ELEMENT_PLUS_THEME_IMPLEMENTED = true
