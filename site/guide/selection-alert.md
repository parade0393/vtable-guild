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

| Prop              | 类型 / 默认值                              | 说明                                  |
| ----------------- | ------------------------------------------ | ------------------------------------- |
| `selectedRowKeys` | `readonly Key[]`，必传                     | 受控的已选键，数量只根据它计算        |
| `selectedRows`    | `readonly TRecord[]`                       | 业务当前拥有的已选记录，可以少于 keys |
| `alwaysShow`      | `boolean` / `false`                        | 零选中时仍显示提示条                  |
| `showClear`       | `boolean` / `true`                         | 是否显示默认清空入口                  |
| `disabled`        | `boolean` / `false`                        | 禁用内置操作，向业务插槽传递禁用状态  |
| `loading`         | `boolean` / `false`                        | 批量操作加载状态，也会禁用清空        |
| `locale`          | `Partial<VTableGuildSelectionAlertLocale>` | 实例文案覆盖                          |
| `ui` / `class`    | slot class 映射 / `string`                 | 实例样式覆盖                          |

事件：`update:selectedRowKeys(keys)`、`clear(previousKeys, availableRows)`。

`info` 替换左侧数量文本；`showClear` 控制的默认清空入口与 `actions` 业务按钮一起放在右侧操作区。两者接收 `TableSelectionAlertSlotProps<TRecord>`：

| 字段              | 类型                 | 说明                             |
| ----------------- | -------------------- | -------------------------------- | --- | -------- |
| `selectedRowKeys` | `readonly Key[]`     | 已选键的快照                     |
| `selectedRows`    | `readonly TRecord[]` | 可用记录的快照                   |
| `count`           | `number`             | keys 数量                        |
| `disabled`        | `boolean`            | `disabled                        |     | loading` |
| `loading`         | `boolean`            | 当前加载状态                     |
| `clear`           | `() => void`         | 与默认清空入口相同的受控更新请求 |

## 主题与语言

全局使用 `theme.selectionAlert.slots`，实例使用 `ui`。两套预设共享 `root`、`info`、`text`、`clear`、`option`、`actions`。外观对齐 React ProTable 现行提示条：中性浅底、无边框、三级灰文字，数量不做强调。可以通过 `--vtg-selection-alert-radius`、`--vtg-selection-alert-bg`、`--vtg-selection-alert-padding-inline`、`--vtg-selection-alert-padding-block` 调整外观。

文案跟随全局语言，支持 `localeOverrides.selectionAlert` 和实例 `locale`。`selected` 文案里的 `{count}` 替换为已选数量，`label` 是区域名称，`clear` 是清空按钮文本。

## Type Declarations

::: details 批量提示条类型

<<< @/.vitepress/type-declarations/selection-alert.ts

<<< @/.vitepress/type-declarations/config.ts#VTableGuildSelectionAlertLocale

<<< @/.vitepress/type-declarations/config.ts#SelectionAlertThemeTypes

:::
