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
import type { DocFeature, DocLang, DocTable, UiSlotMeta } from './types'

export { tableCssVars, themeCssVarGroups } from './theme-css-vars'

type SlotDef = UiSlotMeta & { group: string }

/** `slot(分组, 中文说明, 英文说明, 相关功能)` */
const slot = (
  group: string,
  description: string,
  descriptionEn: string,
  features: readonly DocFeature[] = [],
) => ({
  group,
  description,
  descriptionEn,
  features,
})

/**
 * Table 主题 slot 说明。`satisfies Record<TableSlots, …>` 保证与预设 slot 集合一一对应：
 * 预设新增或删除 slot 时，site type-check 会要求同步这里。
 */
export const tableUiSlots = {
  root: slot(
    'structure',
    '表格最外层容器。控制字体、字号、行高。',
    'Outermost table container. Controls font family, font size and line height.',
  ),
  wrapper: slot(
    'structure',
    '`<table>` 元素的滚动包裹层。',
    'Scroll wrapper around the `<table>` element.',
  ),
  rootAutoHeight: slot(
    'structure',
    "`scroll.y: 'auto'` 时叠加在 `root` 上的自动高度布局（填满父容器）。",
    "Auto-height layout added on top of `root` when `scroll.y: 'auto'` (fills the parent container).",
    ['virtualization'],
  ),
  wrapperAutoHeight: slot(
    'structure',
    "`scroll.y: 'auto'` 时叠加在 `wrapper` 上的自动高度布局（吃剩余高度）。",
    "Auto-height layout added on top of `wrapper` when `scroll.y: 'auto'` (takes the remaining height).",
    ['virtualization'],
  ),
  table: slot(
    'structure',
    '`<table>` 元素。控制背景色、文字色、边框间距。',
    'The `<table>` element. Controls background color, text color and border spacing.',
  ),
  thead: slot('structure', '`<thead>` 元素。', 'The `<thead>` element.'),
  tbody: slot('structure', '`<tbody>` 元素。', 'The `<tbody>` element.'),
  tr: slot(
    'structure',
    '`<tr>` 元素。默认带 `group/row`，供子元素做 hover 匹配。',
    'The `<tr>` element. Carries `group/row` by default so child elements can match on hover.',
  ),
  th: slot(
    'structure',
    '表头单元格 `<th>`。控制背景、文字色、边框和分割线。',
    'Header cell `<th>`. Controls background, text color, borders and the split line.',
  ),
  td: slot(
    'structure',
    '数据单元格 `<td>`。控制背景、文字色、边框；hover、选中、斑马纹通过 variant 追加。',
    'Data cell `<td>`. Controls background, text color and borders; hover, selected and striped styles are added through variants.',
  ),

  headerCellInner: slot(
    'cell-wrappers',
    '表头单元格内部的 flex 包裹层。',
    'Flex wrapper inside the header cell.',
    ['cell-display', 'api-wiring-and-slots'],
  ),
  bodyCellEllipsis: slot(
    'cell-wrappers',
    '`ellipsis` 列内容的文本截断层。',
    'Text truncation layer for the content of `ellipsis` columns.',
    ['cell-display'],
  ),
  headerHelp: slot(
    'cell-wrappers',
    '列 `tooltip` 的表头说明图标。',
    'Header help icon for a column `tooltip`.',
    ['cell-display'],
  ),
  cellContent: slot(
    'cell-wrappers',
    '`copyable` 列的内容与复制按钮包裹层。',
    'Wrapper around the content and copy button of `copyable` columns.',
    ['cell-display'],
  ),
  copyButton: slot(
    'cell-wrappers',
    '`copyable` 列的复制按钮。',
    'Copy button of `copyable` columns.',
    ['cell-display'],
  ),

  groupedHeaderTable: slot(
    'grouped-header',
    '多级表头中的内层 `<table>`。',
    'Inner `<table>` in grouped headers.',
    ['grouped-and-merged-cells'],
  ),
  groupedHeaderTh: slot('grouped-header', '分组表头 `<th>`。', 'Grouped header `<th>`.', [
    'grouped-and-merged-cells',
  ]),
  groupedHeaderTd: slot('grouped-header', '分组表头 `<td>`。', 'Grouped header `<td>`.', [
    'grouped-and-merged-cells',
  ]),

  thSortable: slot(
    'sorting',
    '可排序列的 `<th>` 附加样式。',
    'Extra styles for the `<th>` of sortable columns.',
    ['sorting'],
  ),
  thSorted: slot(
    'sorting',
    '已激活排序的列 `<th>` 背景。',
    '`<th>` background of the actively sorted column.',
    ['sorting'],
  ),
  tdSorted: slot(
    'sorting',
    '已激活排序的列 `<td>` 背景。',
    '`<td>` background of the actively sorted column.',
    ['sorting'],
  ),
  sortButton: slot('sorting', '排序图标容器。', 'Sort icon container.', ['sorting']),
  sortIconDown: slot(
    'sorting',
    '降序图标的间距调整。',
    'Spacing adjustment for the descending icon.',
    ['sorting'],
  ),
  sortAreaOuter: slot(
    'sorting',
    '排序区最外层 flex 包裹。',
    'Outermost flex wrapper of the sort area.',
    ['sorting'],
  ),
  sortAreaWrapper: slot(
    'sorting',
    '标题和排序图标之间的 flex 包裹。',
    'Flex wrapper between the title and the sort icon.',
    ['sorting'],
  ),
  sortAreaTitle: slot('sorting', '排序标题文本容器。', 'Sort title text container.', ['sorting']),

  filterIconWrapper: slot('filter-icon', '筛选图标包裹容器。', 'Filter icon wrapper.', [
    'filtering',
  ]),
  filterIcon: slot('filter-icon', '筛选触发图标本身。', 'The filter trigger icon itself.', [
    'filtering',
  ]),

  filterDropdown: slot('filter-menu', '筛选面板根容器。', 'Filter panel root container.', [
    'filtering',
  ]),
  filterDropdownList: slot('filter-menu', '筛选选项列表容器。', 'Filter option list container.', [
    'filtering',
  ]),
  filterDropdownItem: slot('filter-menu', '单个筛选项。', 'A single filter option.', ['filtering']),
  filterDropdownItemSelected: slot('filter-menu', '选中项样式。', 'Selected option styles.', [
    'filtering',
  ]),
  filterDropdownItemSelectedSingle: slot(
    'filter-menu',
    '单选（`filterMultiple: false`）下的选中项附加样式。',
    'Extra styles for the selected option in single-select mode (`filterMultiple: false`).',
    ['filtering'],
  ),
  filterDropdownItemHover: slot('filter-menu', 'hover 项样式。', 'Hovered option styles.', [
    'filtering',
  ]),
  filterDropdownContentWrapper: slot('filter-menu', '选项内容包裹层。', 'Option content wrapper.', [
    'filtering',
  ]),
  filterDropdownActions: slot('filter-menu', '底部操作栏。', 'Bottom action bar.', ['filtering']),
  filterDropdownResetButton: slot(
    'filter-menu',
    '底部「重置」按钮的附加样式。',
    'Extra styles for the bottom "Reset" button.',
    ['filtering'],
  ),
  filterDropdownConfirmButton: slot(
    'filter-menu',
    '底部「确定」按钮的附加样式。',
    'Extra styles for the bottom "OK" button.',
    ['filtering'],
  ),
  filterDropdownSearch: slot('filter-menu', '搜索区外层。', 'Outer layer of the search area.', [
    'filtering',
  ]),
  filterDropdownSearchField: slot('filter-menu', '搜索输入框容器。', 'Search input container.', [
    'filtering',
  ]),
  filterDropdownSearchIcon: slot('filter-menu', '搜索图标。', 'Search icon.', ['filtering']),
  filterDropdownSearchInput: slot('filter-menu', '搜索输入框。', 'Search input.', ['filtering']),
  filterDropdownListEmpty: slot('filter-menu', '空结果提示。', 'Empty-result message.', [
    'filtering',
  ]),

  filterDropdownSwitcher: slot(
    'filter-tree',
    '树节点展开/折叠按钮。',
    'Expand/collapse button of a tree node.',
    ['filtering'],
  ),
  filterDropdownSwitcherExpanded: slot('filter-tree', '展开状态。', 'Expanded state.', [
    'filtering',
  ]),
  filterDropdownSwitcherCollapsed: slot('filter-tree', '折叠状态。', 'Collapsed state.', [
    'filtering',
  ]),
  filterDropdownSwitcherNoop: slot(
    'filter-tree',
    '不可切换节点占位。',
    'Placeholder for nodes that cannot be toggled.',
    ['filtering'],
  ),
  filterDropdownTreeWrapper: slot('filter-tree', '树列表包裹层。', 'Tree list wrapper.', [
    'filtering',
  ]),
  filterDropdownTreeList: slot('filter-tree', '树列表 `<ul>`。', 'Tree list `<ul>`.', [
    'filtering',
  ]),
  filterDropdownTreeItem: slot('filter-tree', '单个树节点行。', 'A single tree node row.', [
    'filtering',
  ]),
  filterDropdownTreeContentWrapper: slot(
    'filter-tree',
    '树节点内容包裹层。',
    'Tree node content wrapper.',
    ['filtering'],
  ),
  filterDropdownTreeItemSelected: slot('filter-tree', '选中节点样式。', 'Selected node styles.', [
    'filtering',
  ]),
  filterDropdownTreeItemMatched: slot(
    'filter-tree',
    '搜索命中节点样式。',
    'Styles for nodes matched by the search.',
    ['filtering'],
  ),
  filterDropdownTreeCheckAll: slot('filter-tree', '“全选” 行。', 'The "Select all" row.', [
    'filtering',
  ]),

  empty: slot('empty', '空状态根容器。', 'Empty state root container.', [
    'remote-data',
    'api-wiring-and-slots',
  ]),
  emptyWrapper: slot('empty', '空状态内容包裹层。', 'Empty state content wrapper.', [
    'remote-data',
    'api-wiring-and-slots',
  ]),
  emptyIcon: slot('empty', '空状态图标区域。', 'Empty state icon area.', [
    'remote-data',
    'api-wiring-and-slots',
  ]),
  emptyText: slot('empty', '空状态文字。', 'Empty state text.', [
    'remote-data',
    'api-wiring-and-slots',
  ]),

  loading: slot(
    'loading',
    '覆盖整张表的 loading 遮罩层。',
    'Loading mask covering the whole table.',
    ['remote-data', 'api-wiring-and-slots'],
  ),
  loadingSpinner: slot('loading', 'loading 图标。', 'Loading icon.', [
    'remote-data',
    'api-wiring-and-slots',
  ]),

  tdSelected: slot('row-states', '选中行的 `<td>` 背景。', '`<td>` background of selected rows.', [
    'selection',
  ]),
  tdRowHover: slot(
    'row-states',
    'hover 时普通行的 `<td>` 背景。',
    '`<td>` background of regular rows on hover.',
  ),
  tdRowSelectedHover: slot(
    'row-states',
    'hover 时选中行的 `<td>` 背景叠加层。',
    '`<td>` background overlay of selected rows on hover.',
    ['selection'],
  ),

  trDragging: slot('row-drag', '拖拽中的行 `<tr>`。', 'The `<tr>` of the row being dragged.', [
    'row-drag-sort',
  ]),
  trDropAbove: slot(
    'row-drag',
    '放置目标行（插入到其上方）的 `<tr>` 指示线。',
    '`<tr>` indicator line of the drop target row (insert above it).',
    ['row-drag-sort'],
  ),
  trDropBelow: slot(
    'row-drag',
    '放置目标行（插入到其下方）的 `<tr>` 指示线。',
    '`<tr>` indicator line of the drop target row (insert below it).',
    ['row-drag-sort'],
  ),

  selectionDropdown: slot('selection-menu', '行选择下拉面板。', 'Row selection dropdown panel.', [
    'selection',
  ]),
  selectionDropdownItem: slot('selection-menu', '行选择下拉项。', 'Row selection dropdown item.', [
    'selection',
  ]),
  selectionExtra: slot(
    'selection-menu',
    '行选择列头部的额外触发图标。',
    'Extra trigger icon in the header of the row selection column.',
    ['selection'],
  ),

  title: slot('summary', '表格标题区域。', 'Table title area.', ['title-footer-summary']),
  footer: slot('summary', '表格页脚区域。', 'Table footer area.', ['title-footer-summary']),
  summary: slot('summary', '摘要容器。', 'Summary container.', ['title-footer-summary']),
  summaryRow: slot('summary', '摘要 `<tr>`。', 'Summary `<tr>`.', ['title-footer-summary']),
  summaryCell: slot('summary', '摘要 `<td>`。', 'Summary `<td>`.', ['title-footer-summary']),

  headerWrapper: slot(
    'fixed',
    '固定表头模式下的表头滚动包裹层。',
    'Header scroll wrapper in fixed-header mode.',
    ['fixed-columns', 'virtualization'],
  ),
  bodyWrapper: slot(
    'fixed',
    '固定表头模式下的表体滚动包裹层。',
    'Body scroll wrapper in fixed-header mode.',
    ['fixed-columns', 'virtualization'],
  ),
  fixedCell: slot('fixed', '固定列单元格。', 'Fixed column cell.', ['fixed-columns']),
  fixedDividerLeft: slot('fixed', '左固定列分隔线。', 'Left fixed column divider.', [
    'fixed-columns',
  ]),
  fixedDividerRight: slot('fixed', '右固定列分隔线。', 'Right fixed column divider.', [
    'fixed-columns',
  ]),
  fixedShadowLeft: slot('fixed', '左固定列阴影层。', 'Left fixed column shadow layer.', [
    'fixed-columns',
  ]),
  fixedShadowRight: slot('fixed', '右固定列阴影层。', 'Right fixed column shadow layer.', [
    'fixed-columns',
  ]),
  fixedShadowLeftHidden: slot('fixed', '左侧阴影隐藏状态。', 'Hidden state of the left shadow.', [
    'fixed-columns',
  ]),
  fixedShadowRightHidden: slot('fixed', '右侧阴影隐藏状态。', 'Hidden state of the right shadow.', [
    'fixed-columns',
  ]),

  expandIcon: slot('expand', '展开按钮基础样式。', 'Base styles of the expand button.', [
    'expandable-rows',
  ]),
  expandIconExpanded: slot('expand', '展开状态。', 'Expanded state.', ['expandable-rows']),
  expandIconCollapsed: slot('expand', '折叠状态。', 'Collapsed state.', ['expandable-rows']),
  expandIconSpaced: slot(
    'expand',
    '不可展开行的占位符。',
    'Placeholder for rows that cannot be expanded.',
    ['expandable-rows'],
  ),
  expandIconDisabled: slot('expand', '禁用状态。', 'Disabled state.', ['expandable-rows']),
  expandIconSymbol: slot(
    'expand',
    '展开图标的 symbol 容器。',
    'Symbol container of the expand icon.',
    ['expandable-rows'],
  ),
  expandIconSymbolExpanded: slot('expand', '展开 symbol 状态。', 'Expanded symbol state.', [
    'expandable-rows',
  ]),
  expandIconSymbolCollapsed: slot('expand', '折叠 symbol 状态。', 'Collapsed symbol state.', [
    'expandable-rows',
  ]),
  expandedRow: slot('expand', '展开行 `<tr>`。', 'Expanded row `<tr>`.', ['expandable-rows']),
  expandedRowCell: slot('expand', '展开内容 `<td>`。', 'Expanded content `<td>`.', [
    'expandable-rows',
  ]),

  treeExpandIcon: slot('tree', '树形展开按钮基础样式。', 'Base styles of the tree expand button.', [
    'tree-table',
  ]),
  treeExpandIconExpanded: slot('tree', '展开状态。', 'Expanded state.', ['tree-table']),
  treeExpandIconCollapsed: slot('tree', '折叠状态。', 'Collapsed state.', ['tree-table']),
  treeExpandIconSpaced: slot('tree', '叶子节点占位。', 'Placeholder for leaf nodes.', [
    'tree-table',
  ]),
  treeExpandIconDisabled: slot('tree', '禁用状态。', 'Disabled state.', ['tree-table']),
  treeExpandIconSymbol: slot('tree', '树形 symbol 容器。', 'Tree symbol container.', [
    'tree-table',
  ]),
  treeExpandIconSymbolExpanded: slot(
    'tree',
    '树形展开 symbol 状态。',
    'Tree expanded symbol state.',
    ['tree-table'],
  ),
  treeExpandIconSymbolCollapsed: slot(
    'tree',
    '树形折叠 symbol 状态。',
    'Tree collapsed symbol state.',
    ['tree-table'],
  ),
  treeExpandIconLoading: slot(
    'tree',
    '懒加载进行中的按钮状态。',
    'Button state while lazy loading is in progress.',
    ['tree-table'],
  ),
  treeExpandIconError: slot(
    'tree',
    '懒加载失败后的重试按钮状态。',
    'Retry button state after lazy loading fails.',
    ['tree-table'],
  ),

  cellStatus: slot(
    'tags',
    '`valueEnum` 状态标记，按 `data-status` 着色。',
    '`valueEnum` status marker, colored by `data-status`.',
    ['cell-display', 'cell-render', 'dictionary'],
  ),
  cellTag: slot(
    'tags',
    "`valueType: 'tag'` 或渲染器 `presentation: 'tag'` 的标签外观。",
    "Tag appearance for `valueType: 'tag'` or a renderer with `presentation: 'tag'`.",
    ['cell-display', 'cell-render'],
  ),

  cellProgress: slot(
    'progress',
    '进度整体宽度与轨道、数值之间的间距。',
    'Overall progress width and the gap between the track and the value.',
    ['cell-render'],
  ),
  cellProgressTrack: slot(
    'progress',
    '轨道高度、圆角与背景。',
    'Track height, radius and background.',
    ['cell-render'],
  ),
  cellProgressBar: slot(
    'progress',
    '填充色，支持 `data-status` 状态。',
    'Fill color; supports `data-status` states.',
    ['cell-render'],
  ),
  cellProgressText: slot(
    'progress',
    '百分比文字或成功 / 错误图标。',
    'Percentage text or the success / error icon.',
    ['cell-render'],
  ),

  editCell: slot(
    'edit',
    '已进入编辑的单元格内容容器。',
    'Content container of a cell that has entered editing.',
    ['editing', 'editable-columns'],
  ),
  editControl: slot(
    'edit',
    '宿主控件的宽度和错误轮廓。',
    'Width and error outline of the host control.',
    ['editing', 'editable-columns'],
  ),
  editError: slot('edit', '按字段定位的校验错误。', 'Validation error located by field.', [
    'editing',
    'editable-columns',
  ]),

  resizeHandle: slot('resize', '列宽拖拽手柄。', 'Column resize handle.', ['column-resize']),

  widthConstraintCell: slot(
    'width-layout',
    '用于约束列宽的单元格。',
    'Cell used to constrain column widths.',
    ['column-resize', 'virtualization'],
  ),
  widthConstraintInner: slot(
    'width-layout',
    '列宽约束单元格的内部元素。',
    'Inner element of the column-width constraint cell.',
    ['column-resize', 'virtualization'],
  ),
  widthLayoutCell: slot(
    'width-layout',
    '使用列宽布局时附加的单元格样式。',
    'Cell styles added when the column-width layout is used.',
    ['column-resize', 'virtualization'],
  ),
} satisfies Record<TableSlots, SlotDef>

