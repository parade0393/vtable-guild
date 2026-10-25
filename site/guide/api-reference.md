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

`VTableToolbar` 是独立组件，放进 `VTable` 的 `#title` 即可组合使用。与表格共享 `v-model:columns`、`v-model:size`；默认开启刷新、密度和列设置，全屏通过 `options.fullScreen` 与 `fullscreenTarget` 启用。刷新仅发出 `reload`，数据请求与 `loading` 由业务管理。

`#actions` 添加导出、新增等业务按钮；`#settings` 完全替换内置工具；`options: false` 只关闭内置工具，保留业务插槽。完整 props、事件、插槽和可运行导出示例见 [工具栏与业务扩展](/guide/toolbar)。

只需要密度和列设置时可单独使用 `VTableColumnSettings`，包含显隐、固定左右与同一固定区域内的顶层拖拽换序。`options.density / setting / fixed / draggable` 分别控制入口；列的 `disable` 锁定操作，`hideInSetting` 隐藏设置项，`#columnLabel` 自定义标签。面板重置只恢复初始显隐；`useColumnState().reset()` 可恢复显隐、固定与顺序，详见 [列显示与列顺序](/guide/column-display)。

## 查询与编辑协议

这组 Vue 组合式函数参考 Ant Design ProTable 的查询与 EditableProTable 状态，不会从 columns 生成完整表单。控件、表单校验和数据提交继续使用宿主 UI 库与业务服务，`antdv / element-plus` 共享同一协议。

| 入口                                              | 配置与返回状态                                                                                                                                                                     | 行为                                                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`useTableQuery<TValues, TParams>`](/guide/query) | `defaultValues / fieldTransforms / transform / onSubmit / onReset / collapsed / defaultCollapsed / onCollapse`；返回 `draft / submitted / params / collapsed / submitting / error` | 输入只改草稿；`submit()` 转换并提交，`reset()` 恢复默认值后提交，`resetFields()` 只恢复草稿；`toggleCollapsed()` 不查询                                      |
| [`useTableEdit<TRecord>`](/guide/editing)         | 必填 `rowKey`；可选 `mode / clone / validate / onSave / onCancel / onError`；返回 `editableKeys / savingKeys / cancellingKeys / errors / newRecords`                               | `start / add / getDraft / setDraft / isEditing / save / cancel / cancelAll` 管理独立草稿；异步校验或保存失败保留草稿，保存完成退出编辑；缓存新增行取消后移除 |

查询通过 `onSubmit: request.submit` 和 `onReset: request.reset` 连接请求管理器；提交与重置都回到第一页，后者同时清空排序与筛选。`useTableQuery` 不自行首次请求，也不因折叠隐藏而清空字段。编辑默认单行模式，开始第二行返回 `false`；多行模式逐行处理。`onSave / onCancel` 返回 `false` 可保持编辑，抛错进入行错误。草稿不依赖可视行组件，业务更新数据源并在切换数据集时明确取消旧草稿。

## VTable Props

### 数据与结构

