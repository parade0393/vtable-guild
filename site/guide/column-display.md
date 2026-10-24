---
title: 列显示与列顺序
description: 使用 VTableColumnSettings 配置列显隐与表格密度，以及 visible、responsive、columnOrder 的受控行为和扩展方式。
---

# 列显示与列顺序

「列设置」是最常见的列管理诉求：让用户勾选想看的列、按自己的习惯排列字段顺序。VTable
把这两件事拆成两个受控属性——列级 `visible` 控制是否显示，表级 `columnOrder` 控制显示顺序，
显示状态本身由你的应用持有（便于持久化到 localStorage 或用户偏好）。

## 列设置面板

需要同时提供标题、导出按钮、刷新和全屏时，使用可组合的 [VTableToolbar 工具栏](/guide/toolbar)。它复用下方列设置能力，并通过插槽支持业务操作。

`VTableColumnSettings` 提供列显隐、三档密度和重置。交互布局对齐 React ProTable：密度图标打开独立下拉菜单，齿轮图标打开列设置浮层，顶部提供“列展示”全选框与“重置”。它是独立组件，可放进表格的 `title` 插槽或外部工具栏，与表格绑定同一份 `columns`、`size`：

<Demo src="column-display/settings">

<<< @/demos/column-display/settings.vue

</Demo>

`v-model:columns` 接收新的列数组，`v-model:size` 接收 `'large' | 'middle' | 'small'`。面板不修改输入对象，也不维护另一份生效状态；父组件不接受更新时，界面保持传入值。未传 `size` 时跟随表格主题的默认密度（Ant 为 `large`，Element Plus 为 `middle`，也读取 `theme.table.defaultVariants.size`）；要让切换生效，仍需将更新后的 `size` 绑定到表格。

- 分组列可整组隐藏；隐藏父组时子项暂时禁用，子列原有的显隐状态保留。面板允许隐藏全部业务列，入口仍保留在 `title` 中。
- `EXPAND_COLUMN` / `SELECTION_COLUMN` 原样保留，不出现在面板中。`responsive` 仍由表格处理：勾选表示 `visible !== false`，不保证当前断点下显示。
- “列展示”支持全选、取消全选和半选状态，批量操作覆盖分组及子列。
- 重置只恢复组件首次接收到的列显隐，密度独立选择。列宽、顺序、固定状态、排序或筛选均保留。动态新增列以首次出现的显隐为默认，删除的列不会被重新加入。
- 为列和分组设置稳定、同级唯一的 `key`。未提供时使用 `dataIndex`，再缺省则使用位置；无稳定标识的列重排后不能保证默认值对应原列。跨分组移动视为新列。需要重新建立默认基线时，可改变组件的 Vue `key` 重新挂载。
- 普通 `title` 用作选项标签；函数式标题不会被面板调用，默认显示 `key` / `dataIndex`。通过 `#columnLabel="{ column }"` 提供易读标签，避免在选项标签内放置交互控件。
- 首版不调整列顺序和固定位置。键盘可操作按钮与复选框，Escape 关闭并回到入口，Tab 离开面板时关闭。

### 面板 API

| Prop                | 类型 / 默认值                                     | 说明                                 |
| ------------------- | ------------------------------------------------- | ------------------------------------ |
| `columns`           | `TableColumnsType<TRecord>`，必传                 | 受控列配置                           |
| `size`              | `'large' \| 'middle' \| 'small'` / 表格主题默认值 | 与表格共用的密度                     |
| `disabled`          | `boolean` / `false`                               | 禁用入口并关闭已打开面板             |
| `options`           | `{ density?: boolean; setting?: boolean }`        | 分别控制密度与列设置入口，默认都开启 |
| `getPopupContainer` | `(trigger: HTMLElement) => HTMLElement`           | 默认挂载到 `document.body`           |
| `locale`            | `Partial<VTableGuildColumnSettingsLocale>`        | 实例文案覆盖                         |
| `ui` / `class`      | slot class 映射 / `string`                        | 实例主题覆盖 / 根元素 class          |

事件：`update:columns(columns)`、`update:size(size)`、`reset()`。重置依次发出列更新和 `reset`；选择密度后关闭菜单，选中项保持受控。面板本身不会触发表格的 `change` 事件或发起请求。

