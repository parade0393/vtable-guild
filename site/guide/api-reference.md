# API Reference

这一页提供的是接入时最常查的一层 API 速览，目的是帮你快速确认字段名、职责和能力边界。

如果你需要精确泛型或更细的类型约束，最终仍然应该以源码导出的 TypeScript 定义为准。

## 常用导出

- `@vtable-guild/vtable-guild`
  对外唯一安装与导入入口。`VTable`、`VTableSummary`、`createVTableGuild`、`VTableGuildConfigProvider` 和常用类型都从这里导出。

## VTable 核心 Props

### 数据与结构

| Prop               | 说明                                                   |
| ------------------ | ------------------------------------------------------ |
| dataSource         | 表格数据源。                                           |
| columns            | 列配置，支持排序、筛选、固定列、多级表头和自定义渲染。 |
| rowKey             | 行唯一标识。建议始终显式传入。                         |
| childrenColumnName | 树形数据的子节点字段名，默认是 children。              |
| indentSize         | 树形缩进宽度，默认 15。                                |

## Column 配置

每个列对象支持以下字段：

### 基础字段

| 字段      | 类型                          | 说明                                             |
| --------- | ----------------------------- | ------------------------------------------------ |
| key       | string \| number              | 列唯一标识，建议显式传入。                       |
| title     | VNodeChild \| 函数            | 列标题，可以是字符串、VNode 或渲染函数。         |
| dataIndex | string \| string[]            | 数据字段路径，如 'name' 或 ['address', 'city']。 |
| width     | number \| string              | 列宽度，支持数字（px）或字符串（如 '20%'）。     |
| align     | 'left' \| 'center' \| 'right' | 列对齐方式。                                     |
| ellipsis  | boolean                       | 是否自动省略过长内容。                           |
| className | string                        | 列单元格额外 class。                             |
| colSpan   | number                        | 表头单元格跨列数。                               |

### 自定义渲染

| 字段             | 类型                                           | 说明                                                                                                                       |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| customRender     | (ctx) => VNodeChild \| RenderedCell            | 自定义单元格内容渲染。ctx 包含 text、value、record、index、renderIndex、column。返回 VNode 或 `{ children, props }` 对象。 |
| customCell       | (record, index, column) => CellAdditionalProps | 为单元格注入额外属性（class、style、事件、rowSpan、colSpan）。                                                             |
| customHeaderCell | (column, index) => CellAdditionalProps         | 为表头单元格注入额外属性。                                                                                                 |

**customRender 使用说明：**

在 `.vue` 文件的 `<script setup lang="ts">` 中，使用 `h` 函数：

```ts
customRender: ({ text, record }) => h('span', { style: { color: 'blue' } }, String(text))
```

在 `.vue` 文件的 `<script setup lang="tsx">` 中，可以直接使用 TSX 语法：

```tsx
customRender: ({ text }) => <span style={{ color: 'red' }}>{String(text)}</span>
```

或者将 columns 定义在单独的 `.tsx` 文件中：

```tsx
// columns.tsx
export const columns = [
  {
    title: 'Name',
    customRender: ({ text }) => <span style={{ color: 'red' }}>{String(text)}</span>,
  },
]
```

返回 `RenderedCell` 对象可以同时设置内容和单元格属性：

```ts
customRender: ({ text, index }) =>
  index === 0
    ? { children: String(text), props: { colSpan: 2, style: { fontWeight: 'bold' } } }
    : String(text)
```

### 固定列与调整

| 字段      | 类型              | 说明                            |
| --------- | ----------------- | ------------------------------- |
| fixed     | 'left' \| 'right' | 固定列位置。                    |
| resizable | boolean           | 是否可拖拽调整列宽。            |
| minWidth  | number            | 拖拽调整时的最小列宽，默认 50。 |
| maxWidth  | number            | 拖拽调整时的最大列宽。          |

### 排序

| 字段              | 类型                           | 说明                                                                        |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------- |
| sorter            | boolean \| 函数 \| 对象        | 排序器。true 使用默认排序，函数为自定义比较，对象支持 compare 和 multiple。 |
| sortOrder         | 'ascend' \| 'descend' \| null  | 受控排序方向。                                                              |
| defaultSortOrder  | 'ascend' \| 'descend' \| null  | 默认排序方向。                                                              |
| sortDirections    | Array\<'ascend' \| 'descend'\> | 支持的排序方向，默认 ['ascend', 'descend']。                                |
| showSorterTooltip | boolean \| 对象                | 是否显示排序提示。                                                          |

### 筛选

| 字段                 | 类型                                 | 说明                    |
| -------------------- | ------------------------------------ | ----------------------- |
| filters              | Array\<{ text, value }\>             | 筛选菜单项。            |
| onFilter             | (value, record) => boolean           | 筛选函数。              |
| filteredValue        | Array\<string \| number \| boolean\> | 受控筛选值。            |
| defaultFilteredValue | Array\<string \| number \| boolean\> | 默认筛选值。            |
| filterMultiple       | boolean                              | 是否多选，默认 true。   |
| filterMode           | 'menu' \| 'tree'                     | 筛选模式，默认 'menu'。 |
| filterSearch         | boolean \| 函数                      | 是否支持筛选项搜索。    |