| Prop                 | 类型                                                             | 默认值       | 说明                                                                         |
| -------------------- | ---------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                                                      | `[]`         | 表格数据源。                                                                 |
| `pagination`         | `false \| TablePaginationConfig`                                 | `false`      | 传 `{}` 启用本地或远程分页，见[分页](/guide/pagination)。                    |
| `columns`            | [`TableColumnsType<TRecord>`](/guide/type-reference#columnstype) | `[]`         | 列配置，支持叶子列、列组和列占位常量。                                       |
| `columnOrder`        | [`Key[]`](/guide/type-reference#key)                             | -            | 列显示顺序，见[列显示与列顺序](/guide/column-display#列顺序-columnorder)。   |
| `rowKey`             | `string \| ((record: TRecord) => Key)`                           | -            | 行唯一标识，建议显式传入。                                                   |
| `childrenColumnName` | `string`                                                         | `'children'` | 树形数据的子节点字段名。                                                     |
| `indentSize`         | `number`                                                         | `15`         | 树形数据缩进宽度，单位 px。                                                  |
| `loadData`           | `TableTreeLoadData<TRecord>`                                     | -            | `(record, { signal }) => Promise<TRecord[]>`，懒加载未提供 children 的节点。 |
| `isLeaf`             | `(record: TRecord) => boolean`                                   | -            | 明确懒加载树的叶子节点；已有 `children: []` 也视为叶子。                     |
| `onTreeLoadError`    | `(error: Error, record: TRecord) => void`                        | -            | 懒加载错误通知，可用 `@tree-load-error` 绑定。                               |
| `renderers`          | `TableFieldRenderers<TRecord>`                                   | 内置映射     | 按表覆盖或扩展 `valueType` 的只读渲染器。                                    |

懒加载要求稳定行键；同一节点并发请求去重，折叠后响应进入缓存而不重新展开。删除节点、替换同 key 记录或卸载会使旧任务失效，加载结果不写入输入数据。选择关系只覆盖已加载后代，分页仍以根节点为单位，详见[树形表格](/guide/tree-table)。

### 服务端计算与请求

`manual?: boolean | TableManualConfig`，默认关闭。`true` 跳过本地排序、筛选和分页切片；对象形式分别设置 `sort`、`filter`、`pagination`。
对应的表头状态、筛选控件和 `change(filters, sorter, extra)` 继续工作。`sorter: true` 本身仍表示本地默认排序，服务端排序应同时开启 `manual.sort`。
远程分页显式传 `total`；`manual.pagination` 关闭本地切片，适合服务器已经返回当页记录的场景。

可选的 [useTableRequest](/guide/remote-data) 返回数据、loading、error、受控 pagination、manual 和单入口 onChange，并提供 submit、reset、reload、cancel。
仅需自行管理请求时，也可以直接传入数据和状态；`manual` 不会自动发起网络请求。

### 视觉与布局

| Prop             | 类型                                                                                                                 | 默认值    | 说明                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| `size`           | `'small' \| 'middle' \| 'large'`                                                                                     | `'large'` | 表格尺寸，与 ant-design-vue 命名对齐。          |
| `loading`        | `boolean \| { spinning?: boolean; indicator?: VNodeChild; tip?: string; delay?: number; wrapperClassName?: string }` | `false`   | 加载态，可延迟显示并为包装层设置 class。        |
| `bordered`       | `boolean`                                                                                                            | `false`   | 显示边框。                                      |
| `striped`        | `boolean`                                                                                                            | `false`   | 开启斑马纹。                                    |
| `hoverable`      | `boolean`                                                                                                            | `true`    | 开启行 hover 高亮。                             |
| `tableLayout`    | `'auto' \| 'fixed'`                                                                                                  | -         | 表格布局模式。                                  |
| `showHeader`     | `boolean`                                                                                                            | `true`    | 是否显示表头。                                  |
| `headerEllipsis` | `boolean`                                                                                                            | `false`   | 让开启了 `column.ellipsis` 的列表头也单行省略。 |
| `class`          | `string`                                                                                                             | -         | 根节点额外 class。                              |

### 滚动与定位

| Prop                | 类型                                                                                 | 默认值  | 说明                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll`            | `{ x?: number \| string; y?: number \| string; scrollToFirstRowOnChange?: boolean }` | -       | 横向和纵向滚动配置；提供 `y` 时形成固定表头滚动区。`y: 'auto'` 表示自动适应内容区（组件内部扣减表头/固定 summary 高度，需父容器有确定高度，见[虚拟滚动](/guide/virtualization#自动高度-scrolly-auto)）。 `scrollToFirstRowOnChange` 控制排序、筛选、分页后的纵向复位，开启分页时默认 true，否则默认 false。 |
| `sticky`            | `boolean \| TableSticky`                                                             | `false` | 粘性表头、摘要行或横向滚动条配置。                                                                                                                                                                                                                                                                          |
| `virtual`           | `boolean`                                                                            | `false` | 启用虚拟滚动；需要同时设置 `scroll.y`。                                                                                                                                                                                                                                                                     |
| `virtualColumn`     | `boolean`                                                                            | `false` | 横向虚拟化，只渲染视口内的列；需要同时开启 `virtual`。列数很多时才有收益，见[虚拟滚动](/guide/virtualization#横向虚拟化-virtualcolumn)。                                                                                                                                                                    |
| `rowHeight`         | `number`                                                                             | -       | 固定行高（px），仅在 `virtual` 下生效。声明后跳过全部行高测量，可视区计算恒为 O(1)。仅当每行实际高度确实等于该值时才可传，见[虚拟滚动](/guide/virtualization#定高快路径-rowheight)。                                                                                                                        |
| `getPopupContainer` | `(triggerNode: HTMLElement) => HTMLElement`                                          | -       | 筛选、选择和页大小菜单的挂载容器。                                                                                                                                                                                                                                                                          |

### 主题与语言

| Prop              | 类型                                                     | 默认值               | 说明                                                                                         |
| ----------------- | -------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `ui`              | `SlotProps<{ slots: Record<TableSlots, string> }>`       | -                    | 当前表实例的 theme slot class 覆盖。完整 slot 见 [ui Slot 参考](/guide/ui-slots-reference)。 |
| `locale`          | [`LocaleName`](/guide/type-reference#localename)         | 全局配置或 `'zh-CN'` | 当前表实例使用的语言标识。                                                                   |
| `locales`         | [`LocaleRegistry`](/guide/type-reference#localeregistry) | `{}`                 | 当前实例额外注册的语言包。                                                                   |
| `localeOverrides` | `DeepPartial<VTableGuildTableLocale>`                    | `{}`                 | 当前实例的 locale 局部覆写。                                                                 |

### 交互能力

| Prop                     | 类型                                                          | 默认值  | 说明                                                                   |
| ------------------------ | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `rowSelection`           | [`RowSelection<TRecord>`](/guide/type-reference#rowselection) | -       | 开启行选择列。                                                         |
| `expandable`             | [`Expandable<TRecord>`](/guide/type-reference#expandable)     | -       | 开启展开行能力。                                                       |
| `rowDraggable`           | `boolean`                                                     | `false` | 开启行拖拽排序，见[行拖拽排序](/guide/row-drag-sort)。                 |
| `expandedRowKeys`        | `Key[]`                                                       | -       | 树形数据的受控展开 key 列表。                                          |
| `defaultExpandedRowKeys` | `Key[]`                                                       | -       | 树形数据的默认展开 key 列表。                                          |
| `defaultExpandAllRows`   | `boolean`                                                     | `false` | 树形数据默认展开所有节点。                                             |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                | -       | 树形数据展开/折叠回调。                                                |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                               | -       | 树形数据展开 key 变化回调。                                            |
| `transformCellText`      | `TransformCellText<TRecord>`                                  | -       | 统一转换单元格文本；`opt` 包含 `text`、`column`、`record` 和 `index`。 |
| `showSorterTooltip`      | `boolean \| TableTooltipConfig`                               | `true`  | 表级排序提示配置，可被列级覆盖。                                       |
| `sortDirections`         | [`SortOrder[]`](/guide/type-reference#sortorder)              | -       | 表级排序方向列表，作为列级 `sortDirections` 的默认值。                 |

### 自定义结构

| Prop              | 类型                                                                                                    | 默认值 | 说明                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------ |
| `rowClassName`    | `string \| RowClassName<TRecord>`                                                                       | -      | 为 body row 添加 class。             |
| `customRow`       | `GetComponentProps<TRecord>`                                                                            | -      | 为 body row 注入属性、事件和样式。   |
| `customHeaderRow` | `(columns: (ColumnType<TRecord> \| ColumnGroupType<TRecord>)[], index?: number) => CellAdditionalProps` | -      | 为 header row 注入属性、事件和样式。 |
| `title`           | `(data: TRecord[]) => VNodeChild`                                                                       | -      | 表格标题区域渲染函数。               |
| `footer`          | `(data: TRecord[]) => VNodeChild`                                                                       | -      | 表格页脚区域渲染函数。               |

## 单元格展示增强

`columnEmptyText?: VNodeChild | false` 默认为 `false`，只替换 `null` / `undefined`，保留 `0`、`false` 与空字符串。
`loading` 对象额外支持 `delay?: number`（毫秒）与 `wrapperClassName?: string`；延迟期间关闭加载会取消展示。

列级 `copyable?: ColumnCopyable<TRecord>` 支持开关或 `{ text, onCopy, onError }`；`text` 可为字符串或返回字符串 / Promise 的上下文回调。
列级 `tooltip?: string | TableTooltipConfig` 提供表头说明；表级与列级 `showSorterTooltip` 支持 boolean 或同一配置对象。
配置项包括 `title`、`placement`、`mouseEnterDelay`、`mouseLeaveDelay`、`color`、`arrow` 和 `class`。

列级 `valueEnum?: ColumnValueEnum` 支持对象或 Map，值为文本或 `{ text, status }`，status 可为 success、warning、error、processing、default。
`filters: true` 从枚举生成筛选项；`filters: false` 关闭，`onFilter: false` 显式跳过本地过滤，`onFilter: true` 使用等值匹配。
详见[单元格展示](/guide/cell-display)。

列级 `valueType?: string` 选择 `text / digit / money / date / tag` 或自定义类型；`fieldProps` 为选项对象或上下文回调。`createTableRenderers<TRecord>(overrides)` 合并内置与业务映射，返回不可变注册表，通过表格 `renderers` 接入，不修改全局注册表。`digit / money / date` 使用 Intl 格式化；tag 与 `valueEnum` 共用状态主题。

`transformCellText` 先执行，字段渲染器消费转换后的值与枚举标签；`customRender`、有效 `bodyCell` 内容优先，空值使用既有 `columnEmptyText`，未知类型回退到枚举或原值。排序、筛选与默认复制的数据约定保持不变。渲染器只提供只读展示，详见[字段渲染器](/guide/cell-render)。

## VTable 实例方法

模板 ref 使用公开 `TableInstance` 类型；普通与虚拟表体共用同一接口，详见[表格实例与定位](/guide/table-instance)。

| 方法                                                       | 返回值与边界                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrollTo({ key?, index?, top?, left?, align?, offset? })` | `Promise<boolean>`；key 优先于 index 和 top，index 按当前页可见扁平行计数；align 为 `top / bottom / auto`。找不到目标、未挂载或参数无效时返回 false |
| `retryTreeLoad(key)`                                       | `Promise<boolean>`，重试节点加载，不改变展开 keys                                                                                                   |
| `getTreeLoadError(key)`                                    | 当前行的 `Error \| undefined`                                                                                                                       |

定位只处理当前页已经加载且可见的记录；跨页、折叠树节点和被筛选移除的记录返回 false，业务先切页、加载或展开，再定位。不定行高虚拟列表使用已有测量与纠偏，Promise 表示定位已提交，不承诺未来图片加载后的最终像素位置。

## Column 行为

### 基础字段

| 字段         | 类型                                               | 默认值  | 说明                                                                       |
| ------------ | -------------------------------------------------- | ------- | -------------------------------------------------------------------------- |
| `key`        | [`Key`](/guide/type-reference#key)                 | -       | 列唯一标识，建议显式传入。                                                 |
| `title`      | `ColumnTitle<TRecord>`                             | -       | 列标题，可以是文本、VNode 或渲染函数。                                     |
| `dataIndex`  | [`DataIndex`](/guide/type-reference#dataindex)     | -       | 数据字段路径，如 `'name'` 或 `['address', 'city']`。                       |
| `width`      | `number \| string`                                 | -       | 列宽，数字按 px 处理。                                                     |
| `align`      | [`AlignType`](/guide/type-reference#aligntype)     | -       | 列内容对齐方式。                                                           |
| `ellipsis`   | `boolean \| { showTitle?: boolean }`               | `false` | 单元格内容超出时省略；`showTitle: false` 时不显示 hover tooltip。          |
| `className`  | `string`                                           | -       | 列单元格额外 class。                                                       |
| `colSpan`    | `number`                                           | -       | 表头单元格跨列数。                                                         |
| `visible`    | `boolean`                                          | `true`  | 控制列是否显示，见[列显示与列顺序](/guide/column-display#列显示-visible)。 |
| `responsive` | [`Breakpoint[]`](/guide/type-reference#breakpoint) | -       | 当前屏幕命中任一断点时显示该列。                                           |

### 自定义渲染

| 字段               | 类型                                                                          | 默认值 | 说明                                                                      |
| ------------------ | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `customRender`     | `(ctx: CustomRenderContext<TRecord>) => VNodeChild \| RenderedCell`           | -      | 自定义 body cell 内容。返回 `RenderedCell` 时可同时设置内容和单元格属性。 |
| `customCell`       | `GetComponentProps<TRecord, TRecord>`                                         | -      | 为 body cell 注入属性、事件和样式。                                       |
| `customHeaderCell` | `GetComponentProps<ColumnType<TRecord> \| ColumnGroupType<TRecord>, TRecord>` | -      | 为 header cell 注入属性、事件和样式。                                     |

<<< @/.vitepress/type-declarations/examples.typecheck.ts#CustomRenderExample

### 固定列与列宽拖拽

| 字段        | 类型                        | 默认值  | 说明                                                                                          |
| ----------- | --------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `fixed`     | `'left' \| 'right' \| true` | -       | 固定列位置；`true` 等同 `'left'`。                                                            |
| `resizable` | `boolean`                   | `false` | 是否可拖拽调整列宽。                                                                          |
| `minWidth`  | `number`                    | -       | 叶子列在 auto/fixed 布局和拖拽中的下限（有限且非负的 CSS px）；未设置时仅拖拽使用 50px 下限。 |
| `maxWidth`  | `number`                    | -       | 仅限制拖拽目标；小于 `minWidth` 时下限优先。                                                  |

`width` 是目标宽度，不能覆盖有效 `minWidth`；下限之和超过容器时产生横向滚动，与列是否 `resizable` 无关。详见[最小列宽与布局](/guide/column-resize#最小列宽与布局)。

### 排序

| 字段                | 类型                                                          | 默认值                  | 说明                                                   |
| ------------------- | ------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| `sorter`            | [`ColumnSorter<TRecord>`](/guide/type-reference#columnsorter) | -                       | 开启排序；支持默认比较、自定义比较函数和多列排序对象。 |
| `sortOrder`         | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | 受控排序方向。                                         |
| `defaultSortOrder`  | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | 非受控默认排序方向，仅首次渲染生效。                   |
| `sortDirections`    | `SortOrder[]`                                                 | `['ascend', 'descend']` | 当前列可用排序方向。                                   |
| `showSorterTooltip` | `boolean \| TableTooltipConfig`                               | 继承表级配置            | 列级排序提示开关与配置。                               |

表级 `sortDirections` 和 `showSorterTooltip` 可作为默认值；列级配置优先。

### 筛选

| 字段                                | 类型                                                                            | 默认值   | 说明                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `filters`                           | `ColumnFilterItem[] \| boolean`                                                 | -        | true 从 valueEnum 生成项，false 关闭，或传自定义数组。 |
| `onFilter`                          | `boolean \| ((value: string \| number \| boolean, record: TRecord) => boolean)` | -        | 自定义比较，true 等值比较，false 跳过本地过滤。        |
| `filterMultiple`                    | `boolean`                                                                       | `true`   | 是否支持多选筛选。                                     |
| `filteredValue`                     | `Array<string \| number \| boolean> \| null`                                    | -        | 受控筛选值。                                           |
| `defaultFilteredValue`              | `Array<string \| number \| boolean>`                                            | -        | 非受控默认筛选值。                                     |
| `customFilterDropdown`              | `boolean`                                                                       | `false`  | 使用表级 `customFilterDropdown` slot。                 |
| `filterSearch`                      | `boolean \| ((input: string, filter: ColumnFilterItem) => boolean)`             | `false`  | 筛选项搜索。                                           |
| `filterMode`                        | `'menu' \| 'tree'`                                                              | `'menu'` | 筛选项展示模式。                                       |
| `filterResetToDefaultFilteredValue` | `boolean`                                                                       | `false`  | 重置时恢复到默认筛选值。                               |
| `filterDropdownOpen`                | `boolean`                                                                       | -        | 受控筛选下拉可见性。                                   |
| `onFilterDropdownOpenChange`        | `(visible: boolean) => void`                                                    | -        | 筛选下拉可见性变化回调。                               |
| `filtered`                          | `boolean`                                                                       | -        | 外部控制筛选图标高亮状态，不改变筛选逻辑。             |
| `filterIcon`                        | `(opt: { filtered: boolean }) => VNodeChild`                                    | -        | 自定义筛选图标。                                       |
| `filterDropdown`                    | `VNodeChild \| ((props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild)` | -        | 列级别自定义筛选面板，优先级高于表级 slot。            |

### 多级表头

| 字段       | 类型                                                     | 默认值 | 说明                                       |
| ---------- | -------------------------------------------------------- | ------ | ------------------------------------------ |
| `children` | `Array<ColumnType<TRecord> \| ColumnGroupType<TRecord>>` | -      | 子列配置。存在 `children` 时该列作为列组。 |

列组不会接收排序、筛选、`dataIndex` 和 `customRender` 等叶子列行为。

## Row Selection

`rowSelection` 开启选择列，支持多选、单选、树形联动、批量选择菜单和受控选中状态。

| 字段                      | 类型                                                                                                     | 默认值       | 说明                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------ |
| `type`                    | `'checkbox' \| 'radio'`                                                                                  | `'checkbox'` | 选择类型。                     |
| `selectedRowKeys`         | `Key[]`                                                                                                  | -            | 受控选中 key。                 |
| `defaultSelectedRowKeys`  | `Key[]`                                                                                                  | -            | 默认选中 key。                 |
| `onChange`                | `(selectedRowKeys: Key[], selectedRows: TRecord[]) => void`                                              | -            | 选中项变化回调。               |
| `onSelect`                | `(record: TRecord, selected: boolean, selectedRows: TRecord[]) => void`                                  | -            | 单行选择变化回调。             |
| `onSelectMultiple`        | `(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void`                            | -            | Shift 多选变化回调。           |
| `onSelectAll`             | `(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void`                            | -            | 全选变化回调。                 |
| `onSelectInvert`          | `(selectedRowKeys: Key[]) => void`                                                                       | -            | 反选回调。                     |
| `onSelectNone`            | `() => void`                                                                                             | -            | 清空选择回调。                 |
| `getCheckboxProps`        | `(record: TRecord) => { disabled?: boolean; name?: string }`                                             | -            | 为选择控件注入属性。           |
| `columnWidth`             | `number \| string`                                                                                       | -            | 选择列宽度。                   |
| `fixed`                   | `boolean \| 'left' \| 'right'`                                                                           | -            | 选择列固定位置。               |
| `columnTitle`             | `string \| VNodeChild`                                                                                   | -            | 选择列表头内容。               |
| `renderCell`              | `(value: boolean, record: TRecord, index: number, originNode: VNodeChild) => VNodeChild \| RenderedCell` | -            | 自定义选择单元格。             |
| `checkStrictly`           | `boolean`                                                                                                | `true`       | 树形数据是否父子独立选择。     |
| `selections`              | `boolean \| (SelectionItem \| SelectionSentinel)[]`                                                      | `false`      | 默认或自定义批量选择菜单。     |
| `hideSelectAll`           | `boolean`                                                                                                | `false`      | 隐藏全选 checkbox 和选择下拉。 |
| `preserveSelectedRowKeys` | `boolean`                                                                                                | `false`      | 数据源变化时保留已选 key。     |

默认批量选择常量见 [SelectionSentinel](/guide/type-reference#selectionsentinel)。

启用分页后，表头全选和反选限定当前页。“全选所有”菜单（`selections: true` 或 `[SELECTION_ALL]`）选择筛选后全部已加载的可选记录。远程分页使用 `preserveSelectedRowKeys: true` 保留跨页 key 和已选记录，不会自动请求未加载页。见[分页与跨页选择](/guide/selection#分页与跨页选择)。

## Expandable

`expandable` 用于展开行内容。树形数据的展开 props 在 `VTable` 顶层配置。

| 字段                     | 类型                                                                                                                                | 默认值  | 说明                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------- |
| `expandedRowRender`      | `(record: TRecord, index: number, indent: number, expanded: boolean) => VNodeChild`                                                 | -       | 展开行内容渲染函数。                   |
| `expandedRowKeys`        | `Key[]`                                                                                                                             | -       | 受控展开行 key。                       |
| `defaultExpandedRowKeys` | `Key[]`                                                                                                                             | -       | 默认展开行 key。                       |
| `expandRowByClick`       | `boolean`                                                                                                                           | `false` | 点击整行展开。                         |
| `expandIcon`             | `(props: { expanded: boolean; record: TRecord; expandable: boolean; onExpand: (record: TRecord, e: Event) => void }) => VNodeChild` | -       | 自定义展开图标。                       |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                                                                                      | -       | 展开/折叠回调。                        |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                                                                                                     | -       | 展开 key 变化回调。                    |
| `columnWidth`            | `number \| string`                                                                                                                  | -       | 展开列宽度。                           |
| `fixed`                  | `'left' \| 'right' \| true`                                                                                                         | -       | 展开列固定位置；`true` 等同 `'left'`。 |
| `defaultExpandAllRows`   | `boolean`                                                                                                                           | `false` | 默认展开所有行。                       |
| `rowExpandable`          | `(record: TRecord) => boolean`                                                                                                      | -       | 判断某行是否可展开。                   |
| `showExpandColumn`       | `boolean`                                                                                                                           | `true`  | 是否显示展开列。                       |
| `expandedRowClassName`   | `string \| RowClassName<TRecord>`                                                                                                   | -       | 展开行 class。                         |

## Events

`TRecord` 表示业务行类型。`VTableEventProps<TRecord>` 可为模板事件处理函数和事件 props 提供类型。只需要分页时，可使用 `pagination.onChange(page, pageSize)`；表格事件中的分页状态从 `extra.pagination` 读取。

| 事件           | 参数                                                                                                         | 说明                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `change`       | `(filters: TableFiltersInfo, sorter: VTableSorterResult<TRecord>, extra: TableChangeExtra<TRecord>) => void` | 排序、筛选、选择、分页后的统一事件出口。                                 |
| `resizeColumn` | `(column: ColumnType<TRecord>, width: number) => void`                                                       | 拖拽列宽结束后触发。                                                     |
| `rowDragEnd`   | `(newData: TRecord[], info: RowDragSortInfo) => void`                                                        | 行拖拽排序结束且顺序有变化时触发，见[行拖拽排序](/guide/row-drag-sort)。 |

`change` 保留三参数签名。启用分页后增加 `extra.pagination`；`extra.action` 支持 `'sort'`、`'filter'`、`'select'`、`'paginate'`。

排序、筛选、分页事件的 `extra.currentDataSource` 为分页前处理后的数据；选择事件为当前页展示数据。远程场景仅包含已加载记录。

<<< @/.vitepress/type-declarations/examples.typecheck.ts#PaginationChangeExample

## Slots

| Slot                   | 参数类型                                                                                        | 说明                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `bodyCell`             | [`TableBodyCellSlotProps<TRecord>`](/guide/type-reference#tablebodycellslotprops)               | 自定义单元格内容。                                                |
| `headerCell`           | [`TableHeaderCellSlotProps<TRecord>`](/guide/type-reference#tableheadercellslotprops)           | 自定义表头单元格内容。                                            |
| `empty`                | `()`                                                                                            | 自定义空状态。                                                    |
| `loading`              | `()`                                                                                            | 自定义加载态。                                                    |
| `customFilterDropdown` | [`CustomFilterDropdownSlotProps<TRecord>`](/guide/type-reference#customfilterdropdownslotprops) | 表级自定义筛选面板。                                              |
| `customFilterIcon`     | `{ column: ColumnType<TRecord>; filtered: boolean }`                                            | 表级自定义筛选图标。                                              |
| `title`                | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | 自定义标题区域。                                                  |
| `footer`               | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | 自定义页脚区域。                                                  |
| `summary`              | `()`                                                                                            | 自定义摘要区域。                                                  |
| `paginationItem`       | [`TablePaginationSlotProps`](/guide/pagination#分页内容插槽)                                    | 在 `pagination.layout` 的 `{ slot: '名称' }` 处渲染分页业务内容。 |

> 这里列的是 Vue slots。若要通过 class 覆盖结构样式，请查看 [ui Slot 参考](/guide/ui-slots-reference)。

## VTableSummary

`VTableSummary` 用于摘要行。

| 组件                 | 常用字段                                                                             | 说明                                                 |
| -------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `VTableSummary`      | `fixed?: SummaryFixed`                                                               | 摘要容器；`fixed` 支持 `true`、`'top'`、`'bottom'`。 |
| `VTableSummary.Row`  | -                                                                                    | 摘要行。                                             |
| `VTableSummary.Cell` | `index: number`（必填）、`colSpan?: number`、`rowSpan?: number`、`align?: AlignType` | 摘要单元格。                                         |

## 相关页面

- [类型参考](/guide/type-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
- [排序](/guide/sorting)
- [筛选](/guide/filtering)

## Pagination

`pagination?: false | TablePaginationConfig`，默认关闭，传 `{}` 启用。[完整配置与示例](/guide/pagination)。`scroll.scrollToFirstRowOnChange?: boolean` 控制排序、筛选、分页后的纵向复位，启用分页时默认 true，其他场景默认保持原行为。

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
