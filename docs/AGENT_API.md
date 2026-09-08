# vtable-guild Agent API Reference

> **对应版本**：当前仓库实现。本文档是给 AI 编码助手（Claude Code / Codex / Cursor 等）的单文件速查，内容来自官方 API 文档与运行时告警，无营销描述。
>
> **最重要的规则**：vtable-guild 的 API 与 **ant-design-vue Table 对齐**（props 命名、column 结构、slots、事件模型基本一致）。你可以按 antdv 的习惯生成代码，然后对照本文核对差异——尤其是「不支持的功能」一节。

## 导入入口

所有组件、常量和类型统一从 `@vtable-guild/vtable-guild` 导入：

```ts
import {
  VTable,
  VTableSummary, // 摘要行容器，子组件 VTableSummary.Row / VTableSummary.Cell
  EXPAND_COLUMN, // 展开列占位常量，放进 columns
  SELECTION_COLUMN, // 选择列占位常量，放进 columns
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE, // 批量选择菜单哨兵
  type TableColumnsType,
  type TableProps,
  type RowSelection,
  type Expandable,
  type Key, // string | number
} from '@vtable-guild/vtable-guild'
```

## 初始化（一次性）

```ts
// src/main.ts
import { createApp } from 'vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style' // prebuilt 模式，宿主无需 Tailwind

const app = createApp(App)
app.use(createVTableGuild()) // 默认 themePreset: 'antdv'
// app.use(createVTableGuild({ themePreset: 'element-plus' })) 切换视觉预设
```

