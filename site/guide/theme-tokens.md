# Table CSS 变量参考

如果你要改的是颜色、字号、间距、空态尺寸、loading 蒙层这类 token 值，优先覆盖 CSS 变量，而不是直接重写 slot class。

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
  --vtg-table-header-bg: #f8fafc;
}
```

这种方式适合：

- 保留预设和 slot 结构，只改视觉 token
- 在多个页面和多个表格实例之间共享同一套视觉规则
- 希望未来升级预设时，减少 class 重写带来的维护成本

## 推荐优先级

一般按这个顺序选择：

1. 只改颜色、字号、间距等值，用 CSS 变量
2. 需要改 slot 的 class 结构，用全局 `theme` 或实例级 `ui`
3. 需要改内容结构，再用 Vue slot

表中的预设值对应亮色模式。若暗色模式覆盖了变量，页面会使用暗色值。

## 核心视觉变量

<!-- @api: theme-reference tokens-core -->

## 字段标签变量

`valueType: 'tag'` 与渲染器返回 `presentation: 'tag'` 使用相同 token。状态色沿用 `--vtg-cell-success / warning / error` 与 `--color-primary`。

<!-- @api: theme-reference tokens-tags -->

## 行状态变量

<!-- @api: theme-reference tokens-row-states -->

> [!WARNING]
> `--vtg-table-row-striped-bg` 只有 element-plus 预设读取。**默认的 antdv 预设把斑马纹背景写死在
> slot class 里**（`rgba(0, 0, 0, 0.02)`，对齐 antdv 原生表现），覆盖这个变量不会有任何效果。
> 在 antdv 预设下要改斑马纹，请覆盖 `td` slot：
>
> ```vue
> <VTable :striped="true" :ui="{ td: 'group-even/row:bg-slate-50' }" />
> ```

## 排版与间距变量

<!-- @api: theme-reference tokens-spacing -->

## 筛选面板变量

<!-- @api: theme-reference tokens-filter -->

## 空态与加载变量

<!-- @api: theme-reference tokens-empty-loading -->

> [!NOTE]
> 空态插画相关变量主要用于当前内置空态视觉，尤其是 antdv 预设。若你只关心空态文案或布局，通常改 `empty`、`emptyWrapper`、`emptyText` 这些 slot 会更直接。

## 常见场景示例

### 改表头背景和边框

```css
:root {
  --vtg-table-header-bg: #f8fafc;
  --vtg-table-border-color: #e2e8f0;
}
```

### 改 hover 与选中态

```css
:root {
  --vtg-table-row-hover-bg: #eff6ff;
  --vtg-table-row-selected-bg: #dbeafe;
  --vtg-table-row-selected-hover-bg: #bfdbfe;
}
```

### 统一改紧凑型间距

```css
:root {
  --vtg-table-cell-padding-inline-sm: 10px;
  --vtg-table-cell-padding-block-sm: 6px;
}
```

## 变量、theme、ui 怎么分工

- 只改 token 值：优先 CSS 变量
- 统一改 slot class 结构：用全局 `theme`
- 只改某一张表：用 `ui`

## 分页 tokens

颜色引用语义 tokens，自动跟随暗色模式。

<!-- @api: theme-reference tokens-pagination -->

## 表格弹层 tokens

筛选、批量选择、列设置、密度和每页条数共用以下外观变量。背景沿用 `--color-surface`。

<!-- @api: theme-reference tokens-popup -->

## 工具栏与列设置 tokens

两套预设都支持下列变量。颜色、字体族、正文大小与复选框沿用已有语义和组件 tokens，可配合 `theme.toolbar.slots`、`theme.columnSettings.slots` 或实例 `ui` 调整。

<!-- @api: theme-reference tokens-toolbar -->

业务导出、新增等按钮由项目 UI 库提供，使用该 UI 库的样式配置。工具栏负责按钮区布局，使用方式见 [工具栏与业务扩展](/guide/toolbar)。

## 编辑控件

<!-- @api: theme-reference tokens-editor -->

## Schema 查询区

布局变量控制栅格、标签宽度、操作间距和轻量模式。用法见 [Schema 查询区](/guide/schema-query)。

<!-- @api: theme-reference tokens-query -->

## 批量操作提示条

<!-- @api: theme-reference tokens-selection-alert -->

## 字段进度

<!-- @api: theme-reference tokens-progress -->

填充色复用 `--color-primary` 与单元格状态色变量；成功 / 错误图标跟随状态色。

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [ui Slot 参考](/guide/ui-slots-reference)
- [预设与语言](/guide/presets-and-locales)
