# ui Slot 参考

`VTable` 的 `ui` prop 是实例级别的样式覆盖入口。每个 key 对应一个 **theme slot**，值为 Tailwind CSS class 字符串，会与预设默认 class 通过 `cn()` 智能合并。

```vue
<VTable
  :columns="columns"
  :data-source="data"
  :ui="{
    th: 'bg-blue-50',
    td: 'align-top',
  }"
/>
```

> [!TIP]
> 安装并导入 `@vtable-guild/theme` 后，在 TypeScript 项目中 `ui` prop 的所有 slot key 都有自动补全。

---

## 这页不只给 `ui` 用

这页列出的 slot 和 variant，不只是 `ui` prop 的参考表，也对应全局 `theme` 的写法：

- `ui.th`
  对应 `theme.table.slots.th`
- `ui.td`
  对应 `theme.table.slots.td`
- `hoverable.true.td`
  对应 `theme.table.variants.hoverable.true.td`
- `size: 'sm'`
  对应 `theme.table.defaultVariants.size = 'sm'`

也就是说，这页可以当成“Table 主题系统可覆盖项总表”来看。

## 从 slot 表映射到全局 theme

```ts
createVTableGuild({
  theme: {
    table: {
      slots: {
        th: 'bg-slate-50 text-slate-900',
        td: 'align-top',
      },
      variants: {
        hoverable: {
          true: {
            td: 'group-hover/row:bg-blue-50',
          },
        },
      },
      defaultVariants: {
        size: 'sm',
      },
    },
  },
})
```

如果你要的是应用级统一规范，优先看 [三层主题覆盖](/guide/theme-overrides)。如果你只是改单张表，再回到 `ui`。

## 快速示例：修改行 hover 背景色

行 hover 效果由 `hoverable` variant 控制，最终作用于 `td` slot。你有三种方式自定义 hover 背景色：

### 方式一：覆盖 CSS 变量

最简单的方式是只改 token 值，不改 class 结构：

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

### 方式二：通过 `ui` prop

```vue
<VTable :columns="columns" :data-source="data" :ui="{ td: 'group-hover/row:bg-blue-50' }" />
```

### 方式三：通过全局 `theme`

```ts
app.use(
  createVTableGuild({
    theme: {
      table: {
        variants: {
          hoverable: {
            true: {
              td: 'group-hover/row:bg-blue-50',
            },
          },
        },
      },
    },
  }),
)
```

---

## 完整 Slot 列表

以下按功能分组列出所有可用的 theme slot key。它们既可用于 `ui`，也可用于全局 `theme.table.slots`。

### 核心结构

| Slot      | 说明                                                                              |
| --------- | --------------------------------------------------------------------------------- |
| `root`    | 表格最外层容器。控制字体、字号、行高。                                            |
| `wrapper` | `<table>` 元素的滚动包裹层。                                                      |
| `table`   | `<table>` 元素。控制背景色、文字色、边框间距。                                    |
| `thead`   | `<thead>` 元素。                                                                  |
| `tbody`   | `<tbody>` 元素。                                                                  |
| `tr`      | `<tr>` 元素。默认带 `group/row`，供子元素做 hover 匹配。                          |
| `th`      | 表头单元格 `<th>`。控制背景、文字色、边框和分割线。                               |
| `td`      | 数据单元格 `<td>`。控制背景、文字色、边框；hover、选中、斑马纹通过 variant 追加。 |

### 表头与单元格包装

| Slot               | 说明                            |
| ------------------ | ------------------------------- |
| `headerCellInner`  | 表头单元格内部的 flex 包裹层。  |
| `bodyCellEllipsis` | `ellipsis` 列内容的文本截断层。 |

### 分组表头

| Slot                 | 说明                         |
| -------------------- | ---------------------------- |
| `groupedHeaderTable` | 多级表头中的内层 `<table>`。 |
| `groupedHeaderTh`    | 分组表头 `<th>`。            |
| `groupedHeaderTd`    | 分组表头 `<td>`。            |

### 排序

| Slot              | 说明                             |
| ----------------- | -------------------------------- |
| `thSortable`      | 可排序列的 `<th>` 附加样式。     |
| `sortButton`      | 排序图标容器。                   |
| `sortIconDown`    | 降序图标的间距调整。             |
| `sortAreaOuter`   | 排序区最外层 flex 包裹。         |
| `sortAreaWrapper` | 标题和排序图标之间的 flex 包裹。 |
| `sortAreaTitle`   | 排序标题文本容器。               |

### 筛选图标

| Slot                | 说明               |
| ------------------- | ------------------ |
| `filterIconWrapper` | 筛选图标包裹容器。 |
| `filterIcon`        | 筛选触发图标本身。 |

### 筛选下拉面板

| Slot                           | 说明               |
| ------------------------------ | ------------------ |
| `filterDropdown`               | 筛选面板根容器。   |
| `filterDropdownList`           | 筛选选项列表容器。 |
| `filterDropdownItem`           | 单个筛选项。       |
| `filterDropdownItemSelected`   | 选中项样式。       |
| `filterDropdownItemHover`      | hover 项样式。     |
| `filterDropdownContentWrapper` | 选项内容包裹层。   |
| `filterDropdownActions`        | 底部操作栏。       |
| `filterDropdownSearch`         | 搜索区外层。       |
| `filterDropdownSearchField`    | 搜索输入框容器。   |
| `filterDropdownSearchIcon`     | 搜索图标。         |
| `filterDropdownSearchInput`    | 搜索输入框。       |
| `filterDropdownListEmpty`      | 空结果提示。       |

### 筛选树形结构