/** 每个 slot 的说明写成 `[中文, 英文]`。 */
function componentSlots<T extends string>(
  group: string,
  descriptions: Record<T, readonly [zh: string, en: string]>,
  features: readonly DocFeature[],
): Record<string, SlotDef> {
  return Object.fromEntries(
    Object.entries<readonly [string, string]>(descriptions).map(([name, [zh, en]]) => [
      name,
      slot(group, zh, en, features),
    ]),
  )
}

const paginationSlots = componentSlots<PaginationSlots>(
  'pagination',
  {
    root: ['分页根容器。', 'Pagination root container.'],
    layout: ['自定义分页布局的两区容器。', 'Two-region container of a custom pagination layout.'],
    left: ['分页布局左区。', 'Left region of the pagination layout.'],
    right: ['分页布局右区。', 'Right region of the pagination layout.'],
    extension: ['自定义分页内容的容器。', 'Container for custom pagination content.'],
    pages: [
      '页码与前后导航按钮容器。',
      'Container for page numbers and the previous / next navigation buttons.',
    ],
    item: ['页码与导航按钮。', 'Page number and navigation buttons.'],
    active: ['当前页码附加样式。', 'Extra styles for the current page number.'],
    jump: ['跳过一组页码的按钮。', 'Button that skips a group of page numbers.'],
    jumpEllipsis: ['跳页按钮中的省略号。', 'Ellipsis in the jump button.'],
    jumpIcon: ['跳页按钮悬停时显示的图标。', 'Icon shown when the jump button is hovered.'],
    controls: [
      '每页条数与快速跳转等控件区域。',
      'Area for controls such as page size and quick jump.',
    ],
    simpleControls: ['简洁模式控件区域。', 'Simple mode controls area.'],
    simpleInput: [
      '简洁模式页码输入框附加样式。',
      'Extra styles for the page number input in simple mode.',
    ],
    slash: [
      '当前页与总页数之间的分隔符。',
      'Separator between the current page and the total page count.',
    ],
    go: ['快速跳转确认按钮。', 'Quick jump confirm button.'],
    input: ['页码输入框。', 'Page number input.'],
    select: ['每页条数选择按钮。', 'Page size select button.'],
    popup: ['每页条数下拉面板。', 'Page size dropdown panel.'],
    option: ['每页条数下拉选项。', 'Page size dropdown option.'],
    optionActive: ['已选每页条数选项附加样式。', 'Extra styles for the selected page size option.'],
    total: ['总条数文字。', 'Total count text.'],
    icon: ['分页按钮图标。', 'Pagination button icon.'],
  },
  ['pagination'],
)

