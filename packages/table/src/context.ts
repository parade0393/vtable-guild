import type { ComputedRef, InjectionKey, Ref, Slots } from 'vue'
import type {
  LocaleName,
  ThemePresetName,
  VTableGuildCssMode,
  VTableGuildTableLocale,
} from '@vtable-guild/core'
import type {
  CellAdditionalProps,
  ColumnGroupType,
  ColumnType,
  Key,
  RowSelection,
  SortOrder,
  TableLayout,
  TableSticky,
} from './types'
import type { Expandable } from './types/table'
import type { TablePresetConfig } from './preset-config'
import type { FixedOffset, ScrollEdgeState } from './composables/useScroll'
import type { FlattenRow } from './composables/useTreeData'
import type { SelectionState } from './composables/useSelection'
import type { SummaryFixed } from './components/VTableSummary'

/**
 * 子组件主题 slot class 映射。
 *
 * 每个字段是懒求值的 class 函数（与 useTheme 返回的 slots 同构）：
 * 对象本身在 setup 阶段创建一次、引用稳定，消费方在自己的 computed/render
 * 中调用具体字段才建立细粒度依赖，避免任一 variant 变化让全表失效。
 */
export interface SubThemeSlots {
  thSortable: () => string
  thSorted: () => string
  tdSorted: () => string
  sortButton: () => string
  sortIconDown: () => string
  sortAreaOuter: () => string
  sortAreaWrapper: () => string
  sortAreaTitle: () => string
  filterIconWrapper: () => string
  filterIcon: () => string
  filterDropdown: () => string
  filterDropdownList: () => string
  filterDropdownItem: () => string
  filterDropdownItemSelected: () => string
  /** 仅 element-plus 等单选高亮场景需要 — 单选选中态独立样式（如 primary 底 + 白字）。未定义时回退到 filterDropdownItemSelected */
  filterDropdownItemSelectedSingle?: () => string
  filterDropdownItemHover: () => string
  filterDropdownActions: () => string
  /** 底部 Reset 按钮的 class 注入位 — 用于 preset 把 Button 视觉降级为纯文本风格 */
  filterDropdownResetButton?: () => string
  /** 底部 Confirm 按钮的 class 注入位 */
  filterDropdownConfirmButton?: () => string
  filterDropdownSearch: () => string
  filterDropdownSearchField: () => string
  filterDropdownSearchIcon: () => string
  filterDropdownSearchInput: () => string
  filterDropdownSwitcher: () => string
  filterDropdownSwitcherExpanded: () => string
  filterDropdownSwitcherCollapsed: () => string
  filterDropdownSwitcherNoop: () => string
  filterDropdownContentWrapper: () => string
  filterDropdownTreeWrapper: () => string
  filterDropdownTreeList: () => string
  filterDropdownTreeItem: () => string
  filterDropdownTreeContentWrapper: () => string
  filterDropdownTreeItemSelected: () => string
  filterDropdownTreeItemMatched: () => string
  filterDropdownTreeCheckAll: () => string
  filterDropdownListEmpty: () => string
  emptyWrapper: () => string
  emptyIcon: () => string
  emptyText: () => string
  loadingSpinner: () => string
  tdSelected: () => string
  selectionDropdown: () => string
  selectionDropdownItem: () => string
  selectionExtra: () => string
  summaryRow: () => string
  summaryCell: () => string
  headerWrapper: () => string
  bodyWrapper: () => string
  fixedCell: () => string
  fixedDividerLeft: () => string
  fixedDividerRight: () => string
  fixedShadowLeft: () => string
  fixedShadowRight: () => string
  fixedShadowLeftHidden: () => string
  fixedShadowRightHidden: () => string
  expandIcon: () => string
  expandIconExpanded: () => string
  expandIconCollapsed: () => string
  expandIconSpaced: () => string
  expandIconDisabled: () => string
  expandIconSymbol: () => string
  expandIconSymbolExpanded: () => string
  expandIconSymbolCollapsed: () => string
  treeExpandIcon: () => string
  treeExpandIconExpanded: () => string
  treeExpandIconCollapsed: () => string
  treeExpandIconSpaced: () => string
  treeExpandIconDisabled: () => string
  treeExpandIconSymbol: () => string
  treeExpandIconSymbolExpanded: () => string
  treeExpandIconSymbolCollapsed: () => string
  expandedRow: () => string
  expandedRowCell: () => string
  resizeHandle: () => string
  tdRowHover: () => string
  tdRowSelectedHover: () => string
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
  /** 判断某列是否处于排序状态 */
  isColumnSorted?: (column: ColumnType<Record<string, unknown>>) => boolean

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

