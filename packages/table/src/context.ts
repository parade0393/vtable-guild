import type { ComputedRef, InjectionKey, Slots } from 'vue'
import type { LocaleName, VTableGuildTableLocale } from '@vtable-guild/core'
import type { ColumnType, Key, RowSelection, SortOrder } from './types'
import type { Expandable } from './types/table'
import type { TablePresetConfig } from './preset-config'
import type { FixedOffset } from './composables/useScroll'
import type { FlattenRow } from './composables/useTreeData'

/** 子组件主题 slot class 映射 */
export interface SubThemeSlots {
  thSortable: string
  sortButton: string
  sortIconDown: string
  sortAreaOuter: string
  sortAreaWrapper: string
  sortAreaTitle: string
  filterIconWrapper: string
  filterIcon: string
  filterDropdown: string
  filterDropdownList: string
  filterDropdownItem: string
  filterDropdownItemSelected: string
  filterDropdownItemHover: string
  filterDropdownActions: string
  filterDropdownSearch: string
  filterDropdownSearchField: string
  filterDropdownSearchIcon: string
  filterDropdownSearchInput: string
  filterDropdownSwitcher: string
  filterDropdownSwitcherExpanded: string
  filterDropdownSwitcherCollapsed: string
  filterDropdownSwitcherNoop: string
  filterDropdownContentWrapper: string
  filterDropdownTreeWrapper: string
  filterDropdownTreeList: string
  filterDropdownTreeItem: string
  filterDropdownTreeContentWrapper: string
  filterDropdownTreeItemSelected: string
  filterDropdownTreeCheckAll: string
  filterDropdownListEmpty: string
  emptyWrapper: string
  emptyIcon: string
  emptyText: string
  loadingSpinner: string
  tdSelected: string
  tdSelectedHover: string
  selectionDropdown: string
  selectionDropdownItem: string
  selectionExtra: string
  summaryRow: string
  summaryCell: string
  headerWrapper: string
  bodyWrapper: string
  fixedCell: string
  fixedShadowLeft: string
  fixedShadowRight: string
  fixedShadowLeftHidden: string
  fixedShadowRightHidden: string
  expandIcon: string
  expandIconExpanded: string
  expandIconCollapsed: string
  expandIconSpaced: string
  expandIconDisabled: string
  expandIconSymbol: string
  expandIconSymbolExpanded: string
  expandIconSymbolCollapsed: string
  treeExpandIcon: string
  treeExpandIconExpanded: string
  treeExpandIconCollapsed: string
  treeExpandIconSpaced: string
  treeExpandIconDisabled: string
  treeExpandIconSymbol: string
  treeExpandIconSymbolExpanded: string
  treeExpandIconSymbolCollapsed: string
  expandedRow: string
  expandedRowCell: string
  resizeHandle: string
}

/**
 * Table 内部 context，通过 provide/inject 跨层传递。
 *
 * Table.vue 在 setup 阶段 provide 此 context，
 * 所有后代组件（TableCell、TableHeaderCell 等）通过 inject 获取。
 */
export interface TableContext {
  /**
   * 用户定义的 bodyCell slot 函数。
   * 来自 Table.vue 的 useSlots().bodyCell。
   */
  bodyCell?: Slots['bodyCell']
  /**
   * 用户定义的 headerCell slot 函数。
   * 来自 Table.vue 的 useSlots().headerCell。
   */
  headerCell?: Slots['headerCell']
  /**
   * 用户定义的 empty slot 函数。
   */
  empty?: Slots['empty']

  /** 获取某列的当前排序方向 */
  getSortOrder?: (column: ColumnType<Record<string, unknown>>) => SortOrder
  /** 切换某列的排序方向 */
  toggleSortOrder?: (column: ColumnType<Record<string, unknown>>) => void

  /** 获取某列的当前筛选值 */
  getFilteredValue?: (column: ColumnType<Record<string, unknown>>) => (string | number | boolean)[]
  /** 确认筛选 */
  confirmFilter?: (
    column: ColumnType<Record<string, unknown>>,
    values: (string | number | boolean)[],
  ) => void
  /** 重置筛选 */
  resetFilter?: (column: ColumnType<Record<string, unknown>>) => void

  /** 自定义筛选下拉菜单 slot */
  customFilterDropdown?: Slots['customFilterDropdown']

  /** 自定义筛选图标 slot */
  customFilterIcon?: Slots['customFilterIcon']

  /** 表级别 showSorterTooltip 配置 */
  showSorterTooltip?: ComputedRef<boolean>

  /** 子组件主题 slot class 映射 */
  subThemeSlots?: ComputedRef<SubThemeSlots>

  /** 当前主题预设行为配置 */
  presetConfig?: ComputedRef<TablePresetConfig>

  /** 当前激活语言标识 */
  localeName?: ComputedRef<LocaleName>

  /** 表格最终生效 locale */
  locale?: ComputedRef<VTableGuildTableLocale>

  // ---- 行选择 ----
  /** 行选择配置 */
  rowSelection?: () => RowSelection | undefined
  /** 判断某行是否选中 */
  isSelected?: (key: Key) => boolean
  /** 判断某行是否禁用 */
  isDisabledRow?: (record: Record<string, unknown>) => boolean
  /** 切换某行选中状态 */
  toggleRow?: (record: Record<string, unknown>, index: number) => void
  /** 全选/取消全选 */
  toggleAll?: (selected: boolean) => void
  /** 全选状态 */
  allCheckedState?: () => 'all' | 'partial' | 'none'
  /** 获取行 key */
  getRowKey?: (record: Record<string, unknown>, index: number) => Key
  /** 反选当前可见可选行 */
  invertSelection?: () => void
  /** 清空所有选中 */
  clearSelection?: () => void
  /** 获取所有可选行的 key */
  getChangeableRowKeys?: () => Key[]

  // ---- 固定列/表头 ----
  /** 固定列偏移量映射 */
  fixedOffsets?: ComputedRef<Map<Key, FixedOffset>>
  /** 滚动状态（是否在起始/末端） */
  scrollState?: ComputedRef<{ atStart: boolean; atEnd: boolean }>

  // ---- 展开行 ----
  /** 展开行配置 */
  expandable?: () => Expandable | undefined
  /** 判断某行是否展开 */
  isExpanded?: (key: Key) => boolean
  /** 切换展开状态 */
  toggleExpand?: (record: Record<string, unknown>, index: number) => void
  /** 判断行是否可展开 */
  isRowExpandable?: (record: Record<string, unknown>) => boolean

  // ---- 列宽调整 ----
  /** 列宽覆写映射 */
  columnWidths?: Record<string, number>
  /** 启动列宽拖拽 */
  startResize?: (
    column: ColumnType<Record<string, unknown>>,
    colIndex: number,
    event: PointerEvent,
  ) => void
  /** 是否正在拖拽 */
  isResizing?: () => boolean

  // ---- 树形数据 ----
  /** 是否为树形数据 */
  isTreeData?: ComputedRef<boolean>
  /** 扁平化后的树形行数据 */
  treeFlattenData?: ComputedRef<FlattenRow[]>
  /** 切换树节点展开状态 */
  toggleTreeExpand?: (record: Record<string, unknown>, index: number) => void
  /** 判断树节点是否展开 */
  isTreeExpanded?: (key: Key) => boolean
  /** 树形缩进宽度 */
  treeIndentSize?: ComputedRef<number>
}

/**
 * Table context 的 injection key。
 */
export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
