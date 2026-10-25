# 类型参考

这一页提供站点已介绍 API 的 TypeScript 声明和导入入口。组件行为、默认值和事件语义请看 [API Reference](/guide/api-reference)。核心声明与功能页共用同一份手工维护文件，并参与类型检查；组合式协议直接展示公开导出，详细参数见相应功能指南。

所有公开类型推荐从 `@vtable-guild/vtable-guild` 导入。声明中的 `CSSProperties`、`VNodeChild`、`VNode`、`Plugin`、`InjectionKey` 来自 Vue；主题配置使用公开主题常量的 `typeof` 保留源码的只读属性与字面量。标为“文档辅助”的接口仅用于说明组件 props，不是包导出。

```ts
import type {
  TableColumnsType,
  VTableEventProps,
  TablePaginationConfig,
} from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Age', key: 'age', dataIndex: 'age' },
]

const pagination: TablePaginationConfig = {
  onChange: (page, pageSize) => console.log(page, pageSize),
}

const handleChange: NonNullable<VTableEventProps<UserRow>['onChange']> = (
  _filters,
  _sorter,
  extra,
) => {
  if (extra.action === 'paginate' && extra.pagination) {
    console.log(extra.pagination.current, extra.pagination.pageSize)
  }
}
```

如果你正在对齐 ant-design-vue 的列类型命名，优先使用 `TableColumnType` 和 `TableColumnsType`。它们分别等价于 `ColumnType` 和 `ColumnsType`。各声明引用的其他类型可在本页按名称查找。

## 表格核心类型

### Key

行、列和内部状态使用的唯一标识。

<<< @/.vitepress/type-declarations/table.ts#Key

### DataIndex

列读取行数据时使用的字段路径。

<<< @/.vitepress/type-declarations/table.ts#DataIndex

### AlignType

列内容对齐方式。

<<< @/.vitepress/type-declarations/table.ts#AlignType

### Breakpoint

响应式列使用的断点类型。当前公开类型名是 `Breakpoint`，没有 `Breakpoints` 复数类型。

<<< @/.vitepress/type-declarations/table.ts#Breakpoint

### SortOrder

排序方向。`null` 表示无排序状态。

<<< @/.vitepress/type-declarations/table.ts#SortOrder

### ColumnSorter

列排序器类型，比较函数返回数字；对象形态支持多列排序优先级。

<<< @/.vitepress/type-declarations/table.ts#SorterFn

<<< @/.vitepress/type-declarations/table.ts#ColumnSorterObject

<<< @/.vitepress/type-declarations/table.ts#ColumnSorter

### ColumnFilterItem

列筛选项，支持树形结构。

<<< @/.vitepress/type-declarations/table.ts#ColumnFilterItem

### ColumnType

叶子列配置。完整声明包括渲染、排序、筛选、固定列、列宽拖拽与响应式可见性。

<<< @/.vitepress/type-declarations/table.ts#ColumnType

### ColumnGroupType

列组配置，`children` 继续放叶子列或列组。

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

### ColumnsType

`columns` prop 的推荐类型，同时支持列组与列占位常量。

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

### TableColumnType 和 TableColumnsType

与 ant-design-vue 命名兼容的别名，保留原类型的泛型默认值。

<<< @/.vitepress/type-declarations/table.ts#TableColumnType

<<< @/.vitepress/type-declarations/table.ts#TableColumnGroupType

<<< @/.vitepress/type-declarations/table.ts#TableColumnsType

### TableLayout

<<< @/.vitepress/type-declarations/table.ts#TableLayout

### TableSticky

`sticky` 对象的完整声明；`offsetScroll` 与 `getContainer` 已声明但尚未接线，行为边界见 [API Reference](/guide/api-reference)。

<<< @/.vitepress/type-declarations/table.ts#TableSticky

### RowClassName

<<< @/.vitepress/type-declarations/table.ts#RowClassName

### TransformCellText

<<< @/.vitepress/type-declarations/table.ts#TransformCellText

## 渲染与结构类型

### CellAdditionalProps