| Slot                               | 说明                  |
| ---------------------------------- | --------------------- |
| `filterDropdownSwitcher`           | 树节点展开/折叠按钮。 |
| `filterDropdownSwitcherExpanded`   | 展开状态。            |
| `filterDropdownSwitcherCollapsed`  | 折叠状态。            |
| `filterDropdownSwitcherNoop`       | 不可切换节点占位。    |
| `filterDropdownTreeWrapper`        | 树列表包裹层。        |
| `filterDropdownTreeList`           | 树列表 `<ul>`。       |
| `filterDropdownTreeItem`           | 单个树节点行。        |
| `filterDropdownTreeContentWrapper` | 树节点内容包裹层。    |
| `filterDropdownTreeItemSelected`   | 选中节点样式。        |
| `filterDropdownTreeCheckAll`       | “全选” 行。           |

### 空状态

| Slot           | 说明               |
| -------------- | ------------------ |
| `empty`        | 空状态根容器。     |
| `emptyWrapper` | 空状态内容包裹层。 |
| `emptyIcon`    | 空状态图标区域。   |
| `emptyText`    | 空状态文字。       |

### 加载态

| Slot             | 说明                          |
| ---------------- | ----------------------------- |
| `loading`        | 覆盖整张表的 loading 遮罩层。 |
| `loadingSpinner` | loading 图标。                |

### 行选中

| Slot              | 说明                            |
| ----------------- | ------------------------------- |
| `tdSelected`      | 选中行的 `<td>` 背景。          |
| `tdSelectedHover` | 选中行 hover 时的 `<td>` 背景。 |

### 行选择下拉

| Slot                    | 说明                         |
| ----------------------- | ---------------------------- |
| `selectionDropdown`     | 行选择下拉面板。             |
| `selectionDropdownItem` | 行选择下拉项。               |
| `selectionExtra`        | 行选择列头部的额外触发图标。 |

### 标题、页脚与摘要

| Slot          | 说明           |
| ------------- | -------------- |
| `title`       | 表格标题区域。 |
| `footer`      | 表格页脚区域。 |
| `summary`     | 摘要容器。     |
| `summaryRow`  | 摘要 `<tr>`。  |
| `summaryCell` | 摘要 `<td>`。  |

### 固定列与固定表头

| Slot                     | 说明                             |
| ------------------------ | -------------------------------- |
| `headerWrapper`          | 固定表头模式下的表头滚动包裹层。 |
| `bodyWrapper`            | 固定表头模式下的表体滚动包裹层。 |
| `fixedCell`              | 固定列单元格。                   |
| `fixedDividerLeft`       | 左固定列分隔线。                 |
| `fixedDividerRight`      | 右固定列分隔线。                 |
| `fixedShadowLeft`        | 左固定列阴影层。                 |
| `fixedShadowRight`       | 右固定列阴影层。                 |
| `fixedShadowLeftHidden`  | 左侧阴影隐藏状态。               |
| `fixedShadowRightHidden` | 右侧阴影隐藏状态。               |

### 展开行

| Slot                        | 说明                     |
| --------------------------- | ------------------------ |
| `expandIcon`                | 展开按钮基础样式。       |
| `expandIconExpanded`        | 展开状态。               |
| `expandIconCollapsed`       | 折叠状态。               |
| `expandIconSpaced`          | 不可展开行的占位符。     |
| `expandIconDisabled`        | 禁用状态。               |
| `expandIconSymbol`          | 展开图标的 symbol 容器。 |
| `expandIconSymbolExpanded`  | 展开 symbol 状态。       |
| `expandIconSymbolCollapsed` | 折叠 symbol 状态。       |
| `expandedRow`               | 展开行 `<tr>`。          |
| `expandedRowCell`           | 展开内容 `<td>`。        |

### 树形展开

| Slot                            | 说明                   |
| ------------------------------- | ---------------------- |
| `treeExpandIcon`                | 树形展开按钮基础样式。 |
| `treeExpandIconExpanded`        | 展开状态。             |
| `treeExpandIconCollapsed`       | 折叠状态。             |
| `treeExpandIconSpaced`          | 叶子节点占位。         |
| `treeExpandIconDisabled`        | 禁用状态。             |
| `treeExpandIconSymbol`          | 树形 symbol 容器。     |
| `treeExpandIconSymbolExpanded`  | 树形展开 symbol 状态。 |
| `treeExpandIconSymbolCollapsed` | 树形折叠 symbol 状态。 |

### 列宽拖拽

| Slot           | 说明           |
| -------------- | -------------- |
| `resizeHandle` | 列宽拖拽手柄。 |

---

## Variant 列表

除了直接的 slot 覆盖，主题还通过 variant 控制条件样式。它们可以通过 props 控制，也可以通过全局 `theme.table.variants` 和 `theme.table.defaultVariants` 调整。

| Variant     | 值                 | 默认值  | 影响的 Slot                                                   |
| ----------- | ------------------ | ------- | ------------------------------------------------------------- |
| `size`      | `lg` / `md` / `sm` | `lg`    | `th`、`td`、`title`、`footer`、`summaryCell` 的 padding       |
| `bordered`  | `true` / `false`   | `false` | `root`、`th`、`td`、`tbody`、`title`、`footer`、`summaryCell` |
| `striped`   | `true` / `false`   | `false` | `td`，偶数行背景                                              |
| `hoverable` | `true` / `false`   | `true`  | `td`，行 hover 背景                                           |
| `loading`   | `true` / `false`   | 无      | `table`，半透明和禁交互状态                                   |

## 进一步阅读

- [三层主题覆盖](/guide/theme-overrides)
- [Table CSS 变量参考](/guide/theme-tokens)
- [预设与语言](/guide/presets-and-locales)
- [API Reference](/guide/api-reference)
