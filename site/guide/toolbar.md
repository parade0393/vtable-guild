---
title: 工具栏与业务扩展
description: 使用 VTableToolbar 组合刷新、密度、列设置与全屏，通过 actions 和 settings 插槽扩展导出、新增等业务操作。
---

# 工具栏与业务扩展

`VTableToolbar` 提供标题、业务操作区和常用工具。布局参考 React ProTable，支持 Ant Design Vue 和 Element Plus 预设。将它放进 `VTable` 的 `title` 插槽即可使用。

默认提供刷新、密度和列设置；全屏按需启用。导出、新增、批量操作等业务能力通过插槽加入，可以使用项目已安装的 UI 库按钮。

## 加入导出按钮

下面的“导出 CSV”来自 `#actions`，与内置工具并排显示。示例读取 `title` 插槽的 `data` 和工具栏的受控列配置，只导出当前展示数据中的可见字段；列设置、分页或筛选变化后，业务可以选择导出当前页、全部数据或已选择的记录。

<Demo src="toolbar/basic">

<<< @/demos/toolbar/basic.vue

</Demo>

组件不会执行数据请求或转换导出文件。你可以将示例中的导出函数换成 Excel、PDF 或服务端导出任务，按钮的权限、确认和进度由业务决定。

## 搜索、筛选与视图切换

`search` 开启一体式关键词输入与右侧搜索图标按钮，默认高度 32px。只关心提交结果时监听 `search` 即可：按 Enter、点击搜索按钮或清空图标都会触发，参数是提交的关键词，清空时为空字符串。

```vue
<VTableToolbar search @search="keyword = $event" />
```

输入草稿默认由组件持有，输入变化不会自动提交或刷新。需要在外部读取或修改草稿时（例如“重置”按钮同时清空输入框），用 `v-model:search-value` 接管；此时输入框显示的始终是传入的值。

清空图标依次触发 `update:searchValue('')`、`clearSearch` 和 `search('')`。空关键词的请求放在 `search` 中处理；`clearSearch` 只用于区分“清空”这一操作，不要在两个事件里重复请求。

`#filter` 放入业务已有的筛选控件；默认与操作按钮同排，`multipleLine` 将它放进第二行。`#extra` 始终使用独立整行，可组合 Tabs、批量提示条或其他业务内容。状态、页码与选择是否随视图切换而重置由业务决定。

<Demo src="toolbar/search">

<<< @/demos/toolbar/search.vue

</Demo>

`#search` 可以完全替换内置搜索控件。它与其他工具栏插槽共用 `searchValue`、`updateSearchValue(value)`、`submitSearch(value?)`、`clearSearch()`，草稿同样可以不绑定。`loading` 期间可以修改搜索草稿，提交和清空暂时禁用；`disabled` 同时禁用输入和操作。按 Enter 提交时会避开输入法组合状态。

```vue
<VTableToolbar @search="submitQuery">
  <template #search="{ searchValue, updateSearchValue, submitSearch, disabled }">
    <a-input-search
      :value="searchValue"
      :disabled="disabled"
      @update:value="updateSearchValue"
      @search="submitSearch"
    />
  </template>
</VTableToolbar>
```

## 开关与替换

通过 `options` 隐藏某个内置工具，`false` 关闭所有内置工具。`#actions` 和 `#settings` 保留，业务按钮可独立使用。

```vue
<VTableToolbar
  v-model:columns="columns"
  v-model:size="size"
  title="订单列表"
  :options="{ reload: false, density: false }"
>
  <template #actions="{ disabled }">
    <a-button :disabled="disabled" @click="exportOrders">导出 Excel</a-button>
    <a-button type="primary" :disabled="disabled" @click="createOrder">新建订单</a-button>
  </template>
</VTableToolbar>
```

`#title` 自定义标题区。`#settings` 完全替换内置工具区，适合自定义图标、操作顺序或菜单；插槽参数提供 `reload`、`toggleFullscreen` 方法及当前状态。

