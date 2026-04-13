# ui Slot 参考

VTable 的 `ui` prop 是实例级别的样式覆盖入口。每个 key 对应一个 **theme slot**，值为 Tailwind CSS class 字符串，会与预设默认 class 通过 `cn()`（tailwind-merge）智能合并——同一类别的 class 以你传入的为准。

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

## 快速示例：修改行 hover 背景色

行 hover 效果由 `hoverable` variant 控制（默认开启），最终作用于 `td` slot。你有三种方式自定义 hover 背景色：

### 方式一：覆盖 CSS 变量（推荐）

最简单的方式——只改颜色值，不碰 class 结构：

```css
/* 在你的全局样式中 */
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

### 方式二：通过 ui prop（单实例）

```vue
<VTable :columns="columns" :data-source="data" :ui="{ td: 'group-hover/row:bg-blue-50' }" />
```

### 方式三：通过全局 theme（全应用）

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

以下按功能分组列出所有可用的 ui slot key。

### 核心结构

| Slot      | 说明                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `root`    | 表格最外层容器。控制字体、字号、行高。                                          |
| `wrapper` | `<table>` 元素的滚动包裹层。                                                    |
| `table`   | `<table>` 元素。控制背景色、文字色、边框间距。                                  |
| `thead`   | `<thead>` 元素。                                                                |
| `tbody`   | `<tbody>` 元素。                                                                |
| `tr`      | `<tr>` 元素。默认为 Tailwind `group/row`，供子元素做 hover 匹配。               |
| `th`      | 表头单元格 `<th>`。控制背景、文字色、边框和分割线。                             |
| `td`      | 数据单元格 `<td>`。控制背景、文字色、边框；hover/选中/斑马纹通过 variant 追加。 |

### 表头与单元格渲染

| Slot               | 说明                                                   |
| ------------------ | ------------------------------------------------------ |
| `headerCellInner`  | 表头单元格内部 flex 包裹层，放置标题文字和操作区。     |
| `bodyCellEllipsis` | 当列启用 `ellipsis` 时，包裹单元格内容以实现文本截断。 |

### 分组表头

| Slot                 | 说明                            |
| -------------------- | ------------------------------- |
| `groupedHeaderTable` | 多级表头中嵌套 `<table>` 元素。 |
| `groupedHeaderTh`    | 分组表头的 `<th>` 单元格。      |
| `groupedHeaderTd`    | 分组表头的 `<td>` 单元格。      |

### 排序

| Slot              | 说明                                               |
| ----------------- | -------------------------------------------------- |
| `thSortable`      | 可排序列的 `<th>` 附加样式（cursor、hover 背景）。 |
| `sortButton`      | 排序图标容器。                                     |
| `sortIconDown`    | 降序排序图标的间距调整。                           |
| `sortAreaOuter`   | 排序区域最外层 flex 包裹。                         |
| `sortAreaWrapper` | 排序标题和图标之间的 flex 包裹。                   |
| `sortAreaTitle`   | 排序区域中标题文字容器。                           |

### 筛选图标

| Slot                | 说明                 |
| ------------------- | -------------------- |
| `filterIconWrapper` | 筛选图标的包裹容器。 |
| `filterIcon`        | 筛选触发图标本身。   |

### 筛选下拉面板

| Slot                           | 说明                                       |
| ------------------------------ | ------------------------------------------ |
| `filterDropdown`               | 筛选下拉面板根容器。控制圆角、阴影、字体。 |
| `filterDropdownList`           | 筛选选项列表容器。                         |
| `filterDropdownItem`           | 单个筛选选项行。                           |
| `filterDropdownItemSelected`   | 被选中的筛选选项样式。                     |
| `filterDropdownItemHover`      | 筛选选项的 hover 样式。                    |
| `filterDropdownContentWrapper` | 筛选选项内容(checkbox + 文字)的包裹层。    |
| `filterDropdownActions`        | 筛选面板底部操作栏(重置 / 确认)。          |
| `filterDropdownSearch`         | 筛选搜索框外层区域。                       |
| `filterDropdownSearchField`    | 搜索输入框容器，含边框和 focus ring。      |
| `filterDropdownSearchIcon`     | 搜索框前置图标。                           |
| `filterDropdownSearchInput`    | 搜索文本输入框。                           |
| `filterDropdownListEmpty`      | 筛选列表为空时的提示文字。                 |

### 筛选树形结构

| Slot                               | 说明                                  |
| ---------------------------------- | ------------------------------------- |
| `filterDropdownSwitcher`           | 树形展开/折叠切换按钮。               |
| `filterDropdownSwitcherExpanded`   | 树形节点展开时旋转样式。              |
| `filterDropdownSwitcherCollapsed`  | 树形节点折叠时旋转样式。              |
| `filterDropdownSwitcherNoop`       | 叶子节点占位(不可切换)。              |
| `filterDropdownTreeWrapper`        | 树形列表最外层包裹。                  |
| `filterDropdownTreeList`           | 树形列表 `<ul>` 容器。                |
| `filterDropdownTreeItem`           | 单个树节点行。                        |
| `filterDropdownTreeContentWrapper` | 树节点内容(checkbox + 文字)的包裹层。 |
| `filterDropdownTreeItemSelected`   | 被选中的树节点样式。                  |
| `filterDropdownTreeCheckAll`       | "全选" checkbox 行。                  |

### 空状态

| Slot           | 说明                   |
| -------------- | ---------------------- |
| `empty`        | 空状态根容器。         |
| `emptyWrapper` | 空状态内容居中包裹层。 |
| `emptyIcon`    | 空状态图标/图片区域。  |
| `emptyText`    | 空状态文字。           |

### 加载状态

| Slot             | 说明                           |
| ---------------- | ------------------------------ |
| `loading`        | 加载遮罩层。覆盖整个表格区域。 |
| `loadingSpinner` | 加载旋转图标。                 |

### 行选中

| Slot              | 说明                              |
| ----------------- | --------------------------------- |
| `tdSelected`      | 选中行的 `<td>` 背景色。          |
| `tdSelectedHover` | 选中行 hover 时的 `<td>` 背景色。 |

### 行选择下拉

| Slot                    | 说明                            |
| ----------------------- | ------------------------------- |
| `selectionDropdown`     | 选择操作下拉面板(全选/反选等)。 |
| `selectionDropdownItem` | 选择操作下拉选项。              |
| `selectionExtra`        | 选择列表头的下拉触发图标。      |

### 标题、页脚与摘要

| Slot          | 说明                 |
| ------------- | -------------------- |
| `title`       | 表格标题区域。       |
| `footer`      | 表格页脚区域。       |
| `summary`     | 摘要行容器。         |
| `summaryRow`  | 摘要 `<tr>` 行。     |
| `summaryCell` | 摘要 `<td>` 单元格。 |

### 固定列与固定表头

| Slot                     | 说明                               |
| ------------------------ | ---------------------------------- |
| `headerWrapper`          | 固定表头模式下表头的滚动包裹层。   |
| `bodyWrapper`            | 固定表头模式下表体的滚动包裹层。   |
| `fixedCell`              | 固定列单元格，使用 `sticky` 定位。 |
| `fixedDividerLeft`       | 左固定列边界分隔线。               |
| `fixedDividerRight`      | 右固定列边界分隔线。               |
| `fixedShadowLeft`        | 左固定列滚动时的阴影层。           |
| `fixedShadowRight`       | 右固定列滚动时的阴影层。           |
| `fixedShadowLeftHidden`  | 左固定列阴影隐藏状态。             |
| `fixedShadowRightHidden` | 右固定列阴影隐藏状态。             |

### 展开行

| Slot                        | 说明                                           |
| --------------------------- | ---------------------------------------------- |
| `expandIcon`                | 展开按钮基础样式(圆角方框 + / −)。             |
| `expandIconExpanded`        | 展开状态下的图标样式。                         |
| `expandIconCollapsed`       | 折叠状态下的图标样式。                         |
| `expandIconSpaced`          | 不可展开行的占位符，保持缩进对齐。             |
| `expandIconDisabled`        | 禁用展开的图标样式。                           |
| `expandIconSymbol`          | 展开图标的 SVG symbol 容器（antdv 默认隐藏）。 |
| `expandIconSymbolExpanded`  | 展开状态的 SVG symbol 样式。                   |
| `expandIconSymbolCollapsed` | 折叠状态的 SVG symbol 样式。                   |
| `expandedRow`               | 展开行 `<tr>` 元素。                           |
| `expandedRowCell`           | 展开行内容 `<td>` 单元格。                     |

### 树形展开

| Slot                            | 说明                       |
| ------------------------------- | -------------------------- |
| `treeExpandIcon`                | 树形行展开按钮基础样式。   |
| `treeExpandIconExpanded`        | 树形展开状态样式。         |
| `treeExpandIconCollapsed`       | 树形折叠状态样式。         |
| `treeExpandIconSpaced`          | 叶子节点的占位符。         |
| `treeExpandIconDisabled`        | 禁用展开。                 |
| `treeExpandIconSymbol`          | 树形展开 SVG symbol 容器。 |
| `treeExpandIconSymbolExpanded`  | 树形展开 SVG 样式。        |
| `treeExpandIconSymbolCollapsed` | 树形折叠 SVG 样式。        |

### 列宽拖拽

| Slot           | 说明           |
| -------------- | -------------- |
| `resizeHandle` | 列宽拖拽手柄。 |

---

## Variant 列表

除了直接的 slot 覆盖，主题还通过 variant 控制条件样式。可通过 props 或全局 theme 的 `defaultVariants` 调整：

| Variant     | 值                 | 默认值  | 影响的 Slot                                                   |
| ----------- | ------------------ | ------- | ------------------------------------------------------------- |
| `size`      | `lg` / `md` / `sm` | `lg`    | `th`, `td`, `title`, `footer`, `summaryCell` 的 padding       |
| `bordered`  | `true` / `false`   | `false` | `root`, `th`, `td`, `tbody`, `title`, `footer`, `summaryCell` |
| `striped`   | `true` / `false`   | `false` | `td`（偶数行添加条纹背景）                                    |
| `hoverable` | `true` / `false`   | `true`  | `td`（行 hover 背景）                                         |
| `loading`   | `true` / `false`   | —       | `table`（半透明 + 禁止交互）                                  |

---

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [预设与语言](/guide/presets-and-locales)
- [API Reference](/guide/api-reference)
