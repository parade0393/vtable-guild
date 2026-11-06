import {
  resolveColumnSettingsThemePreset,
  resolvePaginationThemePreset,
  resolveQueryThemePreset,
  resolveSelectionAlertThemePreset,
  resolveTableThemePreset,
  resolveToolbarThemePreset,
  type ColumnSettingsSlots,
  type PaginationSlots,
  type QuerySlots,
  type SelectionAlertSlots,
  type TableSlots,
  type ThemeConfig,
  type ThemePresetName,
  type ToolbarSlots,
} from '@vtable-guild/vtable-guild'
import type { DocFeature, UiSlotMeta } from './types'

export { tableCssVars, themeCssVarGroups } from './theme-css-vars'

type SlotDef = UiSlotMeta & { group: string }

const slot = (group: string, description: string, features: readonly DocFeature[] = []) => ({
  group,
  description,
  features,
})

/**
 * Table 主题 slot 说明。`satisfies Record<TableSlots, …>` 保证与预设 slot 集合一一对应：
 * 预设新增或删除 slot 时，site type-check 会要求同步这里。
 */
export const tableUiSlots = {
  root: slot('structure', '表格最外层容器。控制字体、字号、行高。'),
  wrapper: slot('structure', '`<table>` 元素的滚动包裹层。'),
  rootAutoHeight: slot(
    'structure',
    "`scroll.y: 'auto'` 时叠加在 `root` 上的自动高度布局（填满父容器）。",
    ['virtualization'],
  ),
  wrapperAutoHeight: slot(
    'structure',
    "`scroll.y: 'auto'` 时叠加在 `wrapper` 上的自动高度布局（吃剩余高度）。",
    ['virtualization'],
  ),
  table: slot('structure', '`<table>` 元素。控制背景色、文字色、边框间距。'),
  thead: slot('structure', '`<thead>` 元素。'),
  tbody: slot('structure', '`<tbody>` 元素。'),
  tr: slot('structure', '`<tr>` 元素。默认带 `group/row`，供子元素做 hover 匹配。'),
  th: slot('structure', '表头单元格 `<th>`。控制背景、文字色、边框和分割线。'),
  td: slot(
    'structure',
    '数据单元格 `<td>`。控制背景、文字色、边框；hover、选中、斑马纹通过 variant 追加。',
  ),

  headerCellInner: slot('cell-wrappers', '表头单元格内部的 flex 包裹层。', [
    'cell-display',
    'api-wiring-and-slots',
  ]),
  bodyCellEllipsis: slot('cell-wrappers', '`ellipsis` 列内容的文本截断层。', ['cell-display']),
  headerHelp: slot('cell-wrappers', '列 `tooltip` 的表头说明图标。', ['cell-display']),
  cellContent: slot('cell-wrappers', '`copyable` 列的内容与复制按钮包裹层。', ['cell-display']),
  copyButton: slot('cell-wrappers', '`copyable` 列的复制按钮。', ['cell-display']),

  groupedHeaderTable: slot('grouped-header', '多级表头中的内层 `<table>`。', [
    'grouped-and-merged-cells',
  ]),
  groupedHeaderTh: slot('grouped-header', '分组表头 `<th>`。', ['grouped-and-merged-cells']),
  groupedHeaderTd: slot('grouped-header', '分组表头 `<td>`。', ['grouped-and-merged-cells']),

  thSortable: slot('sorting', '可排序列的 `<th>` 附加样式。', ['sorting']),
  thSorted: slot('sorting', '已激活排序的列 `<th>` 背景。', ['sorting']),
  tdSorted: slot('sorting', '已激活排序的列 `<td>` 背景。', ['sorting']),
  sortButton: slot('sorting', '排序图标容器。', ['sorting']),
  sortIconDown: slot('sorting', '降序图标的间距调整。', ['sorting']),
  sortAreaOuter: slot('sorting', '排序区最外层 flex 包裹。', ['sorting']),
  sortAreaWrapper: slot('sorting', '标题和排序图标之间的 flex 包裹。', ['sorting']),
  sortAreaTitle: slot('sorting', '排序标题文本容器。', ['sorting']),

  filterIconWrapper: slot('filter-icon', '筛选图标包裹容器。', ['filtering']),
  filterIcon: slot('filter-icon', '筛选触发图标本身。', ['filtering']),

  filterDropdown: slot('filter-menu', '筛选面板根容器。', ['filtering']),
  filterDropdownList: slot('filter-menu', '筛选选项列表容器。', ['filtering']),
  filterDropdownItem: slot('filter-menu', '单个筛选项。', ['filtering']),
  filterDropdownItemSelected: slot('filter-menu', '选中项样式。', ['filtering']),
  filterDropdownItemSelectedSingle: slot(
    'filter-menu',
    '单选（`filterMultiple: false`）下的选中项附加样式。',
    ['filtering'],
  ),
  filterDropdownItemHover: slot('filter-menu', 'hover 项样式。', ['filtering']),
  filterDropdownContentWrapper: slot('filter-menu', '选项内容包裹层。', ['filtering']),
  filterDropdownActions: slot('filter-menu', '底部操作栏。', ['filtering']),
  filterDropdownResetButton: slot('filter-menu', '底部「重置」按钮的附加样式。', ['filtering']),
  filterDropdownConfirmButton: slot('filter-menu', '底部「确定」按钮的附加样式。', ['filtering']),
  filterDropdownSearch: slot('filter-menu', '搜索区外层。', ['filtering']),
  filterDropdownSearchField: slot('filter-menu', '搜索输入框容器。', ['filtering']),
  filterDropdownSearchIcon: slot('filter-menu', '搜索图标。', ['filtering']),
  filterDropdownSearchInput: slot('filter-menu', '搜索输入框。', ['filtering']),
  filterDropdownListEmpty: slot('filter-menu', '空结果提示。', ['filtering']),

  filterDropdownSwitcher: slot('filter-tree', '树节点展开/折叠按钮。', ['filtering']),
  filterDropdownSwitcherExpanded: slot('filter-tree', '展开状态。', ['filtering']),
  filterDropdownSwitcherCollapsed: slot('filter-tree', '折叠状态。', ['filtering']),
  filterDropdownSwitcherNoop: slot('filter-tree', '不可切换节点占位。', ['filtering']),
  filterDropdownTreeWrapper: slot('filter-tree', '树列表包裹层。', ['filtering']),
  filterDropdownTreeList: slot('filter-tree', '树列表 `<ul>`。', ['filtering']),
  filterDropdownTreeItem: slot('filter-tree', '单个树节点行。', ['filtering']),
  filterDropdownTreeContentWrapper: slot('filter-tree', '树节点内容包裹层。', ['filtering']),
  filterDropdownTreeItemSelected: slot('filter-tree', '选中节点样式。', ['filtering']),
  filterDropdownTreeItemMatched: slot('filter-tree', '搜索命中节点样式。', ['filtering']),
  filterDropdownTreeCheckAll: slot('filter-tree', '“全选” 行。', ['filtering']),

  empty: slot('empty', '空状态根容器。', ['remote-data', 'api-wiring-and-slots']),
  emptyWrapper: slot('empty', '空状态内容包裹层。', ['remote-data', 'api-wiring-and-slots']),
  emptyIcon: slot('empty', '空状态图标区域。', ['remote-data', 'api-wiring-and-slots']),
  emptyText: slot('empty', '空状态文字。', ['remote-data', 'api-wiring-and-slots']),

  loading: slot('loading', '覆盖整张表的 loading 遮罩层。', [
    'remote-data',
    'api-wiring-and-slots',
  ]),
  loadingSpinner: slot('loading', 'loading 图标。', ['remote-data', 'api-wiring-and-slots']),

  tdSelected: slot('row-states', '选中行的 `<td>` 背景。', ['selection']),
  tdRowHover: slot('row-states', 'hover 时普通行的 `<td>` 背景。'),
  tdRowSelectedHover: slot('row-states', 'hover 时选中行的 `<td>` 背景叠加层。', ['selection']),

  trDragging: slot('row-drag', '拖拽中的行 `<tr>`。', ['row-drag-sort']),
  trDropAbove: slot('row-drag', '放置目标行（插入到其上方）的 `<tr>` 指示线。', ['row-drag-sort']),
  trDropBelow: slot('row-drag', '放置目标行（插入到其下方）的 `<tr>` 指示线。', ['row-drag-sort']),

  selectionDropdown: slot('selection-menu', '行选择下拉面板。', ['selection']),
  selectionDropdownItem: slot('selection-menu', '行选择下拉项。', ['selection']),
  selectionExtra: slot('selection-menu', '行选择列头部的额外触发图标。', ['selection']),

  title: slot('summary', '表格标题区域。', ['title-footer-summary']),
  footer: slot('summary', '表格页脚区域。', ['title-footer-summary']),
  summary: slot('summary', '摘要容器。', ['title-footer-summary']),
  summaryRow: slot('summary', '摘要 `<tr>`。', ['title-footer-summary']),
  summaryCell: slot('summary', '摘要 `<td>`。', ['title-footer-summary']),

  headerWrapper: slot('fixed', '固定表头模式下的表头滚动包裹层。', [
    'fixed-columns',
    'virtualization',
  ]),
  bodyWrapper: slot('fixed', '固定表头模式下的表体滚动包裹层。', [
    'fixed-columns',
    'virtualization',
  ]),
  fixedCell: slot('fixed', '固定列单元格。', ['fixed-columns']),
  fixedDividerLeft: slot('fixed', '左固定列分隔线。', ['fixed-columns']),
  fixedDividerRight: slot('fixed', '右固定列分隔线。', ['fixed-columns']),
  fixedShadowLeft: slot('fixed', '左固定列阴影层。', ['fixed-columns']),
  fixedShadowRight: slot('fixed', '右固定列阴影层。', ['fixed-columns']),
  fixedShadowLeftHidden: slot('fixed', '左侧阴影隐藏状态。', ['fixed-columns']),
  fixedShadowRightHidden: slot('fixed', '右侧阴影隐藏状态。', ['fixed-columns']),

  expandIcon: slot('expand', '展开按钮基础样式。', ['expandable-rows']),
  expandIconExpanded: slot('expand', '展开状态。', ['expandable-rows']),
  expandIconCollapsed: slot('expand', '折叠状态。', ['expandable-rows']),
  expandIconSpaced: slot('expand', '不可展开行的占位符。', ['expandable-rows']),
  expandIconDisabled: slot('expand', '禁用状态。', ['expandable-rows']),
  expandIconSymbol: slot('expand', '展开图标的 symbol 容器。', ['expandable-rows']),
  expandIconSymbolExpanded: slot('expand', '展开 symbol 状态。', ['expandable-rows']),
  expandIconSymbolCollapsed: slot('expand', '折叠 symbol 状态。', ['expandable-rows']),
  expandedRow: slot('expand', '展开行 `<tr>`。', ['expandable-rows']),
  expandedRowCell: slot('expand', '展开内容 `<td>`。', ['expandable-rows']),

  treeExpandIcon: slot('tree', '树形展开按钮基础样式。', ['tree-table']),
  treeExpandIconExpanded: slot('tree', '展开状态。', ['tree-table']),
  treeExpandIconCollapsed: slot('tree', '折叠状态。', ['tree-table']),
  treeExpandIconSpaced: slot('tree', '叶子节点占位。', ['tree-table']),
  treeExpandIconDisabled: slot('tree', '禁用状态。', ['tree-table']),
  treeExpandIconSymbol: slot('tree', '树形 symbol 容器。', ['tree-table']),
  treeExpandIconSymbolExpanded: slot('tree', '树形展开 symbol 状态。', ['tree-table']),
  treeExpandIconSymbolCollapsed: slot('tree', '树形折叠 symbol 状态。', ['tree-table']),
  treeExpandIconLoading: slot('tree', '懒加载进行中的按钮状态。', ['tree-table']),
  treeExpandIconError: slot('tree', '懒加载失败后的重试按钮状态。', ['tree-table']),

  cellStatus: slot('tags', '`valueEnum` 状态标记，按 `data-status` 着色。', [
    'cell-display',
    'cell-render',
    'dictionary',
  ]),
  cellTag: slot('tags', "`valueType: 'tag'` 或渲染器 `presentation: 'tag'` 的标签外观。", [
    'cell-display',
    'cell-render',
  ]),

  cellProgress: slot('progress', '进度整体宽度与轨道、数值之间的间距。', ['cell-render']),
  cellProgressTrack: slot('progress', '轨道高度、圆角与背景。', ['cell-render']),
  cellProgressBar: slot('progress', '填充色，支持 `data-status` 状态。', ['cell-render']),
  cellProgressText: slot('progress', '百分比文字或成功 / 错误图标。', ['cell-render']),

  editCell: slot('edit', '已进入编辑的单元格内容容器。', ['editing', 'editable-columns']),
  editControl: slot('edit', '宿主控件的宽度和错误轮廓。', ['editing', 'editable-columns']),
  editError: slot('edit', '按字段定位的校验错误。', ['editing', 'editable-columns']),

  resizeHandle: slot('resize', '列宽拖拽手柄。', ['column-resize']),

  widthConstraintCell: slot('width-layout', '用于约束列宽的单元格。', [
    'column-resize',
    'virtualization',
  ]),
  widthConstraintInner: slot('width-layout', '列宽约束单元格的内部元素。', [
    'column-resize',
    'virtualization',
  ]),
  widthLayoutCell: slot('width-layout', '使用列宽布局时附加的单元格样式。', [
    'column-resize',
    'virtualization',
  ]),
} satisfies Record<TableSlots, SlotDef>

