# API Reference

这一页提供的是接入时最常查的一层 API 速览，目的是帮你快速确认字段名、职责和能力边界。

如果你需要精确泛型或更细的类型约束，最终仍然应该以源码导出的 TypeScript 定义为准。

## 常用导出

- @vtable-guild/vtable-guild，聚合导出，适合大多数业务项目。
- @vtable-guild/table，直接导出 VTable、VTableSummary 和表格类型。
- @vtable-guild/core，导出 createVTableGuild、VTableGuildConfigProvider 和通用类型。

## VTable 核心 Props

### 数据与结构

| Prop               | 说明                                                   |
| ------------------ | ------------------------------------------------------ |
| dataSource         | 表格数据源。                                           |
| columns            | 列配置，支持排序、筛选、固定列、多级表头和自定义渲染。 |
| rowKey             | 行唯一标识。建议始终显式传入。                         |
| childrenColumnName | 树形数据的子节点字段名，默认是 children。              |
| indentSize         | 树形缩进宽度，默认 15。                                |

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
