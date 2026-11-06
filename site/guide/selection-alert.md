---
title: 批量操作提示条
description: 使用 VTableSelectionAlert 展示跨页已选数量、清空受控选择，并组合批量业务操作。
---

# 批量操作提示条

`VTableSelectionAlert` 与表格共用受控的 `selectedRowKeys`。它按 keys 展示数量，提供清空入口和业务操作插槽，可放在表格上方、工具栏扩展行或分页内容插槽中。

## 跨页批量操作

下面的示例用两个数据页模拟远程分页。分别在两页勾选记录，可以看到已选数量包含当前没有加载的记录，而插槽中的 `selectedRows` 只包含业务传入的已加载记录。批量操作使用 keys，不依赖当前页数据是否完整。

<Demo src="selection-alert/basic">

<<< @/demos/selection-alert/basic.vue

</Demo>

远程跨页选择应同时给表格设置 `preserveSelectedRowKeys: true`。提示条不会主动请求其他页，也不会把“已加载记录全选”转换成“服务端全部结果”。如果业务需要操作某个查询的全部结果，应另行定义服务端选择协议。

## 受控状态与清空

```vue
<VTableSelectionAlert
  v-model:selected-row-keys="selectedRowKeys"
  :selected-rows="availableSelectedRows"
  :loading="batchLoading"
  @clear="handleClear"
>
  <template #actions="{ selectedRowKeys, disabled }">
    <a-button :disabled="disabled" @click="approve(selectedRowKeys)">批量审核</a-button>
  </template>
</VTableSelectionAlert>
```

清空依次发出 `update:selectedRowKeys([])` 和 `clear(previousKeys, availableRows)`。父组件接受更新前，显示数量保持传入值。组件不维护另一份选择状态，也不触发表格的 `change` 或刷新请求。

`disabled` 或 `loading` 会禁用默认清空入口，插槽中的 `disabled` 同时反映这两个状态。业务按钮自行绑定该值。默认没有选中项时隐藏整个提示条；`alwaysShow` 可以显示零选中状态，此时清空按钮禁用。

## API

### VTableSelectionAlert Props

<!-- @api: reference selection-alert-props -->

事件：`update:selectedRowKeys(keys)`、`clear(previousKeys, availableRows)`。

`info` 替换左侧数量文本；`showClear` 控制的默认清空入口与 `actions` 业务按钮一起放在右侧操作区。两者接收 `TableSelectionAlertSlotProps<TRecord>`：

<!-- @api: reference selection-alert-slot-props -->

### VTable 行选择配置

<!-- @api: props selection-alert -->

## 主题与语言

全局使用 `theme.selectionAlert.slots`，实例使用 `ui`。

文案跟随全局语言，支持 `localeOverrides.selectionAlert` 和实例 `locale`。`selected` 文案里的 `{count}` 替换为已选数量，`label` 是区域名称，`clear` 是清空按钮文本。

以下 class 和 CSS 变量控制提示条的布局、文案和清空入口。

### ui slots

<!-- @api: ui selection-alert -->

### 预设默认值

<!-- @api: theme selection-alert -->

### CSS 变量

<!-- @api: css-vars selection-alert -->

## Type Declarations

::: details 批量提示条类型

<<< @/.vitepress/type-declarations/selection-alert.ts

<<< @/.vitepress/type-declarations/config.ts#VTableGuildSelectionAlertLocale

<<< @/.vitepress/type-declarations/config.ts#SelectionAlertThemeTypes

:::
