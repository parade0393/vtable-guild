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
    root: [
      'relative w-full min-w-0',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)]',
      'leading-[var(--vtg-table-line-height)]',
    ].join(' '),
    wrapper: 'w-full overflow-auto',
    table: [
      'w-full border-separate border-spacing-0',
      'bg-[color:var(--vtg-table-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    thead: '',
    tbody: '',
    tr: 'group/row transition-colors',
    groupedHeaderTable: 'border border-[color:var(--vtg-table-border-color)]',
    groupedHeaderTh: [
      'border-r border-[color:var(--vtg-table-border-color)] last:border-r-0',
      'bg-[color:var(--color-surface-hover)]',
    ].join(' '),
    groupedHeaderTd: 'border-r border-[color:var(--vtg-table-border-color)] last:border-r-0',
    th: [
      'relative text-left font-semibold',
      'bg-[color:var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-header-color)]',
      'border-b border-[color:var(--vtg-table-border-color)]',
      // Element Plus: 无表头分割线
    ].join(' '),
    td: [
      'align-middle',
      'bg-[color:var(--vtg-table-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[color:var(--vtg-table-border-color)]',
    ].join(' '),
    empty: 'py-5 text-center text-[color:var(--color-muted)]',
    loading: [
      'absolute inset-0 z-[2]',
      'flex items-center justify-center',
      'bg-[color:var(--vtg-table-loading-overlay-bg)]',
    ].join(' '),
    headerCellInner: 'flex items-center',
    bodyCellEllipsis: 'block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap',

    // ---- 排序相关 ----
    thSortable: 'cursor-pointer select-none',
    thSorted: '',
    tdSorted: '',
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
    // 与 element-plus 官方 .el-table-filter 1:1 对齐：
    // 2px 圆角、border-color-lighter、--el-box-shadow-light 等价的浅阴影
    filterDropdown: [
      'rounded-[2px] bg-[color:var(--color-surface)]',
      'border border-[color:var(--vtg-border-color-lighter,var(--color-default))]',
      'shadow-[0_0_12px_rgba(0,0,0,0.12)]',
      'font-[family-name:var(--vtg-table-font-family)]',
      'text-[length:var(--vtg-table-font-size)] leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    // .el-table-filter__list: padding 5px 0; min-width 100px
    filterDropdownList: 'py-[5px] px-0 m-0 list-none min-w-[100px]',
    // li 自身只控制指针；hover/selected/padding 全在 contentWrapper
    filterDropdownItem: 'cursor-pointer',
    // 多选选中（默认 selected 槽）：仅 checkbox label 变 primary 色，无背景；
    // 通过 CSS variable arbitrary property 重定义子 span 颜色。
    filterDropdownItemSelected:
      '[--color-on-surface:var(--color-primary)] font-medium hover:bg-[color:var(--color-control-item-hover-bg)]',
    // 单选选中（element-plus highlight 模式）：primary 底 + 白字 → 复用 var 重定义
    filterDropdownItemSelectedSingle:
      'bg-[color:var(--color-primary)] [--color-on-surface:#ffffff] hover:bg-[color:var(--color-primary)]',
    // hover：浅蓝底 + primary 文字（仅未选中态生效，与 element-plus 一致）
    filterDropdownItemHover:
      'hover:bg-[color:var(--color-control-item-hover-bg)] hover:[--color-on-surface:var(--color-primary)]',
    // 树形筛选 switcher 图标
    filterDropdownSwitcher:
      'inline-flex items-center justify-center w-6 h-6 cursor-pointer text-xs text-[color:var(--color-muted)] transition-transform duration-200',
    filterDropdownSwitcherExpanded: 'rotate-0',
    filterDropdownSwitcherCollapsed: '-rotate-90',
    filterDropdownSwitcherNoop: 'cursor-default invisible',
    // 内容包裹层（checkbox + 文字），整行响应 hover/active；line-height 36px + padding 0 10px = 整行点击区
    filterDropdownContentWrapper: 'flex items-center gap-2 leading-[36px] px-[10px] flex-1 min-w-0',
    filterDropdownTreeWrapper: 'py-[5px]',
    filterDropdownTreeList: 'm-0 p-0 list-none [--vtg-table-filter-tree-indent-size:24px]',
    filterDropdownTreeItem: 'flex items-center cursor-pointer',
    filterDropdownTreeContentWrapper:
      'flex items-center gap-2 leading-[36px] px-[10px] flex-1 min-w-0',
    // 树形多选：与 menu 多选同款（primary 文字、无 bg）
    filterDropdownTreeItemSelected:
      '[--color-on-surface:var(--color-primary)] font-medium hover:bg-[color:var(--color-control-item-hover-bg)]',
    filterDropdownTreeItemMatched: 'font-medium',
    filterDropdownTreeCheckAll: 'flex items-center cursor-pointer px-[10px] leading-[36px]',
    // .el-table-filter__bottom: padding 8px + border-top；按钮顺序 Confirm 在左、Reset 在右 → flex-row-reverse
    filterDropdownActions:
      'flex flex-row-reverse items-center justify-end gap-3 px-2 py-2 border-t border-[color:var(--vtg-border-color-lighter,var(--color-default))]',
    // 底部按钮：覆盖 Button 的 type='primary'/'link' 视觉，降级为 element-plus 的纯文本风格（12px / 无背景边框 / hover→primary）
    filterDropdownConfirmButton:
      'bg-transparent border-0 shadow-none text-[color:var(--vtg-table-text-color)] hover:bg-transparent hover:text-[color:var(--color-primary)] active:bg-transparent text-[12px] px-[3px] h-auto leading-none',
    filterDropdownResetButton:
      'bg-transparent border-0 shadow-none text-[color:var(--vtg-table-text-color)] hover:bg-transparent hover:text-[color:var(--color-primary)] active:bg-transparent text-[12px] px-[3px] h-auto leading-none disabled:text-[color:var(--color-text-disabled,#a8abb2)] disabled:cursor-not-allowed',
    filterDropdownSearch: 'px-[10px] pt-2 pb-1',
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
    tdSelected: '',
    tdRowHover: 'bg-[color:var(--vtg-table-row-hover-bg)]',
    tdRowSelectedHover: '',

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
      'bg-[color:var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'font-medium',
    ].join(' '),
    footer: [
      'bg-[color:var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    summary: '',
    summaryRow: 'bg-[color:var(--vtg-table-header-bg)]',
    summaryCell: [
      'font-medium',
      'bg-[color:var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[color:var(--vtg-table-border-color)]',
    ].join(' '),

    // ---- 固定列/固定表头 ----
    headerWrapper: 'overflow-hidden',
    bodyWrapper: 'overflow-auto',
    fixedCell: 'sticky z-[2] bg-inherit',
    fixedDividerLeft: '',
    fixedDividerRight: '',
    fixedShadowLeft: [
      'after:absolute after:top-0 after:bottom-[-1px] after:right-0 after:w-[30px]',
      'after:translate-x-full after:pointer-events-none',
      'after:shadow-[inset_10px_0_8px_-8px_rgba(0,0,0,0.06)]',
    ].join(' '),
    fixedShadowRight: [
      'after:absolute after:top-0 after:bottom-[-1px] after:left-0 after:w-[30px]',
      'after:-translate-x-full after:pointer-events-none',
      'after:shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.06)]',
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
    expandedRowCell: 'bg-[color:var(--vtg-table-expanded-row-bg,#fafafa)]',

    // ---- 列拖拽调整宽度 ----
    resizeHandle: '',
  },
  variants: {
    size: {
      large: {},
      middle: {},
      small: {},
    },
    bordered: {
      true: {
        root: 'border border-[color:var(--vtg-table-border-color)] overflow-hidden',
        table: '',
        th: 'border-r border-[color:var(--vtg-table-border-color)] last:border-r-0',
        td: 'border-r border-[color:var(--vtg-table-border-color)] last:border-r-0',
        tbody: '[&:not([data-vtg-preserve-last-border])>tr:last-child>td]:border-b-0',
        title: 'border-b border-[color:var(--vtg-table-border-color)]',
        footer: 'border-t border-[color:var(--vtg-table-border-color)]',
        summaryCell: 'border-r border-[color:var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'group-even/row:bg-[color:var(--vtg-table-row-striped-bg)]',
      },
    },
    hoverable: {
      true: {},
    },
  },
  compoundSlots: [
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'large',
      class:
        'px-[var(--vtg-table-cell-padding-inline-lg)] py-[var(--vtg-table-cell-padding-block-lg)]',
    },
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'middle',
      class:
        'px-[var(--vtg-table-cell-padding-inline-md)] py-[var(--vtg-table-cell-padding-block-md)]',
    },
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'small',
      class:
        'px-[var(--vtg-table-cell-padding-inline-sm)] py-[var(--vtg-table-cell-padding-block-sm)]',
    },
  ],
  defaultVariants: {
    size: 'middle',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

/** 标记 element-plus 主题已实现 */
export const ELEMENT_PLUS_THEME_IMPLEMENTED = true