function componentSlots<T extends string>(
  group: string,
  descriptions: Record<T, string>,
  features: readonly DocFeature[],
): Record<string, SlotDef> {
  return Object.fromEntries(
    Object.entries<string>(descriptions).map(([name, description]) => [
      name,
      slot(group, description, features),
    ]),
  )
}

const paginationSlots = componentSlots<PaginationSlots>(
  'pagination',
  {
    root: '分页根容器。',
    layout: '自定义分页布局的两区容器。',
    left: '分页布局左区。',
    right: '分页布局右区。',
    extension: '自定义分页内容的容器。',
    pages: '页码与前后导航按钮容器。',
    item: '页码与导航按钮。',
    active: '当前页码附加样式。',
    jump: '跳过一组页码的按钮。',
    jumpEllipsis: '跳页按钮中的省略号。',
    jumpIcon: '跳页按钮悬停时显示的图标。',
    controls: '每页条数与快速跳转等控件区域。',
    simpleControls: '简洁模式控件区域。',
    simpleInput: '简洁模式页码输入框附加样式。',
    slash: '当前页与总页数之间的分隔符。',
    go: '快速跳转确认按钮。',
    input: '页码输入框。',
    select: '每页条数选择按钮。',
    popup: '每页条数下拉面板。',
    option: '每页条数下拉选项。',
    optionActive: '已选每页条数选项附加样式。',
    total: '总条数文字。',
    icon: '分页按钮图标。',
  },
  ['pagination'],
)