const toolbarSlots = componentSlots<ToolbarSlots>(
  'toolbar',
  {
    root: ['工具栏根容器与响应式布局。', 'Toolbar root container and responsive layout.'],
    title: ['标题区。', 'Title area.'],
    right: [
      '业务操作和内置工具的包裹层。',
      'Wrapper around application actions and built-in tools.',
    ],
    actions: ['`#actions` 业务按钮容器。', 'Container for `#actions` application buttons.'],
    settings: ['内置工具或 `#settings` 的容器。', 'Container for built-in tools or `#settings`.'],
    search: ['工具栏轻搜索容器。', 'Toolbar lightweight search container.'],
    searchGroup: [
      '搜索输入区和提交按钮的组合容器。',
      'Combined container for the search input area and the submit button.',
    ],
    searchField: ['搜索文本框的外层。', 'Outer layer of the search text box.'],
    searchInput: ['搜索文本输入框。', 'Search text input.'],
    searchSubmit: ['搜索提交按钮。', 'Search submit button.'],
    searchClear: ['清除搜索文本按钮。', 'Button that clears the search text.'],
    searchIcon: ['搜索与清除图标。', 'Search and clear icons.'],
    filter: [
      '单行布局中的 `#filter` 内容容器。',
      'Container for `#filter` content in the single-row layout.',
    ],
    extra: [
      '`#extra` 与多行布局中的 `#filter` 内容容器。',
      'Container for `#extra` content, and for `#filter` content in the multi-row layout.',
    ],
    action: ['刷新、全屏等内置按钮。', 'Built-in buttons such as refresh and fullscreen.'],
    icon: ['内置工具图标。', 'Built-in tool icon.'],
    loadingIcon: ['刷新加载动画。', 'Refresh loading animation.'],
  },
  ['toolbar'],
)

