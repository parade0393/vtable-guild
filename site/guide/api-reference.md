# API Reference

这一页是组件行为参考：查 props、events、slots、默认值和受控规则。

如果你要查 `ColumnsType`、`Breakpoint`、`RowSelection` 等 TypeScript 类型的完整关系，请看 [类型参考](/guide/type-reference)。这一页只引用类型名，不重复展开类型定义。

## 导入入口

推荐从 `@vtable-guild/vtable-guild` 统一导入组件、常量和类型。

```ts
import {
  VTable,
  VTableSummary,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
  type ColumnsType,
  type RowSelection,
  type Expandable,
} from '@vtable-guild/vtable-guild'
```

## VTable Props

### 数据与结构

| Prop                 | 类型                                                        | 默认值       | 说明                                   |
| -------------------- | ----------------------------------------------------------- | ------------ | -------------------------------------- |
| `dataSource`         | `TRecord[]`                                                 | `[]`         | 表格数据源。                           |
| `columns`            | [`ColumnsType<TRecord>`](/guide/type-reference#columnstype) | `[]`         | 列配置，支持叶子列、列组和列占位常量。 |
| `rowKey`             | `string \| (record) => Key`                                 | -            | 行唯一标识，建议显式传入。             |
| `childrenColumnName` | `string`                                                    | `'children'` | 树形数据的子节点字段名。               |
| `indentSize`         | `number`                                                    | `15`         | 树形数据缩进宽度，单位 px。            |

### 视觉与布局

| Prop             | 类型                             | 默认值    | 说明                                                  |
| ---------------- | -------------------------------- | --------- | ----------------------------------------------------- |
| `size`           | `'small' \| 'middle' \| 'large'` | `'large'` | 表格尺寸，与 ant-design-vue 命名对齐。                |
| `loading`        | `boolean \| object`              | `false`   | 加载态；对象形式支持 `spinning`、`indicator`、`tip`。 |
| `bordered`       | `boolean`                        | `false`   | 显示边框。                                            |
| `striped`        | `boolean`                        | `false`   | 开启斑马纹。                                          |
| `hoverable`      | `boolean`                        | `true`    | 开启行 hover 高亮。                                   |
| `tableLayout`    | `'auto' \| 'fixed'`              | -         | 表格布局模式。                                        |
| `showHeader`     | `boolean`                        | `true`    | 是否显示表头。                                        |
| `headerEllipsis` | `boolean`                        | `false`   | 让开启了 `column.ellipsis` 的列表头也单行省略。       |
| `class`          | `string`                         | -         | 根节点额外 class。                                    |

### 滚动与定位

| Prop                | 类型                                             | 默认值  | 说明                                                |
| ------------------- | ------------------------------------------------ | ------- | --------------------------------------------------- |
| `scroll`            | `{ x?: number \| string; y?: number \| string }` | -       | 横向和纵向滚动配置；提供 `y` 时形成固定表头滚动区。 |
| `sticky`            | `boolean \| TableSticky`                         | `false` | 粘性表头、摘要行或横向滚动条配置。                  |
| `virtual`           | `boolean`                                        | `false` | 启用虚拟滚动；需要同时设置 `scroll.y`。             |
| `getPopupContainer` | `(triggerNode) => HTMLElement`                   | -       | 筛选和选择菜单的挂载容器。                          |

### 主题与语言

| Prop              | 类型                                                     | 默认值               | 说明                                                                                         |
| ----------------- | -------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `ui`              | `SlotProps`                                              | -                    | 当前表实例的 theme slot class 覆盖。完整 slot 见 [ui Slot 参考](/guide/ui-slots-reference)。 |
| `locale`          | [`LocaleName`](/guide/type-reference#localename)         | 全局配置或 `'zh-CN'` | 当前表实例使用的语言标识。                                                                   |
| `locales`         | [`LocaleRegistry`](/guide/type-reference#localeregistry) | `{}`                 | 当前实例额外注册的语言包。                                                                   |
| `localeOverrides` | `DeepPartial<VTableGuildTableLocale>`                    | `{}`                 | 当前实例的 locale 局部覆写。                                                                 |

### 交互能力

| Prop                     | 类型                                                          | 默认值  | 说明                                                                   |
| ------------------------ | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `rowSelection`           | [`RowSelection<TRecord>`](/guide/type-reference#rowselection) | -       | 开启行选择列。                                                         |
| `expandable`             | [`Expandable<TRecord>`](/guide/type-reference#expandable)     | -       | 开启展开行能力。                                                       |
| `expandedRowKeys`        | `Key[]`                                                       | -       | 树形数据的受控展开 key 列表。                                          |
| `defaultExpandedRowKeys` | `Key[]`                                                       | -       | 树形数据的默认展开 key 列表。                                          |
| `defaultExpandAllRows`   | `boolean`                                                     | `false` | 树形数据默认展开所有节点。                                             |
| `onExpand`               | `(expanded, record) => void`                                  | -       | 树形数据展开/折叠回调。                                                |
| `onExpandedRowsChange`   | `(expandedKeys) => void`                                      | -       | 树形数据展开 key 变化回调。                                            |
| `transformCellText`      | `(opt) => unknown`                                            | -       | 统一转换单元格文本；`opt` 包含 `text`、`column`、`record` 和 `index`。 |

### 自定义结构

| Prop              | 类型                                       | 默认值 | 说明                                 |
| ----------------- | ------------------------------------------ | ------ | ------------------------------------ |
| `rowClassName`    | `string \| RowClassName<TRecord>`          | -      | 为 body row 添加 class。             |
| `customRow`       | `GetComponentProps<TRecord>`               | -      | 为 body row 注入属性、事件和样式。   |
| `customHeaderRow` | `(columns, index?) => CellAdditionalProps` | -      | 为 header row 注入属性、事件和样式。 |
| `title`           | `(data) => VNodeChild`                     | -      | 表格标题区域渲染函数。               |
| `footer`          | `(data) => VNodeChild`                     | -      | 表格页脚区域渲染函数。               |

## Column 行为

### 基础字段

| 字段         | 类型                                               | 默认值  | 说明                                                              |
| ------------ | -------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `key`        | [`Key`](/guide/type-reference#key)                 | -       | 列唯一标识，建议显式传入。                                        |
| `title`      | `VNodeChild \| function`                           | -       | 列标题，可以是文本、VNode 或渲染函数。                            |
| `dataIndex`  | [`DataIndex`](/guide/type-reference#dataindex)     | -       | 数据字段路径，如 `'name'` 或 `['address', 'city']`。              |
| `width`      | `number \| string`                                 | -       | 列宽，数字按 px 处理。                                            |
| `align`      | [`AlignType`](/guide/type-reference#aligntype)     | -       | 列内容对齐方式。                                                  |
| `ellipsis`   | `boolean \| { showTitle?: boolean }`               | `false` | 单元格内容超出时省略；`showTitle: false` 时不显示 hover tooltip。 |
| `className`  | `string`                                           | -       | 列单元格额外 class。                                              |
| `colSpan`    | `number`                                           | -       | 表头单元格跨列数。                                                |
| `responsive` | [`Breakpoint[]`](/guide/type-reference#breakpoint) | -       | 当前屏幕命中任一断点时显示该列。                                  |

### 自定义渲染

| 字段               | 类型                                              | 默认值 | 说明                                                                      |
| ------------------ | ------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `customRender`     | `(ctx) => VNodeChild \| RenderedCell`             | -      | 自定义 body cell 内容。返回 `RenderedCell` 时可同时设置内容和单元格属性。 |
| `customCell`       | `(record, index, column?) => CellAdditionalProps` | -      | 为 body cell 注入属性、事件和样式。                                       |
| `customHeaderCell` | `(column, index) => CellAdditionalProps`          | -      | 为 header cell 注入属性、事件和样式。                                     |

```ts
customRender: ({ text, index }) =>
  index === 0
    ? { children: String(text), props: { colSpan: 2, style: { fontWeight: 'bold' } } }
    : String(text)
```

### 固定列与列宽拖拽

| 字段        | 类型                        | 默认值  | 说明                               |
| ----------- | --------------------------- | ------- | ---------------------------------- |
| `fixed`     | `'left' \| 'right' \| true` | -       | 固定列位置；`true` 等同 `'left'`。 |
| `resizable` | `boolean`                   | `false` | 是否可拖拽调整列宽。               |
| `minWidth`  | `number`                    | `50`    | 拖拽调整时的最小列宽。             |
| `maxWidth`  | `number`                    | -       | 拖拽调整时的最大列宽。             |

### 排序

| 字段                | 类型                                                          | 默认值                  | 说明                                                   |
| ------------------- | ------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| `sorter`            | [`ColumnSorter<TRecord>`](/guide/type-reference#columnsorter) | -                       | 开启排序；支持默认比较、自定义比较函数和多列排序对象。 |
| `sortOrder`         | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | 受控排序方向。                                         |
| `defaultSortOrder`  | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | 非受控默认排序方向，仅首次渲染生效。                   |
| `sortDirections`    | `SortOrder[]`                                                 | `['ascend', 'descend']` | 当前列可用排序方向。                                   |
| `showSorterTooltip` | `boolean`                                                     | 继承表级配置            | 列级别控制是否显示排序 tooltip。                       |

表级 `sortDirections` 和 `showSorterTooltip` 可作为默认值；列级配置优先。

### 筛选

| 字段                                | 类型                                                           | 默认值   | 说明                                        |
| ----------------------------------- | -------------------------------------------------------------- | -------- | ------------------------------------------- |
| `filters`                           | [`ColumnFilterItem[]`](/guide/type-reference#columnfilteritem) | -        | 筛选菜单项；传入后表头显示筛选图标。        |
| `onFilter`                          | `(value, record) => boolean`                                   | -        | 筛选函数，返回 `true` 表示该行匹配。        |
| `filterMultiple`                    | `boolean`                                                      | `true`   | 是否支持多选筛选。                          |
| `filteredValue`                     | `Array<string \| number \| boolean> \| null`                   | -        | 受控筛选值。                                |
| `defaultFilteredValue`              | `Array<string \| number \| boolean>`                           | -        | 非受控默认筛选值。                          |
| `customFilterDropdown`              | `boolean`                                                      | `false`  | 使用表级 `customFilterDropdown` slot。      |
| `filterSearch`                      | `boolean \| (input, filter) => boolean`                        | `false`  | 筛选项搜索。                                |
| `filterMode`                        | `'menu' \| 'tree'`                                             | `'menu'` | 筛选项展示模式。                            |
| `filterResetToDefaultFilteredValue` | `boolean`                                                      | `false`  | 重置时恢复到默认筛选值。                    |
| `filterDropdownOpen`                | `boolean`                                                      | -        | 受控筛选下拉可见性。                        |
| `onFilterDropdownOpenChange`        | `(visible) => void`                                            | -        | 筛选下拉可见性变化回调。                    |
| `filtered`                          | `boolean`                                                      | -        | 外部控制筛选图标高亮状态，不改变筛选逻辑。  |
| `filterIcon`                        | `({ filtered }) => VNodeChild`                                 | -        | 自定义筛选图标。                            |
| `filterDropdown`                    | `VNodeChild \| (props) => VNodeChild`                          | -        | 列级别自定义筛选面板，优先级高于表级 slot。 |

### 多级表头

| 字段       | 类型                                                     | 默认值 | 说明                                       |
| ---------- | -------------------------------------------------------- | ------ | ------------------------------------------ |
| `children` | `Array<ColumnType<TRecord> \| ColumnGroupType<TRecord>>` | -      | 子列配置。存在 `children` 时该列作为列组。 |

列组不会接收排序、筛选、`dataIndex` 和 `customRender` 等叶子列行为。

## Row Selection

`rowSelection` 开启选择列，支持多选、单选、树形联动、批量选择菜单和受控选中状态。

| 字段                      | 类型                                                               | 默认值       | 说明                           |
| ------------------------- | ------------------------------------------------------------------ | ------------ | ------------------------------ |
| `type`                    | `'checkbox' \| 'radio'`                                            | `'checkbox'` | 选择类型。                     |
| `selectedRowKeys`         | `Key[]`                                                            | -            | 受控选中 key。                 |
| `defaultSelectedRowKeys`  | `Key[]`                                                            | -            | 默认选中 key。                 |
| `onChange`                | `(keys, rows) => void`                                             | -            | 选中项变化回调。               |
| `onSelect`                | `(record, selected, rows) => void`                                 | -            | 单行选择变化回调。             |
| `onSelectMultiple`        | `(selected, rows, changeRows) => void`                             | -            | Shift 多选变化回调。           |
| `onSelectAll`             | `(selected, rows, changeRows) => void`                             | -            | 全选变化回调。                 |
| `onSelectInvert`          | `(keys) => void`                                                   | -            | 反选回调。                     |
| `onSelectNone`            | `() => void`                                                       | -            | 清空选择回调。                 |
| `getCheckboxProps`        | `(record) => { disabled?, name? }`                                 | -            | 为选择控件注入属性。           |
| `columnWidth`             | `number \| string`                                                 | -            | 选择列宽度。                   |
| `fixed`                   | `boolean \| 'left' \| 'right'`                                     | -            | 选择列固定位置。               |
| `columnTitle`             | `string \| VNodeChild`                                             | -            | 选择列表头内容。               |
| `renderCell`              | `(value, record, index, originNode) => VNodeChild \| RenderedCell` | -            | 自定义选择单元格。             |
| `checkStrictly`           | `boolean`                                                          | `true`       | 树形数据是否父子独立选择。     |
| `selections`              | `boolean \| array`                                                 | `false`      | 默认或自定义批量选择菜单。     |
| `hideSelectAll`           | `boolean`                                                          | `false`      | 隐藏全选 checkbox 和选择下拉。 |
| `preserveSelectedRowKeys` | `boolean`                                                          | `false`      | 数据源变化时保留已选 key。     |

默认批量选择常量见 [SelectionSentinel](/guide/type-reference#selectionsentinel)。

## Expandable

`expandable` 用于展开行内容。树形数据的展开 props 在 `VTable` 顶层配置。

| 字段                     | 类型                                              | 默认值  | 说明                                   |
| ------------------------ | ------------------------------------------------- | ------- | -------------------------------------- |
| `expandedRowRender`      | `(record, index, indent, expanded) => VNodeChild` | -       | 展开行内容渲染函数。                   |
| `expandedRowKeys`        | `Key[]`                                           | -       | 受控展开行 key。                       |
| `defaultExpandedRowKeys` | `Key[]`                                           | -       | 默认展开行 key。                       |
| `expandRowByClick`       | `boolean`                                         | `false` | 点击整行展开。                         |
| `expandIcon`             | `(props) => VNodeChild`                           | -       | 自定义展开图标。                       |
| `onExpand`               | `(expanded, record) => void`                      | -       | 展开/折叠回调。                        |
| `onExpandedRowsChange`   | `(expandedKeys) => void`                          | -       | 展开 key 变化回调。                    |
| `columnWidth`            | `number \| string`                                | -       | 展开列宽度。                           |
| `fixed`                  | `'left' \| 'right' \| true`                       | -       | 展开列固定位置；`true` 等同 `'left'`。 |
| `defaultExpandAllRows`   | `boolean`                                         | `false` | 默认展开所有行。                       |
| `rowExpandable`          | `(record) => boolean`                             | -       | 判断某行是否可展开。                   |
| `showExpandColumn`       | `boolean`                                         | `true`  | 是否显示展开列。                       |
| `expandedRowClassName`   | `string \| RowClassName<TRecord>`                 | -       | 展开行 class。                         |

## Events

| 事件           | 参数                       | 说明                               |
| -------------- | -------------------------- | ---------------------------------- |
| `change`       | `(filters, sorter, extra)` | 排序、筛选、选择后的统一事件出口。 |
| `resizeColumn` | `(column, width)`          | 拖拽列宽结束后触发。               |

`change` 当前不包含 pagination 参数。`extra.action` 取值为 `'sort'`、`'filter'` 或 `'select'`。

```ts
function handleChange(filters, sorter, extra) {
  if (extra.action === 'sort') {
    // sync sort state or request remote data
  }
}
```

## Slots

| Slot                   | 参数类型                                                                                        | 说明                   |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| `bodyCell`             | [`TableBodyCellSlotProps<TRecord>`](/guide/type-reference#tablebodycellslotprops)               | 自定义单元格内容。     |
| `headerCell`           | [`TableHeaderCellSlotProps<TRecord>`](/guide/type-reference#tableheadercellslotprops)           | 自定义表头单元格内容。 |
| `empty`                | `()`                                                                                            | 自定义空状态。         |
| `loading`              | `()`                                                                                            | 自定义加载态。         |
| `customFilterDropdown` | [`CustomFilterDropdownSlotProps<TRecord>`](/guide/type-reference#customfilterdropdownslotprops) | 表级自定义筛选面板。   |
| `customFilterIcon`     | `{ column, filtered }`                                                                          | 表级自定义筛选图标。   |
| `title`                | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | 自定义标题区域。       |
| `footer`               | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | 自定义页脚区域。       |
| `summary`              | `()`                                                                                            | 自定义摘要区域。       |

> 这里列的是 Vue slots。若要通过 class 覆盖结构样式，请查看 [ui Slot 参考](/guide/ui-slots-reference)。

## VTableSummary

`VTableSummary` 用于摘要行。

| 组件                 | 常用字段                               | 说明                                                 |
| -------------------- | -------------------------------------- | ---------------------------------------------------- |
| `VTableSummary`      | `fixed`                                | 摘要容器；`fixed` 支持 `true`、`'top'`、`'bottom'`。 |
| `VTableSummary.Row`  | -                                      | 摘要行。                                             |
| `VTableSummary.Cell` | `index`、`colSpan`、`rowSpan`、`align` | 摘要单元格。                                         |

## 相关页面

- [类型参考](/guide/type-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
- [排序](/guide/sorting)
- [筛选](/guide/filtering)