### 多级表头

| 字段     | 类型                | 说明                     |
| -------- | ------------------- | ------------------------ |
| children | Array\<ColumnType\> | 子列配置，用于多级表头。 |

### 视觉与布局

| Prop        | 说明                                                |
| ----------- | --------------------------------------------------- |
| size        | 表格尺寸，可选 sm、md、lg。                         |
| bordered    | 是否显示边框。                                      |
| striped     | 是否开启斑马纹。                                    |
| hoverable   | 是否开启行 hover 高亮。                             |
| tableLayout | 表格布局模式。                                      |
| showHeader  | 是否显示表头。                                      |
| scroll      | 横向和纵向滚动配置；提供 y 时会形成固定表头滚动区。 |
| sticky      | 粘性表头或滚动条配置。                              |
| virtual     | 是否启用虚拟滚动，必须配合 scroll.y。               |

### 主题与语言

| Prop              | 说明                         |
| ----------------- | ---------------------------- |
| ui                | 实例级 slot 样式覆盖。       |
| class             | 根节点额外 class。           |
| locale            | 当前表实例使用的语言标识。   |
| locales           | 当前实例额外注册的语言包。   |
| localeOverrides   | 当前实例的 locale 局部覆写。 |
| getPopupContainer | 筛选和选择菜单的挂载容器。   |

### 交互能力

| Prop                   | 说明                         |
| ---------------------- | ---------------------------- |
| rowSelection           | 行选择配置。                 |
| expandable             | 展开行配置。                 |
| expandedRowKeys        | 树形或展开行的受控展开 key。 |
| defaultExpandedRowKeys | 树形或展开行的默认展开 key。 |
| defaultExpandAllRows   | 是否默认展开所有节点。       |
| transformCellText      | 统一拦截单元格文本转换。     |

### 自定义结构

| Prop            | 说明                               |
| --------------- | ---------------------------------- |
| rowClassName    | 为行添加 class。                   |
| customRow       | 为 body row 注入属性、事件和样式。 |
| customHeaderRow | 为 header row 注入属性。           |
| title           | 表格标题区域渲染函数。             |
| footer          | 表格页脚区域渲染函数。             |

## 常用事件

| 事件         | 参数                     | 说明                               |
| ------------ | ------------------------ | ---------------------------------- |
| change       | (filters, sorter, extra) | 排序、筛选、选择后的统一事件出口。 |
| resizeColumn | (column, width)          | 拖拽列宽结束后触发。               |

如果你来自 ant-design-vue，需要提前确认这几条兼容边界：

- change 事件当前不包含 pagination 参数，签名为 (filters, sorter, extra)。
- resizeColumn 事件参数顺序为 (column, width)。
- size 取值为 sm / md / lg，而不是 small / middle / large。

extra.action 当前会返回 sort、filter 或 select，便于业务区分触发来源。

## 常用 Slots

| Slot                 | 说明                   |
| -------------------- | ---------------------- |
| bodyCell             | 自定义单元格内容。     |
| headerCell           | 自定义表头单元格内容。 |
| empty                | 自定义空状态。         |
| loading              | 自定义加载态。         |
| customFilterDropdown | 自定义筛选面板。       |
| customFilterIcon     | 自定义筛选图标。       |
| title                | 自定义标题区域。       |
| footer               | 自定义页脚区域。       |
| summary              | 自定义摘要区域。       |

> 以上是 **Vue 插槽**。若要通过 class 覆盖样式，请查看 [ui Slot 参考](/guide/ui-slots-reference)，其中列出了所有 60+ 个 `ui` prop 可用的 theme slot。

## rowSelection 常查字段

| 字段                                     | 说明                       |
| ---------------------------------------- | -------------------------- |
| type                                     | checkbox 或 radio。        |
| selectedRowKeys / defaultSelectedRowKeys | 受控或默认选中项。         |
| fixed                                    | 选择列固定位置。           |
| columnTitle                              | 选择列表头标题。           |
| renderCell                               | 自定义选择单元格。         |
| checkStrictly                            | 树形数据是否父子联动。     |
| selections                               | 默认或自定义批量选择菜单。 |
| hideSelectAll                            | 是否隐藏全选入口。         |

## expandable 常查字段

| 字段              | 说明                     |
| ----------------- | ------------------------ |
| expandedRowRender | 展开内容渲染函数。       |
| expandRowByClick  | 点击整行展开。           |
| expandIcon        | 自定义展开图标。         |
| rowExpandable     | 控制某一行是否允许展开。 |
| columnWidth       | 展开列宽度。             |
| fixed             | 展开列固定位置。         |
| showExpandColumn  | 是否显示展开列。         |

## VTableSummary

- VTableSummary 是摘要容器，支持 fixed 为 true、top 或 bottom。
- VTableSummary.Row 表示摘要行。
- VTableSummary.Cell 表示摘要单元格，常用字段包括 index、colSpan、rowSpan 和 align。

## 建议怎么查这页

1. 先在这里确认字段名和能力边界。
2. 具体交互细节回到对应指南页，比如排序、筛选、行选择、虚拟滚动和主题覆盖。
3. 需要精确类型时，再查看 packages/table/src/types/table.ts 和 packages/table/src/types/column.ts。