const columnSettingsSlots = componentSlots<ColumnSettingsSlots>(
  'column-settings',
  {
    root: ['密度与列设置触发器容器。', 'Container for the density and column settings triggers.'],
    trigger: ['列设置按钮。', 'Column settings button.'],
    densityTrigger: ['密度按钮。', 'Density button.'],
    popup: ['列设置浮层。', 'Column settings overlay.'],
    densityPopup: ['密度浮层。', 'Density overlay.'],
    density: ['密度菜单选项。', 'Density menu option.'],
    header: ['列设置面板头部。', 'Column settings panel header.'],
    heading: ['全选标题。', 'Select-all heading.'],
    reset: ['重置按钮。', 'Reset button.'],
    columns: ['列列表。', 'Column list.'],
    children: ['嵌套子列列表。', 'Nested child column list.'],
    item: ['列列表项。', 'Column list item.'],
    row: ['列选项行，作为拖拽载体。', 'Column option row; serves as the drag carrier.'],
    rowDragging: ['拖拽中的源行描边。', 'Outline of the source row being dragged.'],
    rowDropAbove: ['目标行的上插入线。', 'Insertion line above the target row.'],
    rowDropBelow: ['目标行的下插入线。', 'Insertion line below the target row.'],
    rowDropDot: ['插入线左端的圆点。', 'Dot at the left end of the insertion line.'],
    dragHandle: ['拖拽手柄。', 'Drag handle.'],
    pinActions: ['固定位置按钮组。', 'Pin position button group.'],
    pinAction: ['固定位置按钮。', 'Pin position button.'],
    pinIcon: ['固定位置图标。', 'Pin position icon.'],
    group: [
      '按固定位置划分的列组容器。',
      'Container for a group of columns divided by pin position.',
    ],
    groupTitle: ['固定位置分组标题。', 'Pin position group title.'],
    groupColumns: ['组内列列表。', 'Column list within a group.'],
    label: ['列选项标签。', 'Column option label.'],
    checkboxControl: ['复选框容器。', 'Checkbox container.'],
    checkbox: ['复选框输入元素。', 'Checkbox input element.'],
    checkMark: ['选中标记。', 'Check mark.'],
    indeterminateMark: ['半选标记。', 'Indeterminate mark.'],
    labelText: ['列选项标签文字。', 'Column option label text.'],
    empty: ['无可配置列时的提示。', 'Message shown when there are no configurable columns.'],
  },
  ['column-display', 'toolbar'],
)

