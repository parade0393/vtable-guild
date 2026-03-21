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
      'relative text-left font-semibold',
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
    empty: 'py-5 text-center text-[color:var(--color-muted)]',
    loading: [
      'absolute inset-0 z-[2]',
      'flex items-center justify-center',
      'bg-[color:var(--vtg-table-loading-overlay-bg)]',
    ].join(' '),
    headerCellInner: 'flex items-center',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',

    // ---- 排序相关 ----
    thSortable: 'cursor-pointer select-none',
    sortButton: 'inline-flex flex-col items-center justify-center text-xs leading-none ml-1',
    sortIconDown: '-mt-[5px]',
    sortAreaOuter: 'flex min-w-0',
    sortAreaWrapper: 'flex items-center min-w-0',
    sortAreaTitle: 'min-w-0',

    // ---- 筛选图标相关 ----
    filterIconWrapper: 'shrink-0 flex items-center',
    filterIcon:
      'inline-flex items-center justify-center cursor-pointer transition-colors text-sm px-1 self-stretch',

    // ---- 筛选下拉相关 ----
    filterDropdown: [
      'rounded bg-[color:var(--color-surface)] shadow-lg border border-[color:var(--color-default)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    filterDropdownList: 'p-1.5 m-0 list-none min-w-[120px]',
    filterDropdownItem: 'flex items-center cursor-pointer',
    filterDropdownItemSelected:
      'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-hover-bg)] text-[color:var(--color-primary)] font-medium',
    filterDropdownItemHover: 'hover:bg-[color:var(--color-control-item-hover-bg)]',
    // 树形筛选 switcher 图标
    filterDropdownSwitcher:
      'inline-flex items-center justify-center w-6 h-6 cursor-pointer text-xs text-[color:var(--color-muted)] transition-transform duration-200',
    filterDropdownSwitcherExpanded: 'rotate-0',
    filterDropdownSwitcherCollapsed: '-rotate-90',
    filterDropdownSwitcherNoop: 'cursor-default invisible',
    // 内容包裹层（checkbox + 文字），hover/selected 仅在此
    filterDropdownContentWrapper: 'flex items-center gap-2 px-3 py-1.5 rounded-sm flex-1 min-w-0',
    filterDropdownTreeWrapper: 'p-1.5',
    filterDropdownTreeList: 'm-0 p-0 list-none [--vtg-table-filter-tree-indent-size:24px]',
    filterDropdownTreeItem: 'flex items-center cursor-pointer',
    filterDropdownTreeContentWrapper:
      'flex items-center gap-2 px-3 py-1.5 rounded-sm flex-1 min-w-0',
    filterDropdownTreeItemSelected:
      'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-hover-bg)] text-[color:var(--color-primary)] font-medium',
    filterDropdownTreeCheckAll: 'flex items-center cursor-pointer',
    filterDropdownActions:
      'flex items-center justify-between gap-2 px-2 py-2 border-t border-[color:var(--color-default)]',
    filterDropdownSearch: 'px-2 pt-2 pb-1',
    filterDropdownSearchField:
      'flex items-center gap-2 rounded-[var(--vtg-input-border-radius)] border border-[color:var(--color-default)] bg-[color:var(--color-surface)] px-2',
    filterDropdownSearchIcon:
      'inline-flex shrink-0 items-center justify-center text-[12px] text-[color:var(--color-muted)]',
    filterDropdownSearchInput:
      'min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus:border-transparent placeholder:text-[color:var(--color-muted)]',
    filterDropdownListEmpty:
      'px-3 py-3 text-center text-[length:12px] leading-5 text-[color:var(--color-muted)] select-none cursor-default',

    // ---- 空状态相关 ----
    emptyWrapper: 'flex flex-col items-center justify-center',
    emptyIcon: 'mb-2',
    emptyText: 'm-0 text-[color:var(--color-muted)] text-sm leading-[60px]',

    // ---- 加载状态相关 ----
    loadingSpinner:
      'inline-flex items-center justify-center text-[length:42px] text-[color:var(--color-primary)] animate-spin',

    // ---- 行选中背景 ----
    tdSelected: 'bg-[var(--vtg-table-row-selected-bg)]',
    tdSelectedHover: 'group-hover/row:bg-[var(--vtg-table-row-selected-hover-bg)]',

    // ---- 选择下拉相关 ----
    selectionDropdown: [
      'rounded bg-[color:var(--color-surface)] shadow-lg border border-[color:var(--color-default)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
      'p-1 min-w-[120px]',
    ].join(' '),
    selectionDropdownItem:
      'flex items-center cursor-pointer px-3 py-1.5 rounded-sm hover:bg-[color:var(--color-control-item-hover-bg)]',
    selectionExtra:
      'inline-flex items-center justify-center cursor-pointer ml-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors',

    // ---- 标题/页脚/摘要行 ----
    title: [
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'font-medium',
    ].join(' '),
    footer: ['bg-[var(--vtg-table-header-bg)]', 'text-[color:var(--vtg-table-text-color)]'].join(
      ' ',
    ),
    summary: '',
    summaryRow: 'bg-[var(--vtg-table-header-bg)]',
    summaryCell: [
      'font-medium',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),

    // ---- 固定列/固定表头 ----
    headerWrapper: 'overflow-hidden',
    bodyWrapper: 'overflow-auto',
    fixedCell: 'sticky z-[2] bg-inherit',
    fixedShadowLeft: [
      'after:absolute after:top-0 after:bottom-[-1px] after:right-0 after:w-[30px]',
      'after:translate-x-full after:pointer-events-none',
      'after:shadow-[inset_10px_0_8px_-8px_rgba(0,0,0,0.06)]',
      'before:!bg-transparent',
    ].join(' '),
    fixedShadowRight: [
      'after:absolute after:top-0 after:bottom-[-1px] after:left-0 after:w-[30px]',
      'after:-translate-x-full after:pointer-events-none',
      'after:shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.06)]',
      'before:!bg-transparent',
    ].join(' '),
    fixedShadowLeftHidden: 'after:shadow-none',
    fixedShadowRightHidden: 'after:shadow-none',

    // ---- 展开行 ----
    expandIcon:
      'inline-flex h-[23px] w-[23px] shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[color:var(--vtg-table-text-color)] cursor-pointer align-middle transition-[color,transform] duration-200',
    expandIconExpanded: '',
    expandIconCollapsed: '',
    expandIconSpaced: 'cursor-default opacity-0',
    expandIconDisabled: 'cursor-not-allowed text-[color:var(--color-muted)]',
    expandIconSymbol:
      'inline-flex items-center justify-center text-[12px] leading-none transition-transform duration-300 [&>svg]:h-[1em] [&>svg]:w-[1em]',
    expandIconSymbolExpanded: 'rotate-90',
    expandIconSymbolCollapsed: 'rotate-0',
    treeExpandIcon:
      'me-1 inline-flex h-[23px] w-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[color:var(--vtg-table-text-color)] cursor-pointer align-middle transition-[color,transform] duration-200',
    treeExpandIconExpanded: '',
    treeExpandIconCollapsed: '',
    treeExpandIconSpaced: 'me-1 cursor-default opacity-0',
    treeExpandIconDisabled: 'me-1 cursor-not-allowed text-[color:var(--color-muted)]',
    treeExpandIconSymbol:
      'inline-flex items-center justify-center text-[12px] leading-none transition-transform duration-300 [&>svg]:h-[1em] [&>svg]:w-[1em]',
    treeExpandIconSymbolExpanded: 'rotate-90',
    treeExpandIconSymbolCollapsed: 'rotate-0',
    expandedRow: '',
    expandedRowCell: 'bg-[var(--vtg-table-expanded-row-bg,#fafafa)]',

    // ---- 列拖拽调整宽度 ----
    resizeHandle: '',
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
        title: 'border-b border-[var(--vtg-table-border-color)]',
        footer: 'border-t border-[var(--vtg-table-border-color)]',
        summaryCell: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'group-even/row:bg-[var(--vtg-table-row-striped-bg)]',
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
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'lg',
      class:
        'px-[var(--vtg-table-cell-padding-inline-lg)] py-[var(--vtg-table-cell-padding-block-lg)]',
    },
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'md',
      class:
        'px-[var(--vtg-table-cell-padding-inline-md)] py-[var(--vtg-table-cell-padding-block-md)]',
    },
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
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