  /** 表级别 headerEllipsis 配置 */
  headerEllipsis?: ComputedRef<boolean>

  /** 子组件主题 slot class 映射（稳定引用，字段为懒求值函数） */
  subThemeSlots?: SubThemeSlots

  /** 当前主题预设行为配置 */
  presetConfig?: ComputedRef<TablePresetConfig>

  /** 当前主题预设 */
  themePreset?: ComputedRef<ThemePresetName>

  /** 当前 CSS 入口模式 */
  cssMode?: ComputedRef<VTableGuildCssMode>

  /** 库内部 utility class 前缀 */
  classPrefix?: ComputedRef<string>

  /** 转换库内部硬编码 class。用户传入 class 不应调用此函数。 */
  vtgClass?: (className: string) => string

  /**
   * 生成 antdv 兼容类名（如 `compatClass('row-selected')` → `ant-table-row-selected`）。
   *
   * 仅当全局 `compatClass: true` 时存在，否则为 undefined —— 调用点用可选链即可零开销跳过。
   * 用于 slot 覆盖不到的状态驱动类名（选中行、固定列边界、树层级等）。
   */
  compatClass?: (suffix: string) => string

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
  /** 获取某行选择状态（含半选） */
  getSelectionState?: (record: Record<string, unknown>, index: number) => SelectionState
  /** 切换某行选中状态 */
  toggleRow?: (record: Record<string, unknown>, index: number, nativeEvent?: MouseEvent) => void
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
  /** 滚动状态（是否在起始/末端，两个独立布尔 computed，只在跨越边界时触发下游） */
  scrollState?: ScrollEdgeState
  /** 是否开启 bordered 模式 */
  bordered?: ComputedRef<boolean>
  /** 表格布局模式 */
  tableLayout?: ComputedRef<TableLayout | undefined>
  /** sticky 配置 */
  sticky?: ComputedRef<boolean | TableSticky | undefined>
  /** 叶子列总数（用于分组表头判断是否为真正的最后一列） */
  leafColumnCount?: ComputedRef<number>

  // ---- 行/表头自定义 ----
  /** 解析 body 行 props */
  getRowProps?: (record: Record<string, unknown>, index: number) => CellAdditionalProps | undefined
  /** 解析 body 行 class */
  getRowClassName?: (record: Record<string, unknown>, index: number) => string
  /** 解析表头行 props */
  getHeaderRowProps?: (
    columns: Array<ColumnType<Record<string, unknown>> | ColumnGroupType<Record<string, unknown>>>,
    index: number,
  ) => CellAdditionalProps | undefined
  /** 解析列标题 */
  getColumnTitle?: (
    column: ColumnType<Record<string, unknown>> | ColumnGroupType<Record<string, unknown>>,
  ) => unknown
  /** 下拉层容器 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement
  /** 单元格文本转换 */
  transformCellText?: (options: {
    text: unknown
    column: ColumnType<Record<string, unknown>>
    record: Record<string, unknown>
    index: number
  }) => unknown

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

  // ---- Summary ----
  /** 扁平化后的叶子列列表（含选择列/展开列），用于 SummaryCell 通过 index 映射 */
  displayColumns?: ComputedRef<ColumnType<Record<string, unknown>>[]>
  /** 由 VTableSummary 组件调用，注册 summary 的 fixed 模式 */
  registerSummaryFixed?: (fixed: SummaryFixed | false) => void

  // ---- 树形数据 ----
  /** 是否为树形数据 */
  isTreeData?: ComputedRef<boolean>
  /** 扁平化后的树形行数据 */
  treeFlattenData?: ComputedRef<FlattenRow[]>
  /** 按 record 身份 O(1) 取可见行元信息（替代逐行 .find()） */
  getFlattenRow?: (record: Record<string, unknown>) => FlattenRow | undefined
  /** 切换树节点展开状态 */
  toggleTreeExpand?: (record: Record<string, unknown>, index: number) => void
  /** 判断树节点是否展开 */
  isTreeExpanded?: (key: Key) => boolean
  /** 树形缩进宽度 */
  treeIndentSize?: ComputedRef<number>

  // ---- Hover state ----
  hoverRange?: Ref<readonly [number, number] | null>
  setHoverRange?: (startRow: number, endRow: number) => void
  clearHoverRange?: () => void
  hoverable?: ComputedRef<boolean>
}

/**
 * Table context 的 injection key。
 */
export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