```vue
<VTableToolbar title="订单列表" :loading="loading" @reload="loadOrders">
  <template #title><strong>订单列表</strong><a-tag>本月</a-tag></template>
  <template #settings="{ reload, loading, disabled }">
    <a-button :loading="loading" :disabled="disabled" @click="reload">重新加载</a-button>
  </template>
</VTableToolbar>
```

## 状态

- `columns`、`size` 与表格共用，使用 `v-model` 接受更新。未传 `columns` 时隐藏列设置；未传 `size` 时读取表格主题的默认密度。
- 刷新只触发 `reload`。请求期间由业务设置 `loading`，刷新按钮显示加载状态并防止重复点击，密度和列设置仍可使用。
- `disabled` 禁用内置操作。自定义按钮通过插槽参数读取 `disabled`、`loading` 并决定禁用规则。

## 全屏

工具栏放在 `VTable` 的 `title` 或 `footer` 插槽里时，开启 `options.fullScreen` 即可，整张表格（含标题、分页）进入浏览器全屏：

```vue
<VTable :columns="columns" :data-source="rows">
  <template #title>
    <VTableToolbar :options="{ fullScreen: true }" />
  </template>
</VTable>
```

需要把查询表单等表格以外的内容一起全屏，或工具栏不在表格插槽内时，用 `fullscreenTarget` 指定元素，它优先于所在表格：

```vue
<div ref="page">
  <QueryForm />
  <VTableToolbar :options="{ fullScreen: true }" :fullscreen-target="() => page" />
  <VTable :columns="columns" :data-source="rows" />
</div>
```

- 全屏的表格使用 `--vtg-table-bg` 作为背景，内容超出屏幕时可滚动。自定义目标的背景、内边距和滚动由业务通过 `:fullscreen` 设置。
- 没有可用目标或浏览器不支持全屏时按钮禁用；工具栏既不在表格内又没有传 `fullscreenTarget` 时，开发环境会给出告警。
- 浏览器确认变化后触发 `fullscreenChange`，按 Escape 退出也会同步；请求被拒绝时触发 `fullscreenError`。
- 全屏时筛选菜单、列设置、页大小菜单和提示文字默认挂载到全屏元素内。通过 `getPopupContainer` 自定义容器时，应返回全屏元素的后代。

## API

`TRecord` 表示业务行类型。

### Props

<!-- @api: reference toolbar-props -->

### options

内置工具的开关。`fixed`、`draggable` 传递给列设置面板。

<!-- @api: reference toolbar-options -->

### search

`search` 传对象时的配置项；传 `true` 使用默认值。

<!-- @api: reference toolbar-search-config -->

### columnSettings

传给内嵌列设置面板的配置，字段含义与 [`VTableColumnSettings`](/guide/column-display#面板-api) 的同名属性一致。

<!-- @api: reference toolbar-column-settings -->

### Events

<!-- @api: reference toolbar-events -->

### Slots

<!-- @api: reference toolbar-slots -->

### Slot Props

除 `columnLabel` 外，所有插槽都接收 `TableToolbarSlotProps<TRecord>`。

<!-- @api: reference toolbar-slot-props -->

## 主题与语言

工具栏使用全局 `theme.toolbar.slots` 或实例 `ui`，内嵌列设置通过 `theme.columnSettings.slots` 或 `columnSettings.ui` 覆盖。

工具栏文案跟随全局语言，支持 `localeOverrides.toolbar` 和实例 `locale`。列设置文案仍由 `columnSettings.locale` 或 `localeOverrides.columnSettings` 控制。

主题代码分别列出工具栏和列设置面板的默认 class。

### ui slots

<!-- @api: ui toolbar -->

### 预设默认值

<!-- @api: theme toolbar -->

### CSS 变量

<!-- @api: css-vars toolbar -->

## Type Declarations

::: details 工具栏类型

<<< @/.vitepress/type-declarations/toolbar.ts

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

:::
