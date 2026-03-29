# API Reference

这一页不是把类型声明原样搬过来，而是把业务接入最常查的 Table API 压缩成一份查询入口。更细的泛型和内部类型，仍然以源码导出的 TypeScript 定义为准。

## 组件与导出

- `@vtable-guild/table`：直接导出 `VTable`、`VTableSummary` 和表格相关类型，适合按包拆分接入。
- `@vtable-guild/vtable-guild`：聚合导出 `core`、`theme`、`table` 能力，适合业务项目统一入口。
- `@vtable-guild/core`：提供 `createVTableGuild`、`VTableGuildConfigProvider`、通用工具类型与基础组件。

## 核心 Props

### 数据与列

| Prop                 | 类型                        | 说明                                                   |
| -------------------- | --------------------------- | ------------------------------------------------------ |
| `dataSource`         | `TRecord[]`                 | 表格数据源。                                           |
| `columns`            | `ColumnsType<TRecord>`      | 列配置，支持多级表头、排序、筛选、固定列和自定义渲染。 |
| `rowKey`             | `string \| (record) => Key` | 行唯一标识。业务场景建议始终显式传入。                 |
| `childrenColumnName` | `string`                    | 树形数据子节点字段名，默认 `children`。                |
| `indentSize`         | `number`                    | 树形缩进宽度，默认 `15`。                              |

### 视觉与布局

| Prop          | 类型                                             | 说明                                    |
| ------------- | ------------------------------------------------ | --------------------------------------- |
| `size`        | `'sm' \| 'md' \| 'lg'`                           | 表格尺寸。                              |
| `bordered`    | `boolean`                                        | 是否展示边框。                          |
| `striped`     | `boolean`                                        | 是否启用斑马纹。                        |
| `hoverable`   | `boolean`                                        | 是否启用 hover 高亮。                   |
| `tableLayout` | `TableLayout`                                    | 表格布局模式。                          |
| `showHeader`  | `boolean`                                        | 是否显示表头。                          |
| `scroll`      | `{ x?: number \| string; y?: number \| string }` | 横纵滚动配置；`y` 会启用固定表头。      |
| `sticky`      | `boolean \| TableSticky`                         | 粘性表头与滚动条配置。                  |
| `virtual`     | `boolean`                                        | 是否启用虚拟滚动，需要配合 `scroll.y`。 |

### 主题与语言

| Prop                | 类型                                  | 说明                       |
| ------------------- | ------------------------------------- | -------------------------- |
| `ui`                | `SlotProps`                           | 实例级 slot class 覆写。   |
| `class`             | `string`                              | 根节点 class 追加。        |
| `locale`            | `LocaleName`                          | 当前表实例使用的语言标识。 |
| `locales`           | `LocaleRegistry`                      | 当前实例额外注册的语言包。 |
| `localeOverrides`   | `DeepPartial<VTableGuildTableLocale>` | 表级 locale 局部覆写。     |
| `getPopupContainer` | `(triggerNode) => HTMLElement`        | 筛选和选择菜单挂载容器。   |

### 交互能力

| Prop                     | 类型                         | 说明                                                       |
| ------------------------ | ---------------------------- | ---------------------------------------------------------- |
| `rowSelection`           | `RowSelection<TRecord>`      | 行选择配置，支持 checkbox、radio、自定义选择菜单和固定列。 |
| `expandable`             | `Expandable<TRecord>`        | 展开行配置，支持点击行展开、自定义展开内容和固定位置。     |
| `expandedRowKeys`        | `Key[]`                      | 树形/展开行的受控展开 key。                                |
| `defaultExpandedRowKeys` | `Key[]`                      | 树形/展开行的默认展开 key。                                |
| `defaultExpandAllRows`   | `boolean`                    | 是否默认展开所有节点。                                     |
| `transformCellText`      | `TransformCellText<TRecord>` | 统一拦截单元格文本转换。                                   |

### 自定义结构

| Prop              | 类型                                       | 说明                          |
| ----------------- | ------------------------------------------ | ----------------------------- |
| `rowClassName`    | `string \| RowClassName<TRecord>`          | 行 class。                    |
| `customRow`       | `GetComponentProps<TRecord>`               | 自定义 body row DOM props。   |
| `customHeaderRow` | `(columns, index?) => CellAdditionalProps` | 自定义 header row DOM props。 |
| `title`           | `(data) => VNodeChild`                     | 标题区域渲染函数。            |
| `footer`          | `(data) => VNodeChild`                     | 页脚区域渲染函数。            |

## 常用事件

| 事件           | 参数                       | 说明                               |
| -------------- | -------------------------- | ---------------------------------- |
| `change`       | `(filters, sorter, extra)` | 排序、筛选、选择后的统一事件出口。 |
| `resizeColumn` | `(column, width)`          | 拖拽列宽后触发。                   |

`change` 的 `extra.action` 当前会返回 `sort`、`filter` 或 `select`，便于业务区分来源。

## 常用 Slots

| Slot                   | 参数                                                                                        | 说明                                  |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| `bodyCell`             | `{ text, record, index, column }`                                                           | 单元格自定义渲染。                    |
| `headerCell`           | `{ title, column, index }`                                                                  | 表头单元格自定义渲染。                |
| `empty`                | `-`                                                                                         | 空状态。                              |
| `loading`              | `-`                                                                                         | 加载态。                              |
| `customFilterDropdown` | `{ column, selectedKeys, setSelectedKeys, confirm, clearFilters, filters, visible, close }` | 自定义筛选面板。                      |
| `customFilterIcon`     | `{ column, filtered }`                                                                      | 自定义筛选图标。                      |
| `title`                | `{ data }`                                                                                  | 标题区域 slot。                       |
| `footer`               | `{ data }`                                                                                  | 页脚区域 slot。                       |
| `summary`              | `-`                                                                                         | 摘要行。通常与 `VTableSummary` 配合。 |

## `rowSelection` 常查字段

| 字段                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| `type`                                       | `checkbox` 或 `radio`。                |
| `selectedRowKeys` / `defaultSelectedRowKeys` | 受控 / 非受控选中项。                  |
| `fixed`                                      | 选择列固定到左侧或右侧。               |
| `columnTitle`                                | 选择列表头自定义标题。                 |
| `renderCell`                                 | 自定义选择单元格。                     |
| `checkStrictly`                              | 树形数据是否父子联动。                 |
| `selections`                                 | 是否显示默认选择菜单，或传入自定义项。 |
| `hideSelectAll`                              | 是否隐藏全选和选择菜单。               |

## `expandable` 常查字段

| 字段                | 说明                     |
| ------------------- | ------------------------ |
| `expandedRowRender` | 展开内容渲染函数。       |
| `expandRowByClick`  | 点击整行展开。           |
| `expandIcon`        | 自定义展开图标。         |
| `rowExpandable`     | 控制某一行是否允许展开。 |
| `columnWidth`       | 展开列宽度。             |
| `fixed`             | 展开列固定位置。         |
| `showExpandColumn`  | 是否展示展开列。         |

## `VTableSummary` 结构

- `VTableSummary`：摘要容器，支持 `fixed="top"` 或 `fixed="bottom"`。
- `VTableSummary.Row`：摘要行。
- `VTableSummary.Cell`：摘要单元格，常用字段包括 `index`、`colSpan`、`rowSpan`、`align`。

## 建议的查阅顺序

1. 先用这一页确认字段名和大致职责。
2. 具体交互看对应指南页，例如排序、筛选、行选择、固定列、虚拟滚动。
3. 需要精确类型时，回到 `packages/table/src/types/table.ts` 和 `packages/table/src/types/column.ts`。