const toolbarSlots = componentSlots<ToolbarSlots>(
  'toolbar',
  {
    root: '工具栏根容器与响应式布局。',
    title: '标题区。',
    right: '业务操作和内置工具的包裹层。',
    actions: '`#actions` 业务按钮容器。',
    settings: '内置工具或 `#settings` 的容器。',
    search: '工具栏轻搜索容器。',
    searchGroup: '搜索输入区和提交按钮的组合容器。',
    searchField: '搜索文本框的外层。',
    searchInput: '搜索文本输入框。',
    searchSubmit: '搜索提交按钮。',
    searchClear: '清除搜索文本按钮。',
    searchIcon: '搜索与清除图标。',
    filter: '单行布局中的 `#filter` 内容容器。',
    extra: '`#extra` 与多行布局中的 `#filter` 内容容器。',
    action: '刷新、全屏等内置按钮。',
    icon: '内置工具图标。',
    loadingIcon: '刷新加载动画。',
  },
  ['toolbar'],
)

const columnSettingsSlots = componentSlots<ColumnSettingsSlots>(
  'column-settings',
  {
    root: '密度与列设置触发器容器。',
    trigger: '列设置按钮。',
    densityTrigger: '密度按钮。',
    popup: '列设置浮层。',
    densityPopup: '密度浮层。',
    density: '密度菜单选项。',
    header: '列设置面板头部。',
    heading: '全选标题。',
    reset: '重置按钮。',
    columns: '列列表。',
    children: '嵌套子列列表。',
    item: '列列表项。',
    row: '列选项行，作为拖拽载体。',
    rowDragging: '拖拽中的源行描边。',
    rowDropAbove: '目标行的上插入线。',
    rowDropBelow: '目标行的下插入线。',
    rowDropDot: '插入线左端的圆点。',
    dragHandle: '拖拽手柄。',
    pinActions: '固定位置按钮组。',
    pinAction: '固定位置按钮。',
    pinIcon: '固定位置图标。',
    group: '按固定位置划分的列组容器。',
    groupTitle: '固定位置分组标题。',
    groupColumns: '组内列列表。',
    label: '列选项标签。',
    checkboxControl: '复选框容器。',
    checkbox: '复选框输入元素。',
    checkMark: '选中标记。',
    indeterminateMark: '半选标记。',
    labelText: '列选项标签文字。',
    empty: '无可配置列时的提示。',
  },
  ['column-display', 'toolbar'],
)