`customCell`、`customHeaderCell`、`customRow` 和 `customHeaderRow` 返回的额外 DOM 属性。索引签名允许 `data-*`、`aria-*` 等属性。

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

### RenderedCell

`customRender` 或选择列 `renderCell` 返回的对象形态。

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

### CustomRenderContext

`column.customRender` 的参数类型。

<<< @/.vitepress/type-declarations/table.ts#CustomRenderContext

### GetComponentProps

额外单元格或行属性的回调类型，注意 `index` 可选。

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

### ColumnTitleProps

函数式列标题参数。

<<< @/.vitepress/type-declarations/table.ts#ColumnTitleProps

### ColumnTitle

<<< @/.vitepress/type-declarations/table.ts#ColumnTitle

## 交互类型

### RowSelection

多选、单选、受控选择与选择列渲染配置。

<<< @/.vitepress/type-declarations/table.ts#RowSelection

### RowSelectionType

<<< @/.vitepress/type-declarations/table.ts#RowSelectionType

### SelectionItem

自定义批量选择菜单项。

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

### Expandable

展开行与树形展开配置。

<<< @/.vitepress/type-declarations/table.ts#Expandable

### TableFiltersInfo

`change` 事件的 filters 参数，清空筛选后对应值可以为 `null`。

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

### SorterResultLike

单列排序结果。多列排序时事件返回该类型的数组。

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

### VTableSorterResult

`change` 事件的 sorter 参数。

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

### TableChangeExtra

`change` 事件的 extra 参数；启用分页后从可选的 `pagination` 读取分页状态。

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

### RowDragSortInfo

`rowDragEnd` 事件的 info 参数，见 [行拖拽排序](/guide/row-drag-sort)。

<<< @/.vitepress/type-declarations/table.ts#RowDragSortInfo

## Slot 类型

### TableBodyCellSlotProps

`bodyCell` slot 参数。

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

### TableHeaderCellSlotProps

`headerCell` slot 参数。

<<< @/.vitepress/type-declarations/table.ts#TableHeaderCellSlotProps

### CustomFilterDropdownSlotProps

`customFilterDropdown` slot 参数，包括筛选状态与确认、重置、关闭函数。

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

### TableDataSlotProps

`title` 和 `footer` slot 参数。

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

### TableSlotsDecl

`VTable` 的完整 slot 声明，适合包装表格组件时使用。

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

## 常量类型

### SelectionSentinel

`rowSelection.selections` 使用的默认批量选择常量类型。

<<< @/.vitepress/type-declarations/table.ts#SelectionSentinel

### ColumnSentinel

`columns` 顶层可用的列占位常量类型。`ExpandColumnSentinel` 对应 `EXPAND_COLUMN`，`SelectionColumnSentinel` 对应 `SELECTION_COLUMN`。

<<< @/.vitepress/type-declarations/table.ts#ExpandColumnSentinel

<<< @/.vitepress/type-declarations/table.ts#SelectionColumnSentinel

<<< @/.vitepress/type-declarations/table.ts#ColumnSentinel

## 组件与事件类型

### TableProps

`VTable` props 的完整类型，封装二次组件时优先使用。

<<< @/.vitepress/type-declarations/table.ts#TableProps

### 服务端请求与手动计算

`TableManualConfig` 定义是否跳过本地排序、筛选与分页。`useTableRequest` 的请求函数、选项及返回值具有独立的泛型类型，
完整用法见[服务端请求管理](/guide/remote-data)。

<<< @/.vitepress/type-declarations/request.ts

### VTableEventProps

`change`、`resizeColumn` 与 `rowDragEnd` 的完整事件 props 类型。仅监听分页时也要接收三个参数，或改用 `TablePaginationConfig['onChange']`。

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

### VTablePublicProps

`TableProps<TRecord>` 与 `VTableEventProps<TRecord>` 的组合。

<<< @/.vitepress/type-declarations/table.ts#VTablePublicProps

### VTableComponent

泛型化后的 `VTable` 组件类型。

<<< @/.vitepress/type-declarations/table.ts#VTableComponent