全局样式使用 `theme.columnSettings.slots`，实例使用 `ui`。两套预设共享 `root`、`trigger`、`densityTrigger`、`popup`、`densityPopup`、`header`、`heading`、`reset`、`density`、`columns`、`children`、`item`、`label`、`checkboxControl`、`checkbox`、`checkMark`、`indeterminateMark`、`labelText`、`empty`。可通过 `--vtg-column-settings-width`、`--vtg-column-settings-radius`、`--vtg-column-settings-icon-size`、`--vtg-column-settings-shadow`、`--vtg-column-settings-z` 调整图标和弹层。

中英文文案跟随全局或 ConfigProvider 的 `locale`，支持 `localeOverrides.columnSettings` 和实例 `locale`。旧语言包无需补字段。

### 保存用户偏好

持久化由业务选择时机和存储位置。只保存列 key、显隐和密度，不要序列化整个列配置，否则函数式 renderer、排序器等会丢失。例如，平铺列可在父组件里订阅状态：

```ts
watch([columns, size], ([currentColumns, currentSize]) => {
  const visibility = currentColumns.flatMap((column) =>
    typeof column !== 'symbol' && column.key !== undefined
      ? [{ key: column.key, visible: column.visible !== false }]
      : [],
  )
  try {
    localStorage.setItem('members-table:v1', JSON.stringify({ size: currentSize, visibility }))
  } catch {
    // 存储不可用时仍允许正常使用表格。
  }
})
```

加载偏好时校验 JSON 结构、列 key 和密度值，再合并到业务列定义；分组列需按稳定路径递归保存和恢复。SSR 场景在客户端读取存储。若在挂载面板之前载入偏好，“恢复默认”会以载入后的状态为基线；若需要回到业务初始配置，先挂载面板，再在 `onMounted` 恢复偏好。

## 手动列管理示例

用勾选框切换列的显隐，用 ‹ › 按钮调整列顺序。

<Demo src="column-display/basic">

<<< @/demos/column-display/basic.vue

</Demo>

## 列显示 visible

在列上设置 `visible: false`，该列从表头和表体中移除。它是受控属性：显示与否完全由外部
字段决定，需要恢复显示时把 `visible` 改回来（或删掉这个字段）即可。

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180 },
  // 用户在「列设置」里取消勾选了这一列
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, visible: false },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
]
```

关键行为：

- 隐藏只作用于显示层。列上已激活的排序/筛选状态**不会**被丢弃——隐藏一个正在排序的列，
  行序仍受它影响；重新显示后排序依旧生效。
- 分组列 `visible: false` 时整组隐藏；组内子列全部被隐藏时，整个空组也会被移除。
- 可以与 `responsive` 组合：两者任一不满足，列都不显示。

## 列顺序 columnOrder

`columnOrder` 的类型是 `Key[]`，其中 `Key = string | number`，表达列的显示顺序：

```vue
<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :column-order="['status', 'name']"
  />
</template>
```

上面的配置下，列的渲染顺序为 `status → name → age`（若 `columns` 里还有未提到的列）：

- 在 `columnOrder` 中出现的列按数组顺序排前；同一 key 重复出现时取首次位置。
- 未出现的列（含无 key 列）保持原相对顺序，排在已匹配列之后。
- 选择列 / 展开列不参与顺序匹配，固定在行首。
- 只重排顶层列：分组列整组移动，不支持把子列移出分组。

## 已知边界

- 重排可能破坏「左固定列连成前缀、右固定列连成后缀」的结构。非虚拟模式下 sticky 固定列
  仍正常工作，但穿插排列时固定列阴影可能出现异常；开启 `virtualColumn` 横向虚拟化时,
  不满足结构会有 dev 告警并回落为渲染全部列。
- 列宽拖拽的宽度覆写按列 key 记录，重排后自动保留。

## 相关页面

- [列宽拖拽](/guide/column-resize)
- [固定列](/guide/fixed-columns)
- [API 参考](/guide/api-reference)

## Type Declarations

`visible` 和 `responsive` 属于列配置，`columnOrder` 属于表格配置。props / 列配置为相关字段节选；`DisplayColumnFields` 和 `ColumnOrderFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSize

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsProps

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSlots

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#Breakpoint

<<< @/.vitepress/type-declarations/features.ts#DisplayColumnFields

<<< @/.vitepress/type-declarations/features.ts#ColumnOrderFields

:::