const selectionAlertSlots = componentSlots<SelectionAlertSlots>(
  'selection-alert',
  {
    root: ['批量操作提示条根容器。', 'Selection alert root container.'],
    info: [
      '选中数量或 `#info` 自定义内容的容器。',
      'Container for the selected count or custom `#info` content.',
    ],
    text: ['默认选中数量文字。', 'Default selected count text.'],
    clear: ['清空选择按钮。', 'Clear selection button.'],
    option: [
      '清空选择与批量操作区域的容器。',
      'Container for the clear selection and batch action areas.',
    ],
    actions: ['批量操作内容容器。', 'Batch action content container.'],
  },
  ['selection-alert'],
)

const querySlots = componentSlots<QuerySlots>(
  'query',
  {
    root: ['Schema 查询区根容器。', 'Schema query area root container.'],
    fields: [
      '表单模式栅格或轻量模式字段容器。',
      'Form mode grid or lightweight mode field container.',
    ],
    field: ['单个查询字段布局。', 'Layout of a single query field.'],
    label: ['字段标签。', 'Field label.'],
    control: ['宿主控件容器。', 'Host control container.'],
    error: ['单字段错误。', 'Single-field error.'],
    actions: ['查询、重置与折叠操作区。', 'Query, reset and collapse action area.'],
    feedback: ['查询区整体错误反馈。', 'Overall error feedback for the query area.'],
    collapse: ['展开或折叠字段的入口。', 'Entry point for expanding or collapsing fields.'],
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

const slotGroups = new Map<string, Array<[name: string, meta: SlotDef]>>()
for (const { slots } of Object.values(themeSurfaces)) {
  for (const [name, meta] of Object.entries<SlotDef>(slots)) {
    const rows = slotGroups.get(meta.group) ?? []
    rows.push([name, meta])
    slotGroups.set(meta.group, rows)
  }
}

const antdvSize = resolveTableThemePreset('antdv').defaultVariants.size
const elementPlusSize = resolveTableThemePreset('element-plus').defaultVariants.size

const tableVariants: Record<DocLang, DocTable> = {
  zh: {
    headers: ['Variant', '值', '默认值', '影响的 Slot'],
    rows: [
      [
        '`size`',
        '`small` / `middle` / `large`',
        `antdv 为 \`${antdvSize}\`，element-plus 为 \`${elementPlusSize}\``,
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
  en: {
    headers: ['Variant', 'Values', 'Default', 'Affected slots'],
    rows: [
      [
        '`size`',
        '`small` / `middle` / `large`',
        `\`${antdvSize}\` for antdv, \`${elementPlusSize}\` for element-plus`,
        'Padding of `th`, `td`, `title`, `footer` and `summaryCell`',
      ],
      [
        '`bordered`',
        '`true` / `false`',
        '`false`',
        'Borders of `root`, `th`, `td`, `tbody`, `title`, `footer` and `summaryCell`',
      ],
      [
        '`striped`',
        '`true` / `false`',
        '`false`',
        'Even-row background of `td` and the related row-state slots',
      ],
      [
        '`hoverable`',
        '`true` / `false`',
        '`true`',
        '`tdRowHover` and `tdRowSelectedHover` set the hover background of regular and selected rows',
      ],
      [
        '`loading`',
        '`true` / `false`',
        '`false`',
        'With boolean `true`, the antdv `table` becomes translucent and ignores pointer events. In both presets the mask and default icon come from `loading` and `loadingSpinner`.',
      ],
    ],
  },
}

/** `@api: theme-reference <id>` 使用的表格，按语言生成。 */
export function themeReferenceTables(lang: DocLang): Record<string, DocTable> {
  return {
    ...Object.fromEntries(
      Array.from(slotGroups, ([group, slots]) => [
        `slots-${group}`,
        {
          headers: lang === 'en' ? ['Slot', 'Description'] : ['Slot', '说明'],
          rows: slots.map(([name, meta]) => [
            `\`${name}\``,
            lang === 'en' ? meta.descriptionEn : meta.description,
          ]),
        },
      ]),
    ),
    'table-variants': tableVariants[lang],
  }
}
