# API Reference

这一页是组件行为参考：查 props、events、slots、默认值和受控规则。

如果你要查 `TableColumnsType`、`Breakpoint`、`RowSelection` 等 TypeScript 类型的完整关系，请看 [类型参考](/guide/type-reference)。本页末尾提供完整的 [Type Declarations](#type-declarations)，可以直接查看参数与返回值。

## 导入入口

推荐从 `@vtable-guild/vtable-guild` 统一导入组件、常量和类型。

```ts
import {
  VTable,
  VTableToolbar,
  VTableColumnSettings,
  VTableSummary,
  useTableRequest,
  useTableQuery,
  useTableEdit,
  createTableRenderers,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
  type TableColumnsType,
  type RowSelection,
  type Expandable,
  type TableInstance,
} from '@vtable-guild/vtable-guild'
```

## 工具栏与列设置

`VTableToolbar` 是独立组件，放进 `VTable` 的 `#title` 即可组合使用。与表格共享 `v-model:columns`、`v-model:size`；默认开启刷新、密度和列设置，全屏通过 `options.fullScreen` 启用，默认以所在表格为目标，`fullscreenTarget` 可指定其他元素。刷新仅发出 `reload`，数据请求与 `loading` 由业务管理。

`#actions` 添加导出、新增等业务按钮；`#settings` 完全替换内置工具；`options: false` 只关闭内置工具，保留业务插槽。完整 props、事件、插槽和可运行导出示例见 [工具栏与业务扩展](/guide/toolbar)。

只需要密度和列设置时可单独使用 `VTableColumnSettings`，包含显隐、固定左右与同一固定区域内的顶层拖拽换序。`options.density / setting / fixed / draggable` 分别控制入口；列的 `disable` 锁定操作，`hideInSetting` 隐藏设置项，`#columnLabel` 自定义标签。面板重置只恢复初始显隐；`useColumnState().reset()` 可恢复显隐、固定与顺序，详见 [列显示与列顺序](/guide/column-display)。

## 查询与编辑协议

这组 Vue 组合式函数参考 Ant Design ProTable 的查询与 EditableProTable 状态，不会从 columns 生成完整表单。控件、表单校验和数据提交继续使用宿主 UI 库与业务服务，`antdv / element-plus` 共享同一协议。

<!-- @api: reference query-edit-protocol -->

查询通过 `onSubmit: request.submit` 和 `onReset: request.reset` 连接请求管理器；提交与重置都回到第一页，后者同时清空排序与筛选。`useTableQuery` 不自行首次请求，也不因折叠隐藏而清空字段。编辑默认单行模式，开始第二行返回 `false`；多行模式逐行处理。`onSave / onCancel` 返回 `false` 可保持编辑，抛错进入行错误。草稿不依赖可视行组件，业务更新数据源并在切换数据集时明确取消旧草稿。

## VTable Props

### 数据与结构

<!-- @api: reference props-data -->

懒加载要求稳定行键；同一节点并发请求去重，折叠后响应进入缓存而不重新展开。删除节点、替换同 key 记录或卸载会使旧任务失效，加载结果不写入输入数据。选择关系只覆盖已加载后代，分页仍以根节点为单位，详见[树形表格](/guide/tree-table)。

### 服务端计算与请求

<!-- @api: reference props-manual -->

`manual` 只决定跳过哪些本地计算，对象中省略的字段按 `false` 处理；它不会发起或阻止网络请求。表头状态、筛选控件和 `change(filters, sorter, extra)` 继续工作。`sorter: true` 本身仍表示本地默认排序，服务端排序应同时开启 `manual.sort`。

全量数据可以由表格本地分页：传入完整记录和 `pagination: { defaultPageSize: 10 }`，不启用 `manual.pagination`，也不把翻页事件接到请求函数。远程分页则显式传 `total`，启用 `manual.pagination` 跳过本地切片，展示服务器返回的当页记录。

可选的 [useTableRequest](/guide/remote-data) 提供请求、加载状态和刷新等能力。标准全远程接法将其 `manual`、`pagination` 和 `onChange` 一起绑定：返回的 `manual` 是固定、冻结的普通对象 `{ sort: true, filter: true, pagination: true }`，不是 ref；效果同 `:manual="true"`。`onChange` 负责把排序、筛选和翻页转成请求。覆盖组件的 `manual` 不会改变这个请求行为，Hook 当前也没有按项控制请求的选项。

全量加载后本地处理时，可以只取 Hook 的数据、加载和刷新能力，使用独立的本地分页及列状态。混合模式由业务根据 `extra.action` 分流请求，并同步管理排序、筛选和分页状态。完整接法见[处理模式选择](/guide/remote-data#processing-modes)。

### 视觉与布局

<!-- @api: reference props-layout -->

#### loading {#loading}

`loading` 传对象时的配置项。

<!-- @api: reference loading-config -->

### 滚动与定位

<!-- @api: reference props-scroll -->

#### scroll {#scroll}

<!-- @api: reference scroll-config -->

#### sticky {#sticky}

`sticky` 传对象时的配置项；`true` 等同 `{}`。

<!-- @api: reference sticky-config -->

### 主题与语言

<!-- @api: reference props-theme -->

### 交互能力

<!-- @api: reference props-interaction -->

### 自定义结构

<!-- @api: reference props-structure -->

## 单元格展示增强

<!-- @api: reference columns-cell-display -->

`copyable` 与 `tooltip` 的对象配置见[单元格展示](/guide/cell-display#api)；表级与列级 `showSorterTooltip` 使用同一个 [`TableTooltipConfig`](/guide/cell-display#tabletooltipconfig)。

列级 `valueEnum?: ColumnValueEnum` 支持对象或 Map，值为文本或 `{ text, status }`，status 可为 success、warning、error、processing、default。
`filters: true` 从枚举生成筛选项。`filters: false` 不提供默认筛选项。`onFilter: false` 跳过本地过滤，`onFilter: true` 使用等值匹配。
详见[单元格展示](/guide/cell-display)。

列级 `valueType?: string` 选择 `text / digit / money / date / dateTime / time / dateRange / dateTimeRange / percent / progress / tag` 或自定义类型；`fieldProps` 为选项对象或上下文回调。`createTableRenderers<TRecord>(overrides)` 合并内置与业务映射，返回不可变注册表，通过表格 `renderers` 接入，不修改全局注册表。数字、货币与百分比使用 Intl，日期可通过 dateFormat 启用 Intl；tag / progress 与 `valueEnum` 共用状态主题。

`transformCellText` 先执行，字段渲染器消费转换后的值与枚举标签；`customRender`、有效 `bodyCell` 内容优先，空值使用既有 `columnEmptyText`，未知类型回退到枚举或原值。排序、筛选与默认复制的数据约定保持不变。渲染器只提供只读展示，详见[字段渲染器](/guide/cell-render)。

## 远程字典

`createTableDictionary({ key, request, cacheTime?, maxEntries? })` 创建实例隔离的缓存；`useTableDictionary({ dictionary, params?, selectedOptions?, debounceTime? })` 将共享结果转为宿主控件 `options`、列 `valueEnum` 和完整字典的 `filters`。返回 `search / reload / cancel` 以及 loading/error 状态；局部搜索结果不自动生成表头筛选。完整协议见[远程字典](/guide/dictionary)。

## Schema 查询与列编辑

`VTableQuery` 接 `query / fields / controls`，复用 useTableQuery；`deriveTableQueryFields` 可从带 query 元数据的列定义派生字段。普通查询显式提交，轻量布局只有开启 autoSubmit 才防抖提交；宿主表单通过 validate 接入，包裹已有 Form 时使用 `rootTag="div"`。见 [Schema 查询区](/guide/schema-query)。

`useTableEditable` 接 columns、controls 和行编辑选项，将 `column.editor` 的条件、转换、规则和字典接入同一行草稿。模板通过 `VTableEditCell` 桥接，TSX 可调用 renderEditor；无编辑内容时保留只读回退。见 [列级编辑](/guide/editable-columns)。

`useTableEdit / useTableEditable` 的受控 dataSource/onChange、records、getOriginal/getDrafts/getValues/validateAll/reset、createRecord/maxRows 和 add 的位置/缓存策略用于主表单明细。validateAll 返回同次校验的提交快照，包含客户端持有的离屏记录，不调用保存；onChange 不随逐键输入触发。见 [明细表单](/guide/detail-form)。

## VTable 实例方法

模板 ref 使用公开 `TableInstance` 类型；普通与虚拟表体共用同一接口，详见[表格实例与定位](/guide/table-instance)。

<!-- @api: reference instance-methods -->

定位只处理当前页已经加载且可见的记录；跨页、折叠树节点和被筛选移除的记录返回 false，业务先切页、加载或展开，再定位。不定行高虚拟列表使用已有测量与纠偏，Promise 表示定位已提交，不承诺未来图片加载后的最终像素位置。

## Column 行为

### 基础字段

<!-- @api: reference columns-base -->

### 自定义渲染

<!-- @api: reference columns-render -->

<<< @/.vitepress/type-declarations/examples.typecheck.ts#CustomRenderExample

### 固定列与列宽拖拽

<!-- @api: reference columns-sizing -->

`width` 是目标宽度，不能覆盖有效 `minWidth`；下限之和超过容器时产生横向滚动，与列是否 `resizable` 无关。详见[最小列宽与布局](/guide/column-resize#最小列宽与布局)。

### 排序

<!-- @api: reference columns-sorting -->

表级 `sortDirections` 和 `showSorterTooltip` 可作为默认值；列级配置优先。

### 筛选

<!-- @api: reference columns-filtering -->

### 列设置

<!-- @api: reference columns-settings -->

### 列编辑

<!-- @api: reference columns-editing -->

### 多级表头

<!-- @api: reference columns-group -->

列组不会接收排序、筛选、`dataIndex` 和 `customRender` 等叶子列行为。

## Row Selection

`rowSelection` 开启选择列，支持多选、单选、树形联动、批量选择菜单和受控选中状态。

<!-- @api: reference row-selection -->

默认批量选择常量见 [SelectionSentinel](/guide/type-reference#selectionsentinel)。

启用分页后，表头全选和反选限定当前页。“全选所有”菜单（`selections: true` 或 `[SELECTION_ALL]`）选择筛选后全部已加载的可选记录。远程分页使用 `preserveSelectedRowKeys: true` 保留跨页 key 和已选记录，不会自动请求未加载页。见[分页与跨页选择](/guide/selection#分页与跨页选择)。

## Expandable

`expandable` 用于展开行内容。树形数据的展开 props 在 `VTable` 顶层配置。

<!-- @api: reference expandable -->

## Events

`TRecord` 表示业务行类型。`VTableEventProps<TRecord>` 可为模板事件处理函数和事件 props 提供类型。只需要分页时，可使用 `pagination.onChange(page, pageSize)`；表格事件中的分页状态从 `extra.pagination` 读取。

<!-- @api: reference events -->

`change` 保留三参数签名。启用分页后增加 `extra.pagination`；`extra.action` 支持 `'sort'`、`'filter'`、`'select'`、`'paginate'`。

排序、筛选、分页事件的 `extra.currentDataSource` 为分页前处理后的数据；选择事件为当前页展示数据。远程场景仅包含已加载记录。

<<< @/.vitepress/type-declarations/examples.typecheck.ts#PaginationChangeExample

## Slots

<!-- @api: reference slots -->

> 这里列的是 Vue slots。若要通过 class 覆盖结构样式，请查看 [ui Slot 参考](/guide/ui-slots-reference)。

## VTableSummary

`VTableSummary` 用于摘要行。

<!-- @api: reference summary -->

### VTableSummary Props

<!-- @api: reference summary-props -->

### VTableSummary.Cell Props

<!-- @api: reference summary-cell-props -->

## 相关页面

- [类型参考](/guide/type-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
- [排序](/guide/sorting)
- [筛选](/guide/filtering)

## Pagination

`pagination?: false | TablePaginationConfig`，默认关闭，传 `{}` 启用。配置项见[分页配置参考](/guide/pagination#配置参考)，翻页后是否回到第一行由 [`scroll.scrollToFirstRowOnChange`](#scroll) 控制。

## Type Declarations

类型统一从 `@vtable-guild/vtable-guild` 导入。基础类型和类型之间的关系见[类型参考](/guide/type-reference)。下方摘要组件 props 是声明说明用辅助类型，不是包导出名称。

::: details Props 与列配置

<<< @/.vitepress/type-declarations/table.ts#TableProps

<<< @/.vitepress/type-declarations/table.ts#ColumnType

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

<<< @/.vitepress/type-declarations/table.ts#ColumnTitleProps

<<< @/.vitepress/type-declarations/table.ts#ColumnTitle

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

<<< @/.vitepress/type-declarations/table.ts#CustomRenderContext

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

<<< @/.vitepress/type-declarations/table.ts#RowClassName

<<< @/.vitepress/type-declarations/table.ts#TransformCellText

<<< @/.vitepress/type-declarations/table.ts#TableSticky

:::

::: details 选择与展开

<<< @/.vitepress/type-declarations/table.ts#RowSelection

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

<<< @/.vitepress/type-declarations/table.ts#Expandable

:::

::: details 事件与插槽

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#RowDragSortInfo

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableHeaderCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

:::

::: details 分页

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#TablePaginationPosition

<<< @/.vitepress/type-declarations/table.ts#PaginationItemType

<<< @/.vitepress/type-declarations/table.ts#TablePaginationBuiltinLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayout

<<< @/.vitepress/type-declarations/table.ts#TablePaginationSlotProps

:::

::: details 摘要组件

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

:::
