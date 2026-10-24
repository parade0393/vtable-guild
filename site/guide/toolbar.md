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

## 开关与替换

通过 `options` 隐藏某个内置工具，`false` 关闭所有内置工具。`#actions` 和 `#settings` 保留，业务按钮可独立使用。

```vue
<VTableToolbar
  v-model:columns="columns"
  v-model:size="size"
  title="订单列表"
  :options="{ reload: false, fullScreen: false }"
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

## 状态与全屏

- `columns`、`size` 与表格共用，使用 `v-model` 接受更新。未传 `columns` 时隐藏列设置；未传 `size` 时读取表格主题的默认密度。
- 刷新只触发 `reload`。请求期间由业务设置 `loading`，刷新按钮显示加载状态并防止重复点击，密度和列设置仍可使用。
- `disabled` 禁用内置操作。自定义按钮通过插槽参数读取 `disabled`、`loading` 并决定禁用规则。
- 启用 `options.fullScreen` 时传入 `fullscreenTarget: () => HTMLElement | null`，让工具栏和表格一起进入浏览器全屏。缺少目标或浏览器 API 时按钮禁用。浏览器确认变化后发出 `fullscreenChange`，按 Escape 退出也会同步；请求失败发出 `fullscreenError`。
- 全屏时列设置浮层默认挂载到全屏目标内。若通过 `columnSettings.getPopupContainer` 自定义容器，应返回全屏目标的后代元素。

## API

| Prop               | 类型 / 默认值                                                                        | 说明                                     |
| ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| `title`            | `VNodeChild`                                                                         | 标题，也可使用 `#title`                  |
| `columns`          | `TableColumnsType<TRecord>`                                                          | 与表格共用的受控列配置                   |
| `size`             | `'large' \| 'middle' \| 'small'`                                                     | 表格密度，默认跟随表格主题               |
| `options`          | `false \| TableToolbarOptions`                                                       | 默认开启刷新、密度和列设置，全屏默认关闭 |
| `loading`          | `boolean` / `false`                                                                  | 刷新按钮加载状态                         |
| `disabled`         | `boolean` / `false`                                                                  | 禁用内置操作                             |
| `fullscreenTarget` | `() => HTMLElement \| null \| undefined`                                             | 显式全屏目标                             |
| `columnSettings`   | `Pick<TableColumnSettingsProps, 'locale' \| 'ui' \| 'class' \| 'getPopupContainer'>` | 列设置面板的进一步配置                   |
| `locale`           | `Partial<VTableGuildToolbarLocale>`                                                  | 实例文案覆盖                             |
| `ui` / `class`     | slot class 映射 / `string`                                                           | 实例主题覆盖                             |

`options` 支持 `reload`、`density`、`setting`、`fullScreen` 布尔开关。

事件：`update:columns(columns)`、`update:size(size)`、`reset()`、`reload()`、`fullscreenChange(active)`、`fullscreenError(error)`。重置沿用列设置面板的行为，只恢复初始列显隐。

插槽：`title`、`actions`、`settings` 接收 `TableToolbarSlotProps<TRecord>`；`columnLabel` 接收 `{ column }`，用于自定义列设置选项的标签。

## 主题与语言

全局使用 `theme.toolbar.slots`，实例使用 `ui`。两套预设共享 `root`、`title`、`right`、`actions`、`settings`、`action`、`icon`、`loadingIcon`，可调整布局、间距和图标。标题使用 `--vtg-toolbar-title-font-size`、`--vtg-toolbar-title-font-weight`；工具图标复用列设置的图标 token。

工具栏文案跟随全局语言，支持 `localeOverrides.toolbar` 和实例 `locale`。列设置文案仍由 `columnSettings.locale` 或 `localeOverrides.columnSettings` 控制。

## Type Declarations

::: details 工具栏类型

<<< @/.vitepress/type-declarations/toolbar.ts

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

:::