### SummaryFixed

`VTableSummary` 的 fixed 类型。

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

### 摘要组件 props

以下接口为文档辅助类型，不是包导出。`VTableSummaryRow` 没有业务 props，三个摘要组件都提供无参数的默认内容 slot。

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

## 工具栏与列设置类型

`TableToolbarProps`、`TableToolbarOptions`、`TableToolbarSlotProps`、`TableToolbarSlots` 对应独立组件 `VTableToolbar`，不是 `VTable` 的 props 或插槽。完整行为和导出示例见 [工具栏与业务扩展](/guide/toolbar)。

<<< @/.vitepress/type-declarations/toolbar.ts

`VTableColumnSettings` 的受控列配置、密度和扩展标签类型：

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSize

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsProps

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSlots

## 查询、编辑与字段渲染协议

### useTableQuery

`UseTableQueryOptions<TValues, TParams>` 区分表单值和请求参数类型；`TableQueryFieldTransforms` 按表单键推断转换输入。返回值包括独立草稿、提交快照、展开状态和提交 / 重置方法。`collapsed` 接受共享 Ref，`onCollapse` 观察展开变化。详见 [查询协议](/guide/query)。

<<< @/.vitepress/type-declarations/features.ts#QueryProtocol

### useTableEdit

`UseTableEditOptions<TRecord>` 定义稳定行键、单行 / 多行模式、克隆、校验、保存与取消回调。`TableEditContext` 提供原始快照、新行标记和 AbortSignal；校验失败返回 `TableEditValidationErrors`，错误分类为 `TableEditError`。返回草稿访问、编辑 keys、保存状态与新增行等，详见 [编辑](/guide/editing)。

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol

### 字段渲染器

列通过 `valueType` 选择渲染器，`fieldProps` 支持静态配置或按单元格计算；表格 `renderers` 是作用域内注册表。`TableFieldRenderContext` 包含原值、枚举后的 `displayValue`、状态、配置与语言；返回 VNode 或带 `tooltipText / status` 的 `TableFieldRenderResult`。详见 [字段渲染器](/guide/cell-render)。

<<< @/.vitepress/type-declarations/features.ts#FieldRendererFields

<<< @/.vitepress/type-declarations/features.ts#RendererProtocol

### 懒加载树

`TableTreeLoadData<TRecord>` 接收节点与 `TableTreeLoadContext`，返回子记录数组的 Promise。`isLeaf` 标记终端节点；`onTreeLoadError` 接收失败与节点。重试通过表格实例调用，详见 [树形表格](/guide/tree-table)。

<<< @/.vitepress/type-declarations/features.ts#TreeFields

<<< @/.vitepress/type-declarations/features.ts#TreeLoadProtocol

### TableInstance / TableScrollToOptions

`TableInstance` 是 `ref` 获取的表格实例最小公开协议，包含 `scrollTo(options): Promise<boolean>`、`retryTreeLoad(key): Promise<boolean>` 与 `getTreeLoadError(key)`。滚动选项支持 `key / index / top / left / align / offset`；key 优先于 index，行定位范围是当前已加载且可见的页。详见 [API Reference](/guide/api-reference)。

<<< @/.vitepress/type-declarations/features.ts#TableInstanceProtocol

### 作用域与释放

`useTableQuery`、`useTableEdit` 和 `useTableRequest` 应在组件 `setup` 或 `effectScope` 内创建，随该作用域销毁停止监听并忽略旧异步结果。编辑和请求协议还会中止 signal、结束待完成操作；查询回调中的业务请求由其数据层负责取消。表格自身卸载会使懒加载 / 重试失效并返回 `false`，卸载后的实例滚动同样返回 `false`。`createTableRenderers` 创建的是无监听器的渲染器映射，无需额外释放。

## 主题与插件类型

### ThemePresetName

内置主题预设名。

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

### VTableGuildOptions

`createVTableGuild()` 的完整配置。

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

