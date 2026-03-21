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
    empty: 'text-center text-[color:var(--color-text-disabled)]',
    loading: [
      'absolute inset-0 z-[4]',
      'flex items-center justify-center',
      'bg-[color:var(--vtg-table-loading-overlay-bg)]',
    ].join(' '),
    headerCellInner: 'flex items-center',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',

    // ---- 排序相关 ----
    thSortable: 'cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]',
    sortButton: 'inline-flex flex-col items-center justify-center text-xs leading-none ml-1',
    sortIconDown: '-mt-[0.225em]',
    sortAreaOuter: 'flex flex-auto min-w-0',
    sortAreaWrapper: 'flex flex-auto items-center justify-between min-w-0',
    sortAreaTitle: 'flex-1 min-w-0',

    // ---- 筛选图标相关 ----
    filterIconWrapper: 'shrink-0 ml-1 self-stretch -my-1 -me-2 flex items-center',
    filterIcon:
      'inline-flex items-center justify-center cursor-pointer transition-colors text-xs px-1 self-stretch rounded-md hover:bg-black/6',

    // ---- 筛选下拉相关 ----
    filterDropdown: [
      'rounded-[6px] bg-[color:var(--color-surface)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
      'shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]',
    ].join(' '),
    filterDropdownList: 'p-1 m-0 list-none min-w-[120px]',
    filterDropdownItem: 'flex items-center cursor-pointer',
    filterDropdownItemSelected:
      'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-hover-bg)]',
    filterDropdownItemHover: 'hover:bg-[color:var(--color-control-item-hover-bg)]',
    // 树形筛选 switcher 图标
    filterDropdownSwitcher:
      'inline-flex items-center justify-center w-6 h-6 cursor-pointer text-[10px] text-[color:var(--color-on-surface)] transition-transform duration-200',
    filterDropdownSwitcherExpanded: 'rotate-0',
    filterDropdownSwitcherCollapsed: '-rotate-90',
    filterDropdownSwitcherNoop: 'cursor-default invisible',
    // 内容包裹层（checkbox + 文字），hover/selected 仅在此
    filterDropdownContentWrapper: 'flex items-center gap-2 px-3 py-[5px] rounded-sm flex-1 min-w-0',
    filterDropdownTreeWrapper: 'pt-2 px-2 pb-0',
    filterDropdownTreeList: 'm-0 p-0 list-none [--vtg-table-filter-tree-indent-size:24px]',
    filterDropdownTreeItem: 'flex items-start cursor-pointer pb-1',
    filterDropdownTreeContentWrapper:
      'flex min-h-6 flex-1 min-w-0 items-center gap-2 rounded-[6px] px-1 py-0',
    filterDropdownTreeItemSelected:
      'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-bg)]',
    filterDropdownTreeCheckAll: 'flex items-center w-full mb-1 ms-1',
    filterDropdownActions:
      'flex items-center justify-between gap-2 px-2 py-2 border-t border-[color:var(--color-default)]',
    filterDropdownSearch: 'p-2 border-b border-[color:var(--color-default)]',
    filterDropdownSearchField: [
      'flex items-center gap-1 px-[11px] h-[32px] min-w-[140px]',
      'rounded-[6px] border border-[color:var(--color-default)] bg-[color:var(--color-surface)]',
      'transition-[border-color,box-shadow] hover:border-[#4096ff]',
      'focus-within:border-[#4096ff] focus-within:shadow-[0_0_0_2px_rgba(5,145,255,0.1)]',
    ].join(' '),
    filterDropdownSearchIcon:
      'inline-flex shrink-0 items-center justify-center text-[14px] text-black/25',
    filterDropdownSearchInput: [
      'w-auto min-w-[140px] shrink grow-0 basis-auto h-[22px] px-0 border-0 bg-transparent rounded-none',
      'text-[length:14px] leading-[22px] shadow-none',
      'focus:border-transparent',
      'placeholder:text-black/25',
    ].join(' '),
    filterDropdownListEmpty:
      'px-3 py-2 text-center text-[length:12px] leading-5 text-black/25 select-none cursor-default',

    // ---- 空状态相关 ----
    emptyWrapper:
      'my-[var(--vtg-table-empty-margin-block)] flex flex-col items-center justify-center text-center',
    emptyIcon: [
      'mb-[var(--vtg-table-empty-image-margin-bottom)]',
      'h-[var(--vtg-table-empty-image-height)]',
      'opacity-[var(--vtg-table-empty-image-opacity)]',
      '[&>svg]:mx-auto [&>svg]:h-full [&>svg]:w-auto',
    ].join(' '),
    emptyText:
      'm-0 text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)] text-[color:var(--color-text-disabled)]',

    // ---- 加载状态相关 ----
    loadingSpinner:
      'inline-flex items-center justify-center text-[length:20px] leading-none text-[color:var(--color-primary)]',

    // ---- 行选中背景 ----
    tdSelected: 'bg-[var(--vtg-table-row-selected-bg)]',
    tdSelectedHover: 'group-hover/row:bg-[var(--vtg-table-row-selected-hover-bg)]',

    // ---- 选择下拉相关 ----
    selectionDropdown: [
      'rounded-[6px] bg-[color:var(--color-surface)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
      'shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]',
      'p-1 min-w-[120px]',
    ].join(' '),
    selectionDropdownItem:
      'flex items-center cursor-pointer px-3 py-[5px] rounded-sm hover:bg-[color:var(--color-control-item-hover-bg)]',
    selectionExtra:
      'inline-flex items-center justify-center cursor-pointer ml-1 text-[10px] text-[color:var(--vtg-table-header-color)] hover:text-[color:var(--color-primary)] transition-colors',

    // ---- 标题/页脚/摘要行 ----
    title: [
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'font-semibold',
    ].join(' '),
    footer: ['bg-[var(--vtg-table-header-bg)]', 'text-[color:var(--vtg-table-text-color)]'].join(
      ' ',
    ),
    summary: '',
    summaryRow: 'bg-[var(--vtg-table-header-bg)]',
    summaryCell: [
      'font-semibold',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),

    // ---- 固定列/固定表头 ----
    headerWrapper: 'overflow-hidden',
    bodyWrapper: 'overflow-auto',
    fixedCell: 'sticky z-[2] bg-inherit',
    fixedDividerLeft: '',
    fixedDividerRight: [
      '[background-image:linear-gradient(var(--vtg-table-header-split-color),var(--vtg-table-header-split-color))]',
      '[background-size:1px_1.6em] [background-repeat:no-repeat] [background-position:left_center]',
      'before:!bg-transparent',
    ].join(' '),
    fixedShadowLeft: [
      'after:absolute after:top-0 after:bottom-[-1px] after:right-0 after:w-[30px]',
      'after:translate-x-full after:pointer-events-none',
      'after:shadow-[inset_10px_0_8px_-8px_rgba(0,0,0,0.08)]',
      'before:!bg-transparent',
    ].join(' '),
    fixedShadowRight: [
      'after:absolute after:top-0 after:bottom-[-1px] after:left-0 after:w-[30px]',
      'after:-translate-x-full after:pointer-events-none',
      'after:shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.08)]',
      'before:!bg-transparent',
    ].join(' '),
    fixedShadowLeftHidden: 'after:shadow-none',
    fixedShadowRightHidden: 'after:shadow-none',

    // ---- 展开行 ----
    expandIcon: [
      'relative inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center',
      'origin-center scale-[0.941176] p-0 leading-[17px]',
      'rounded-[6px] border border-[var(--vtg-table-border-color,#d9d9d9)]',
      'bg-[var(--vtg-table-bg,#fff)] text-[color:var(--vtg-table-text-color)]',
      'cursor-pointer align-sub select-none transition-[border-color,background-color,color] duration-200',
      'hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]',
      'focus:border-[color:var(--color-primary)] focus:text-[color:var(--color-primary)]',
      'active:border-[color:var(--color-primary)] active:text-[color:var(--color-primary)]',
      'before:absolute before:left-[3px] before:right-[3px] before:top-[7px] before:h-px',
      "before:bg-current before:content-['']",
      'after:absolute after:bottom-[3px] after:left-[7px] after:top-[3px] after:w-px',
      "after:origin-center after:bg-current after:content-['']",
      'after:transition-transform after:duration-200',
    ].join(' '),
    expandIconExpanded: 'after:scale-y-0',
    expandIconCollapsed: 'after:scale-y-100',
    expandIconSpaced:
      'cursor-default border-transparent bg-transparent before:hidden after:hidden invisible',
    expandIconDisabled:
      'cursor-default border-transparent bg-transparent before:hidden after:hidden invisible',
    expandIconSymbol: 'hidden',
    expandIconSymbolExpanded: '',
    expandIconSymbolCollapsed: '',
    treeExpandIcon: [
      'relative me-2 inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center',
      'origin-center scale-[0.941176] p-0 leading-[17px]',
      'rounded-[6px] border border-[var(--vtg-table-border-color,#d9d9d9)]',
      'bg-[var(--vtg-table-bg,#fff)] text-[color:var(--vtg-table-text-color)]',
      'cursor-pointer align-sub select-none transition-[border-color,background-color,color] duration-200',
      'hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]',
      'focus:border-[color:var(--color-primary)] focus:text-[color:var(--color-primary)]',
      'active:border-[color:var(--color-primary)] active:text-[color:var(--color-primary)]',
      'before:absolute before:left-[3px] before:right-[3px] before:top-[7px] before:h-px',
      "before:bg-current before:content-['']",
      'after:absolute after:bottom-[3px] after:left-[7px] after:top-[3px] after:w-px',
      "after:origin-center after:bg-current after:content-['']",
      'after:transition-transform after:duration-200',
    ].join(' '),
    treeExpandIconExpanded: 'after:scale-y-0',
    treeExpandIconCollapsed: 'after:scale-y-100',
    treeExpandIconSpaced:
      'me-2 cursor-default border-transparent bg-transparent before:hidden after:hidden invisible',
    treeExpandIconDisabled:
      'me-2 cursor-default border-transparent bg-transparent before:hidden after:hidden invisible',
    treeExpandIconSymbol: 'hidden',
    treeExpandIconSymbolExpanded: '',
    treeExpandIconSymbolCollapsed: '',
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
        th: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0 before:hidden',
        td: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
        title: 'border-b border-[var(--vtg-table-border-color)]',
        footer: 'border-t border-[var(--vtg-table-border-color)]',
        summaryCell: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'group-even/row:bg-[rgba(0,0,0,0.02)]',
      },
    },
    hoverable: {
      true: {
        td: 'group-hover/row:bg-[var(--vtg-table-row-hover-bg)]',
      },
    },
    loading: {
      true: {
        table: 'opacity-50 pointer-events-none select-none',
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