const selectionAlertSlots = componentSlots<SelectionAlertSlots>(
  'selection-alert',
  {
    root: '批量操作提示条根容器。',
    info: '选中数量或 `#info` 自定义内容的容器。',
    text: '默认选中数量文字。',
    clear: '清空选择按钮。',
    option: '清空选择与批量操作区域的容器。',
    actions: '批量操作内容容器。',
  },
  ['selection-alert'],
)

const querySlots = componentSlots<QuerySlots>(
  'query',
  {
    root: 'Schema 查询区根容器。',
    fields: '表单模式栅格或轻量模式字段容器。',
    field: '单个查询字段布局。',
    label: '字段标签。',
    control: '宿主控件容器。',
    error: '单字段错误。',
    actions: '查询、重置与折叠操作区。',
    feedback: '查询区整体错误反馈。',
    collapse: '展开或折叠字段的入口。',
  },
  ['schema-query'],
)

export const themeSurfaces = {
  table: { slots: tableUiSlots, resolvePreset: resolveTableThemePreset },
  pagination: { slots: paginationSlots, resolvePreset: resolvePaginationThemePreset },
  toolbar: { slots: toolbarSlots, resolvePreset: resolveToolbarThemePreset },
  columnSettings: { slots: columnSettingsSlots, resolvePreset: resolveColumnSettingsThemePreset },
  selectionAlert: { slots: selectionAlertSlots, resolvePreset: resolveSelectionAlertThemePreset },
  query: { slots: querySlots, resolvePreset: resolveQueryThemePreset },
} satisfies Record<
  string,
  {
    slots: Readonly<Record<string, SlotDef>>
    resolvePreset: (name: ThemePresetName) => ThemeConfig
  }