`cssMode` 与 `classPrefix` 的使用场景见 [安装与使用](/guide/installation)，`compatClass` 见 [从 ant-design-vue 迁移](/guide/migration-from-antd#保留旧的覆盖-css-兼容类名)。

### createVTableGuild

配置可省略，返回 Vue `Plugin`。

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

### VTableGuildCssMode

样式模式须与实际 CSS 入口一致。

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

### LocaleName

业务可以注册自己的语言标识。

<<< @/.vitepress/type-declarations/config.ts#LocaleName

<<< @/.vitepress/type-declarations/config.ts#BuiltInLocaleName

### LocaleRegistry

语言包注册表；注册完整语言包使用 `locales`，局部覆盖使用 `localeOverrides`。

<<< @/.vitepress/type-declarations/config.ts#LocaleRegistry

### VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableHeaderLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableFilterDropdownLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableEmptyLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLoadingLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableSelectionLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildPaginationLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#PaginationLocaleConstants

### DeepPartial

<<< @/.vitepress/type-declarations/config.ts#DeepPartial

### ThemeConfig

传给主题系统的原始结构。

<<< @/.vitepress/type-declarations/config.ts#ThemeConfig

### SlotProps

实例 `ui` 的类型，保留具体主题的 slot key。

<<< @/.vitepress/type-declarations/config.ts#SlotProps

### ThemeOverrideConfig

全局主题覆盖的完整映射类型，保留 slot 与 variant key，允许覆盖任意 class 字符串。声明块内 `Theme*` 辅助类型不是包导出。

<<< @/.vitepress/type-declarations/config.ts#ThemeOverrideConfig

### TableSlots 和 TableThemeConfig

`TableSlots` 是全部 Table 主题 slot 的联合类型，具体行为见 [ui Slot 参考](/guide/ui-slots-reference)。主题常量从 `@vtable-guild/vtable-guild` 导入，`typeof` 保留预设的字面量、只读属性和 variant 映射。

<<< @/.vitepress/type-declarations/config.ts#TableSlots

<<< @/.vitepress/type-declarations/config.ts#TableVariantProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

其他组件的公开主题类型：

<<< @/.vitepress/type-declarations/config.ts#ComponentThemeTypes

<<< @/.vitepress/type-declarations/config.ts#PaginationSlots

<<< @/.vitepress/type-declarations/config.ts#PaginationThemeConfig

<<< @/.vitepress/type-declarations/config.ts#ColumnSettingsThemeTypes

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

### VTableGuildThemeOverrides

`@vtable-guild/theme` 增强后的内置主题映射，业务可以通过 module augmentation 继续添加组件。

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverridesMap

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverrides

### VTableGuildContext

通过 provide / inject 传递的完整配置；一般业务直接使用插件或 Provider。

<<< @/.vitepress/type-declarations/config.ts#VTableGuildContext

<<< @/.vitepress/type-declarations/config.ts#VTABLE_GUILD_INJECTION_KEY

### VTableGuildConfigProvider props

以下为文档辅助接口，不是包导出。Provider 仅覆盖这些字段；`themePreset` 与 `compatClass` 从插件上下文继承，不能通过 Provider props 切换。

<<< @/.vitepress/type-declarations/config.ts#VTableGuildConfigProviderProps

### cn

合并 class 并处理 Tailwind 冲突，结果可能为 `undefined`。`CnClassValue` 为说明参数结构的辅助类型，不是包导出。

<<< @/.vitepress/type-declarations/config.ts#cn

## 相关页面

- [API Reference](/guide/api-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
- [三层主题覆盖](/guide/theme-overrides)

## TablePaginationConfig / TablePaginationState

分页配置、状态、位置、布局与 slot 的完整声明。`pagination.onChange` 是两参数分页回调，与三参数表格 `change` 区别见 [分页](/guide/pagination)。

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#TablePaginationPosition

<<< @/.vitepress/type-declarations/table.ts#PaginationItemType

<<< @/.vitepress/type-declarations/table.ts#TablePaginationBuiltinLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayout

<<< @/.vitepress/type-declarations/table.ts#TablePaginationSlotProps
