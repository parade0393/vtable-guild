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
> 安装并导入 `@vtable-guild/vtable-guild` 后，在 TypeScript 项目中 `ui` prop 的所有 slot key 都有自动补全。

---

## 这页不只给 `ui` 用

这页列出的 slot 和 variant，不只是 `ui` prop 的参考表，也对应全局 `theme` 的写法：

- `ui.th`
  对应 `theme.table.slots.th`
- `ui.td`
  对应 `theme.table.slots.td`
- `hoverable.true.td`
  对应 `theme.table.variants.hoverable.true.td`
- `size: 'small'`
  对应 `theme.table.defaultVariants.size = 'small'`

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
        size: 'small',
      },
    },
  },
})
```

如果你要的是应用级统一规范，优先看 [三层主题覆盖](/guide/theme-overrides)。如果你只是改单张表，再回到 `ui`。

## 快速示例：修改行 hover 背景色

行 hover 效果由 `hoverable` variant 控制，hover 高亮通过 JS 状态驱动，能正确处理跨行合并单元格。自定义 hover 背景色推荐覆盖 CSS 变量：

### 方式一：覆盖 CSS 变量（推荐）

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

### 方式二：通过 `ui` prop 覆盖 `tdRowHover` slot

```vue
<VTable :columns="columns" :data-source="data" :ui="{ tdRowHover: 'bg-blue-50' }" />
```

### 方式三：通过全局 `theme`

```ts
app.use(
  createVTableGuild({
    theme: {
      table: {
        slots: {
          tdRowHover: 'bg-blue-50',
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

<!-- @api: theme-reference slots-structure -->

### 表头与单元格包装

<!-- @api: theme-reference slots-cell-wrappers -->

### 分组表头

<!-- @api: theme-reference slots-grouped-header -->

### 排序

<!-- @api: theme-reference slots-sorting -->

### 筛选图标

<!-- @api: theme-reference slots-filter-icon -->

### 筛选下拉面板

<!-- @api: theme-reference slots-filter-menu -->

### 筛选树形结构

<!-- @api: theme-reference slots-filter-tree -->

### 空状态

<!-- @api: theme-reference slots-empty -->

### 加载态

<!-- @api: theme-reference slots-loading -->

### 行选中

<!-- @api: theme-reference slots-row-states -->

### 行拖拽排序

<!-- @api: theme-reference slots-row-drag -->

### 行选择下拉

<!-- @api: theme-reference slots-selection-menu -->

### 标题、页脚与摘要

<!-- @api: theme-reference slots-summary -->

### 固定列与固定表头

<!-- @api: theme-reference slots-fixed -->

### 展开行

<!-- @api: theme-reference slots-expand -->

### 树形展开

`treeExpandIconLoading` 与 `treeExpandIconError` 分别控制懒加载反馈与可重试错误；颜色、大小与动画由预设层定义。

<!-- @api: theme-reference slots-tree -->

### 字段标签

`cellTag` 控制 `valueType: 'tag'` 的标签外观，`cellStatus` 继续控制枚举状态标记。两者共享 `data-status` 与状态色变量；自定义 renderer 也可返回 `presentation: 'tag'` 使用标签主题。

<!-- @api: theme-reference slots-tags -->

### 字段进度

<!-- @api: theme-reference slots-progress -->

### 编辑控件

<!-- @api: theme-reference slots-edit -->

查询区使用独立的 `theme.query`，见 [Schema 查询区](#schema-查询区)。

### 列宽拖拽

<!-- @api: theme-reference slots-resize -->

### 列宽布局

<!-- @api: theme-reference slots-width-layout -->

---

## Variant 列表

表格根据 props 应用条件样式。全局 `theme.table.variants` 可覆盖预设的条件 class。表格未传 `size` 时，可通过 `theme.table.defaultVariants.size` 调整默认尺寸。

<!-- @api: theme-reference table-variants -->

## 工具栏与列设置的主题 slots

这两个组件有独立的主题配置：全局使用 `theme.toolbar.slots` / `theme.columnSettings.slots`，实例使用各自的 `ui`。`VTableToolbar` 内部列设置的实例样式通过 `columnSettings.ui` 传入；单独使用 `VTableColumnSettings` 时直接传 `ui`。

### VTableToolbar

<!-- @api: theme-reference slots-toolbar -->

### VTableColumnSettings

<!-- @api: theme-reference slots-column-settings -->

主题 slot 用来改样式；Vue 内容插槽 `#actions`、`#settings` 和 `#columnLabel` 用来扩展内容，属于工具栏或列设置组件。完整示例见 [工具栏与业务扩展](/guide/toolbar)。

## 分页、批量提示与查询区的主题 slots

分页使用全局 `theme.pagination.slots`。批量操作提示条和 Schema 查询区也有各自的全局主题和实例 `ui`。

### 分页

<!-- @api: theme-reference slots-pagination -->

### 批量操作提示条

<!-- @api: theme-reference slots-selection-alert -->

### Schema 查询区

<!-- @api: theme-reference slots-query -->

## 进一步阅读

- [三层主题覆盖](/guide/theme-overrides)
- [Table CSS 变量参考](/guide/theme-tokens)
- [预设与语言](/guide/presets-and-locales)
- [API Reference](/guide/api-reference)

## Type Declarations

`ui` 使用 `SlotProps<TableThemeConfig>`，值为可选 class 字符串。下列提供全部 Table 主题 slot 与 variant props；完整全局覆盖映射见 [类型参考](/guide/type-reference#themeoverrideconfig)。`cn()` 的辅助参数类型不是包导出。

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#TableSlots

<<< @/.vitepress/type-declarations/config.ts#TableVariantProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

<<< @/.vitepress/type-declarations/config.ts#ColumnSettingsThemeTypes

<<< @/.vitepress/type-declarations/config.ts#SlotProps

<<< @/.vitepress/type-declarations/config.ts#ThemeOverrideConfig

<<< @/.vitepress/type-declarations/config.ts#cn

:::