>

const slotsByGroup = new Map<string, string[][]>()
for (const { slots } of Object.values(themeSurfaces)) {
  for (const [name, { group, description }] of Object.entries<SlotDef>(slots)) {
    const rows = slotsByGroup.get(group) ?? []
    rows.push([`\`${name}\``, description])
    slotsByGroup.set(group, rows)
  }
}

export const themeReferenceTables = {
  ...Object.fromEntries(
    Array.from(slotsByGroup, ([group, rows]) => [
      `slots-${group}`,
      { headers: ['Slot', '说明'], rows },
    ]),
  ),
  'table-variants': {
    headers: ['Variant', '值', '默认值', '影响的 Slot'],
    rows: [
      [
        '`size`',
        '`small` / `middle` / `large`',
        `antdv 为 \`${resolveTableThemePreset('antdv').defaultVariants.size}\`，element-plus 为 \`${resolveTableThemePreset('element-plus').defaultVariants.size}\``,
        '`th`、`td`、`title`、`footer`、`summaryCell` 的内边距',
      ],
      [
        '`bordered`',
        '`true` / `false`',
        '`false`',
        '`root`、`th`、`td`、`tbody`、`title`、`footer`、`summaryCell` 的边框',
      ],
      ['`striped`', '`true` / `false`', '`false`', '`td` 和相关行状态 slot 的偶数行背景'],
      [
        '`hoverable`',
        '`true` / `false`',
        '`true`',
        '`tdRowHover`、`tdRowSelectedHover` 控制普通行与选中行的 hover 背景',
      ],
      [
        '`loading`',
        '`true` / `false`',
        '`false`',
        'antdv 的 `table` 在布尔 `true` 时半透明并禁用指针交互。两套预设的遮罩与默认图标由 `loading` 和 `loadingSpinner` 控制。',
      ],
    ],
  },
}