## 最小示例

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name', width: 180 },
  { title: 'Age', key: 'age', dataIndex: 'age', width: 96, align: 'right', sorter: true },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada Lovelace', age: 28, status: 'active' },
  { key: '2', name: 'Grace Hopper', age: 32, status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable />
</template>
```

## 不支持的功能 / 常见幻觉点（生成代码前必读）

| 幻觉                                                            | 事实                                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 生成 `<a-pagination>` 或 `pagination` prop                      | **没有分页功能**。组件刻意不做分页，也不要伪造 `pagination` prop——TS 会报错。数据分页请在外层自行切片。                                                                         |
| `change` 事件带 `pagination` 参数                               | `change(filters, sorter, extra)` 只有三个参数，`extra.action` 取值仅 `'sort' \| 'filter' \| 'select'`（没有 `'paginate'`）。                                                    |
| `scroll.y` 传 `'50%'` / `'30vh'`                                | `virtual` 模式支持正数、`'auto'` 或正数 px 字符串；相对单位会告警并回退到 400px。非虚拟模式可按 CSS `max-height` 传入其他字符串。                                               |
| 虚拟模式下用 `customCell` / `customRender` 返回 colSpan/rowSpan | **虚拟滚动不支持单元格合并**。开启 `virtual` 后列上存在 `customCell`/`customRender` 会被告警并禁用。                                                                            |
| 树形选择按 antdv 习惯写（不传 `checkStrictly`）                 | **本库与 ant-design-vue 4.x 都默认 `checkStrictly: true`（父子独立选择）**。两个库默认行为一致，无需显式传 `true`。如需父子联动（勾父带子），显式传 `checkStrictly: false`。    |
| 树形数据 + 筛选 = 递归过滤                                      | **`onFilter` 只过滤顶层记录**：不递归 `children`，匹配子节点也不会保留其父节点。树形数据慎用筛选，或在外层自行实现递归过滤。                                                    |
| `virtual` 模式下 `summary` 会静默丢失                           | 已支持 summary：非 fixed summary 渲染在虚拟表体后，fixed summary 保持 sticky 底部块。                                                                                           |
| 所有 antdv Table props 都存在                                   | 只实现了本文列出的 props。`expandIconColumnIndex`、`scroll.scrollToFirstRowOnChange`、`sticky.offsetScroll`/`getContainer` 等尚未实现，不要使用。                               |
| 树形数据的展开 props 写在 `expandable` 里                       | 树形数据的 `expandedRowKeys` / `defaultExpandAllRows` / `onExpand` / `onExpandedRowsChange` 在 **VTable 顶层 props**；`expandable` 对象只管展开行渲染（见下文 Expandable 表）。 |
| `column.ellipsis` 支持多行 `{ rows }`                           | 只支持 `boolean \| { showTitle?: boolean }`（单行省略）。                                                                                                                       |
| 树形 + 虚拟滚动不兼容                                           | **支持组合**：树形数据可以开 `virtual`（展开状态由组件维护）。                                                                                                                  |

## VTable Props

### 数据与结构

| Prop                 | 类型                        | 默认值       | 说明                                                                |
| -------------------- | --------------------------- | ------------ | ------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                 | `[]`         | 表格数据源。                                                        |
| `columns`            | `TableColumnsType<TRecord>` | `[]`         | 列配置，支持叶子列、列组、`SELECTION_COLUMN`/`EXPAND_COLUMN` 占位。 |
| `columnOrder`        | `Key[]`                     | -            | 列显示顺序（按 key）；未出现的列保持原相对顺序排后。                |
| `rowKey`             | `string \| (record) => Key` | -            | 行唯一标识。**建议总是显式传入**，否则回退行索引并告警。            |
| `childrenColumnName` | `string`                    | `'children'` | 树形数据的子节点字段名。                                            |
| `indentSize`         | `number`                    | `15`         | 树形数据缩进宽度（px）。                                            |

### 视觉与布局

| Prop                   | 类型                                         | 默认值    | 说明                                   |
| ---------------------- | -------------------------------------------- | --------- | -------------------------------------- |
| `size`                 | `'small' \| 'middle' \| 'large'`             | `'large'` | 与 antdv 命名一致。                    |
| `loading`              | `boolean \| { spinning?, indicator?, tip? }` | `false`   | 加载态。                               |
| `bordered` / `striped` | `boolean`                                    | `false`   | 边框 / 斑马纹。                        |
| `hoverable`            | `boolean`                                    | `true`    | 行 hover 高亮。                        |
| `tableLayout`          | `'auto' \| 'fixed'`                          | -         | 表格布局模式。                         |
| `showHeader`           | `boolean`                                    | `true`    | 是否显示表头。                         |
| `headerEllipsis`       | `boolean`                                    | `false`   | 让开启 `ellipsis` 的列表头也单行省略。 |
| `class`                | `string`                                     | -         | 根节点额外 class。                     |

### 滚动与虚拟

| Prop                | 类型                                             | 默认值  | 说明                                                                                                                            |
| ------------------- | ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `scroll`            | `{ x?: number \| string; y?: number \| string }` | -       | 提供 `y` 时形成固定表头滚动区；`virtual` 下 `y` 必须 px。                                                                       |
| `sticky`            | `boolean \| TableSticky`                         | `false` | 粘性表头 / 摘要行 / 横向滚动条。                                                                                                |
| `virtual`           | `boolean`                                        | `false` | 纵向虚拟滚动，需同时设置 `scroll.y`。支持不定行高（默认实测行高）。                                                             |
| `rowHeight`         | `number`                                         | -       | 固定行高（px），仅 `virtual` 下生效；声明后 O(1) 视口计算。**仅当每行实际高度确实恒定才传**（有换行文本就不要传）。             |
| `virtualColumn`     | `boolean`                                        | `false` | 横向虚拟化，需 `virtual`。列上有 `customCell`/`customRender`、固定列不连续、`showHeader:false` 且有非数字列宽时自动降级并告警。 |
| `getPopupContainer` | `(triggerNode) => HTMLElement`                   | -       | 筛选/选择菜单挂载容器。                                                                                                         |

### 主题与语言

| Prop                          | 类型                                                     | 默认值           | 说明                                 |
| ----------------------------- | -------------------------------------------------------- | ---------------- | ------------------------------------ |
| `ui`                          | `SlotProps`                                              | -                | 当前表实例的 theme slot class 覆盖。 |
| `locale`                      | `LocaleName`                                             | 全局或 `'zh-CN'` | 实例语言。                           |
| `locales` / `localeOverrides` | `LocaleRegistry` / `DeepPartial<VTableGuildTableLocale>` | `{}`             | 额外语言包 / 局部覆写。              |

### 交互能力

| Prop                                         | 类型                                       | 默认值  | 说明                                |
| -------------------------------------------- | ------------------------------------------ | ------- | ----------------------------------- |
| `rowSelection`                               | `RowSelection<TRecord>`                    | -       | 开启选择列，见下文。                |
| `expandable`                                 | `Expandable<TRecord>`                      | -       | 开启展开行，见下文。                |
| `rowDraggable`                               | `boolean`                                  | `false` | 行拖拽排序；结束触发 `rowDragEnd`。 |
| `expandedRowKeys` / `defaultExpandedRowKeys` | `Key[]`                                    | -       | 树形展开（受控/默认）。             |
| `defaultExpandAllRows`                       | `boolean`                                  | `false` | 树形默认全展开。                    |
| `onExpand`                                   | `(expanded, record) => void`               | -       | 树形展开回调。                      |
| `onExpandedRowsChange`                       | `(expandedKeys) => void`                   | -       | 树形展开 keys 变化。                |
| `transformCellText`                          | `(opt) => unknown`                         | -       | 统一转换单元格文本。                |
| `showSorterTooltip`                          | `boolean`                                  | `true`  | 表级排序 tooltip，列级可覆盖。      |
| `sortDirections`                             | `SortOrder[]`                              | -       | 表级排序方向（列级默认值）。        |
| `rowClassName`                               | `string \| RowClassName<TRecord>`          | -       | body row class。                    |
| `customRow`                                  | `GetComponentProps<TRecord>`               | -       | body row 属性/事件注入。            |
| `customHeaderRow`                            | `(columns, index?) => CellAdditionalProps` | -       | header row 属性/事件注入。          |
| `title` / `footer`                           | `(data: TRecord[]) => VNodeChild`          | -       | 标题 / 页脚。                       |

## Column 字段

| 字段                                                        | 类型                                                              | 默认值                  | 说明                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `key`                                                       | `Key`                                                             | -                       | 列唯一标识，建议显式传入。                                                                         |
| `title`                                                     | `VNodeChild \| () => VNodeChild`                                  | -                       | 列标题。                                                                                           |
| `dataIndex`                                                 | `string \| (string \| number)[]`                                  | -                       | 数据字段路径，支持 `['address', 'city']`。                                                         |
| `width`                                                     | `number \| string`                                                | -                       | 列宽，数字按 px。                                                                                  |
| `align`                                                     | `'left' \| 'right' \| 'center'`                                   | -                       | 对齐。                                                                                             |
| `ellipsis`                                                  | `boolean \| { showTitle?: boolean }`                              | `false`                 | 单行省略。                                                                                         |
| `className`                                                 | `string`                                                          | -                       | 单元格额外 class。                                                                                 |
| `colSpan`                                                   | `number`                                                          | -                       | 表头单元格跨列数。                                                                                 |
| `visible`                                                   | `boolean`                                                         | `true`                  | 列显示开关。                                                                                       |
| `responsive`                                                | `Breakpoint[]`                                                    | -                       | 命中断点时显示（'xxxl'~'xs'）。                                                                    |
| `customRender`                                              | `({ text, record, index, column }) => VNodeChild \| RenderedCell` | -                       | 自定义单元格；返回 `RenderedCell` 时可带 `{ children, props: { colSpan, rowSpan, ... } }` 做合并。 |
| `customCell`                                                | `(record, index, column?) => CellAdditionalProps`                 | -                       | body cell 属性/事件注入。                                                                          |
| `customHeaderCell`                                          | `(column, index) => CellAdditionalProps`                          | -                       | header cell 注入。                                                                                 |
| `fixed`                                                     | `'left' \| 'right' \| true`                                       | -                       | 固定列；`true` = `'left'`。                                                                        |
| `resizable` / `minWidth` / `maxWidth`                       | `boolean` / `number` / `number`                                   | `false` / `50` / -      | 列宽拖拽（拖完触发 `resizeColumn`）。                                                              |
| `sorter`                                                    | `boolean \| ((a, b) => number) \| { compare, multiple }`          | -                       | 排序；对象形式做多列排序。                                                                         |
| `sortOrder` / `defaultSortOrder`                            | `'ascend' \| 'descend' \| null`                                   | -                       | 受控 / 默认排序。                                                                                  |
| `sortDirections`                                            | `SortOrder[]`                                                     | `['ascend', 'descend']` | 可用排序方向。                                                                                     |
| `filters`                                                   | `{ text, value, children? }[]`                                    | -                       | 筛选项，传入后显示筛选图标。                                                                       |
| `onFilter`                                                  | `(value, record) => boolean`                                      | -                       | 筛选函数。                                                                                         |
| `filterMultiple` / `filteredValue` / `defaultFilteredValue` | `boolean` / `Array<string\|number\|boolean> \| null` / 同左       | `true` / - / -          | 筛选受控组。                                                                                       |
| `customFilterDropdown`                                      | `boolean`                                                         | `false`                 | 使用表级 `customFilterDropdown` slot。                                                             |
| `filterSearch` / `filterMode`                               | `boolean \| fn` / `'menu' \| 'tree'`                              | `false` / `'menu'`      | 筛选搜索 / 展示模式。                                                                              |
| `filterDropdown` / `filterIcon`                             | `VNodeChild \| fn` / `({ filtered }) => VNodeChild`               | -                       | 列级自定义面板 / 图标。                                                                            |
| `filterDropdownOpen` / `onFilterDropdownOpenChange`         | `boolean` / `(visible) => void`                                   | -                       | 受控下拉可见性。                                                                                   |
| `children`                                                  | `ColumnType[] \| ColumnGroupType[]`                               | -                       | 子列；存在时该列为列组（不接收 sorter/filter 等）。                                                |

## RowSelection

```ts
const rowSelection: RowSelection<UserRow> = {
  type: 'checkbox', // 或 'radio'
  selectedRowKeys: selectedKeys.value, // 受控
  onChange: (keys, rows) => {
    selectedKeys.value = keys
  },
  getCheckboxProps: (record) => ({ disabled: record.age < 18 }),
}
```

常用字段：`type`（默认 `'checkbox'`）、`selectedRowKeys`/`defaultSelectedRowKeys`、`onChange(keys, rows)`、`onSelect(record, selected, rows)`、`onSelectAll(selected, rows, changeRows)`、`onSelectInvert(keys)`、`onSelectNone()`、`getCheckboxProps`、`columnWidth`、`fixed: boolean \| 'left' \| 'right'`、`columnTitle`、`renderCell`、`checkStrictly`（**本库与 antdv 4.x 都默认 `true` 父子独立选择；如需联动显式传 `false`**）、`selections`（批量菜单，`true` 给默认项）、`hideSelectAll`、`preserveSelectedRowKeys`。

## Expandable

```ts
const expandable: Expandable<UserRow> = {
  expandedRowRender: (record, index, indent, expanded) => h('div', record.note),
  expandRowByClick: true,
}
```

常用字段：`expandedRowRender`、`expandedRowKeys`/`defaultExpandedRowKeys`、`expandRowByClick`、`expandIcon`、`onExpand`、`onExpandedRowsChange`、`columnWidth`、`fixed`、`defaultExpandAllRows`、`rowExpandable`、`showExpandColumn`（默认 `true`）、`expandedRowClassName`。

## Events（v-on / onXxx）

| 事件           | 参数                                                                 | 说明                                                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `change`       | `(filters, sorter, extra)`                                           | 排序/筛选/选择的统一出口；`extra.action: 'sort' \| 'filter' \| 'select'`，`extra.currentDataSource` 为当前显示数据。**无 pagination**。                                                                                                                                                                             |
| `resizeColumn` | `(column, width)`                                                    | 列宽拖拽结束。**组件不会自动记住新宽度**——必须把 `width` 回写到你自己的列配置响应式状态，否则下次渲染恢复原宽。注意 `column` 的类型是 `ColumnSentinel \| ColumnType<T> \| ColumnGroupType<T>` 联合（含 `SELECTION_COLUMN` 等哨兵），访问 `width` 前需收窄（如 `typeof column === 'object' && 'width' in column`）。 |
| `rowDragEnd`   | `(newData: TRecord[], info: { draggedKey, targetKey, orderedKeys })` | 行拖拽结束且顺序变化。                                                                                                                                                                                                                                                                                              |

## Slots

| Slot                   | 参数                                     | 说明                                                        |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `bodyCell`             | `{ text, value, record, index, column }` | 自定义单元格（最常用）。                                    |
| `headerCell`           | `{ title, column }`                      | 自定义表头单元格。                                          |
| `empty` / `loading`    | `()`                                     | 自定义空态 / 加载态。                                       |
| `customFilterDropdown` | `{ column, ... }`                        | 表级自定义筛选面板（需列上 `customFilterDropdown: true`）。 |
| `customFilterIcon`     | `{ column, filtered }`                   | 表级自定义筛选图标。                                        |
| `title` / `footer`     | `{ data }`（函数式 props 亦可）          | 标题 / 页脚。                                               |
| `summary`              | `()`                                     | 摘要行，配合 `VTableSummary`。                              |

## Summary 示例

```vue
<template>
  <VTable :data-source="rows" :columns="columns" row-key="key">
    <template #summary>
      <VTableSummary fixed>
        <VTableSummary.Row>
          <VTableSummary.Cell :index="0">Total</VTableSummary.Cell>
          <VTableSummary.Cell :index="1" align="right">{{ total }}</VTableSummary.Cell>
        </VTableSummary.Row>
      </VTableSummary>
    </template>
  </VTable>
</template>
```

`VTableSummary` 的 `fixed` 支持 `true` / `'top'` / `'bottom'`；`VTableSummary.Cell` 常用 `index` / `colSpan` / `rowSpan` / `align`。

**Cell `index` 的语义**：`index` 对应**最终展示列数组**的下标——包括开启 `rowSelection` / `expandable` 时自动插入的选择列 / 展开列（它们占最前面的下标）。例如同时开启选择列时，第 1 个数据列的 index 是 1。列宽对齐与 fixed 定位都按这个数组解析。

## 虚拟滚动示例（注意事项集中在这）

```vue
<template>
  <!-- scroll.y 传正数或 'auto'；不要用 '%'。不要在列上放 customCell/customRender。 -->
  <VTable
    :data-source="bigData"
    :columns="plainColumns"
    :scroll="{ y: 400 }"
    :virtual="true"
    row-key="key"
  />
</template>
```

- 固定列（`fixed: 'left' | 'right'`）与虚拟滚动可组合。
- `rowHeight` 仅在确认每行等高时传入（纯单行文本 + 无 ellipsis 换行）。
- 展开行在虚拟模式下可用；列窗口化（`virtualColumn`）下展开行 colspan 会跟随实际渲染列数。

## 运行时 dev 告警对照表

dev 构建下组件通过 `console.warn` 输出一次性告警，格式为 `[VTable] ...`。每条告警对应一个稳定 id（下表），Agent 可根据 id 直接定位修法。

| id                                | 触发原因                                                                  | 修法                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `vtable-rowkey-fallback-index`    | 未配置 `rowKey` 或记录上取不到该字段，回退到行索引                        | 给 `rowKey` 传记录的唯一字段名或函数；选择/展开/树形场景下不配会状态错乱 |
| `vtable-row-height-mismatch`      | 声明了 `rowHeight`，但实测首行高度与之不符                                | 去掉 `rowHeight`，交给默认实测路径                                       |
| `vtable-virtual-body-span`        | `virtual` 开启且列上存在 `customCell`/`customRender`（可能返回合并 span） | 虚拟模式移除单元格合并，或关闭 `virtual`                                 |
| `vtable-virtual-column-disabled`  | `virtualColumn` 开启但前置条件不满足（如固定列不连续、存在 customCell）   | 按告警说明调整列定义，或放弃横向虚拟化                                   |
| `vtable-virtual-column-no-header` | `virtualColumn` + `showHeader: false` 且有非数字列宽                      | 提供全数字列宽或保留表头                                                 |
| `vtable-scroll-y-compat-px`       | `virtual` 下 `scroll.y` 使用了兼容的正数 px 字符串                        | 改用正数数字或 `'auto'`                                                  |
| `vtable-scroll-y-invalid-string`  | `virtual` 下 `scroll.y` 为 `%`/`vh`/`calc` 等无法可靠解析的值             | 改用正数、`'auto'` 或正数 px 字符串                                      |
| `vtable-scroll-y-invalid-number`  | `virtual` 下 `scroll.y` 为负数或非有限数                                  | 改用有限正数或 `'auto'`                                                  |
| `vtable-auto-height-unavailable`  | `scroll.y: 'auto'` 但父容器无确定高度或 wrapper 不可见                    | 确保表格父容器有明确高度（px / vh / flex 等）                            |
| `vtable-table-context`            | Table 子组件在 VTable 外部使用，缺失 context                              | 只在 VTable 内部使用 TableCell 等子组件                                  |

## 相关完整文档

- 完整文档单文件：<https://parade0393.github.io/vtable-guild/llms-full.txt>
- 文档索引：<https://parade0393.github.io/vtable-guild/llms.txt>
- 仓库：<https://github.com/parade0393/vtable-guild>
