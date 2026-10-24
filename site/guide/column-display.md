---
title: 列显示与列顺序
description: 使用 VTableColumnSettings 配置列显隐、固定与顺序，通过 useColumnState 保存用户偏好。
---

# 列显示与列顺序

「列设置」是最常见的列管理诉求：让用户勾选想看的列、按自己的习惯排列字段顺序。VTable
把这两件事拆成两个受控属性——列级 `visible` 控制是否显示，表级 `columnOrder` 控制显示顺序，
显示状态本身由你的应用持有（便于持久化到 localStorage 或用户偏好）。

## 列设置面板

需要同时提供标题、导出按钮、刷新和全屏时，使用可组合的 [VTableToolbar 工具栏](/guide/toolbar)。它复用下方列设置能力，并通过插槽支持业务操作。

`VTableColumnSettings` 提供列显隐、固定左右、顶层拖拽换序、三档密度和重置。交互布局对齐 React ProTable：密度图标打开独立下拉菜单，齿轮图标打开列设置浮层，顶部提供“列展示”全选框与“重置”。它是独立组件，可放进表格的 `title` 插槽或外部工具栏，与表格绑定同一份 `columns`、`size`：

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
- `hideInSetting: true` 让列及其子列不出现在设置面板，也不参与面板全选或重置。它不改变表格中的显示状态。
- `disable: true` 锁定显隐、固定与顺序；对象形式可分别设置 `checkbox`、`fixed`、`order`。分组中有锁定显隐的子列时，整组不能隐藏，但其他可编辑子列仍可独立调整；组自身禁用显隐时，其子项也不可更改。
- 固定操作将顶层列或整个分组移到左侧、中央或右侧，并保持固定列处于两端。分组固定会同步所有叶子列；有禁止固定的子列时整组固定操作禁用。
- 拖动行前的手柄可调整同一固定区域内的顶层顺序，分组整组移动，不允许子列跨组移动。禁用顺序的列是移动边界，其他列不能拖动跨过它；跨固定区域请使用固定操作。选择列、展开列哨兵的位置保留。
- 键盘可操作现有按钮与复选框，Escape 关闭并回到入口，Tab 离开面板时关闭。

### 固定与顺序

默认显示固定入口和拖拽手柄。`options.fixed: false` 隐藏固定入口，`options.draggable: false` 关闭拖拽。`options.density` 与 `options.setting` 继续分别控制密度和列设置入口。

列设置修改 `columns` 数组顺序，不额外维护 `columnOrder`。绑定表格时请让同一份 `columns` 持有生效顺序；如果同时传入 `columnOrder`，表格仍会按该属性覆盖显示顺序。

现有“重置”只恢复初始显隐，保持顺序、固定与密度不变。需要恢复全部列偏好时，可使用下方 `useColumnState().reset()`。

### 面板 API

| Prop                | 类型 / 默认值                                                                    | 说明                                         |
| ------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| `columns`           | `TableColumnsType<TRecord>`，必传                                                | 受控列配置                                   |
| `size`              | `'large' \| 'middle' \| 'small'` / 表格主题默认值                                | 与表格共用的密度                             |
| `disabled`          | `boolean` / `false`                                                              | 禁用入口并关闭已打开面板                     |
| `options`           | `{ density?: boolean; setting?: boolean; fixed?: boolean; draggable?: boolean }` | 分别控制密度、列设置、固定与拖拽，默认都开启 |
| `getPopupContainer` | `(trigger: HTMLElement) => HTMLElement`                                          | 默认挂载到 `document.body`                   |
| `locale`            | `Partial<VTableGuildColumnSettingsLocale>`                                       | 实例文案覆盖                                 |
| `ui` / `class`      | slot class 映射 / `string`                                                       | 实例主题覆盖 / 根元素 class                  |

事件：`update:columns(columns)`、`update:size(size)`、`reset()`。重置依次发出列更新和 `reset`；选择密度后关闭菜单，选中项保持受控。面板本身不会触发表格的 `change` 事件或发起请求。

全局样式使用 `theme.columnSettings.slots`，实例使用 `ui`。两套预设共享 `root`、`trigger`、`densityTrigger`、`popup`、`densityPopup`、`header`、`heading`、`reset`、`density`、`columns`、`children`、`item`、`label`、`checkboxControl`、`checkbox`、`checkMark`、`indeterminateMark`、`labelText`、`empty`，以及新增的 `row`、`dragHandle`、`pinActions`、`pinAction`、`pinIcon`、`group`、`groupTitle`、`groupColumns`。可通过 `--vtg-column-settings-width`、`--vtg-column-settings-radius`、`--vtg-column-settings-icon-size`、`--vtg-column-settings-pin-icon-size`、`--vtg-column-settings-shadow`、`--vtg-column-settings-z` 调整图标和弹层。

中英文文案跟随全局或 ConfigProvider 的 `locale`，支持 `localeOverrides.columnSettings` 和实例 `locale`。旧语言包无需补字段。

### 保存用户偏好

`useColumnState` 将列定义与用户偏好组合成可写的 `columns`，可以直接同时绑定 `VTable` 和 `VTableColumnSettings`。它只保存稳定路径、显隐、顶层固定位置和顺序，原列上的 renderer、sorter 等函数始终来自源定义。

<Demo src="column-display/preferences">

<<< @/demos/column-display/preferences.vue

</Demo>

```ts
const { columns, state, setState, reset, restore, save } = useColumnState(baseColumns, {
  storageKey: 'members:columns',
  storageType: 'localStorage',
  version: 1,
})
```

- `baseColumns` 接受数组、ref 或 getter，负责列结构和业务配置。对返回 `columns` 的赋值只记录设置偏好，不回写源列定义。
- `state` 是生效状态的只读 computed，键为基于列 `key` / `dataIndex` 生成的路径。可将其保存到业务服务，再通过 `defaultValue` 或 `setState` 恢复；不要依赖路径字符串的内部拼接形式。
- `setState` 替换用户偏好，忽略非法字段。新增列采用其源定义，删除列不会因恢复而重建；同一路径再次出现时重置仍使用首次记录的默认值。
- `reset` 恢复首次记录的显隐、固定与顺序，以及显式 `defaultValue`；不恢复列宽、密度、排序、筛选和已删除列。它与面板只恢复显隐的 `reset` 含义不同。
- 配置 `storageKey` 后状态变化自动保存，`save` 可手动触发。组件内在 `onMounted` 恢复存储；服务端不读取浏览器存储。`storageType` 支持 `localStorage` 或 `sessionStorage`，也可传入具有 `getItem / setItem / removeItem` 的 `storage` 适配器。
- `version` 默认 `1`；存储版本不一致时使用源定义与默认偏好。存储不可用、JSON 错误通过可选 `onError(error)` 报告，不妨碍表格渲染。
- 锁定规则同样约束恢复后的偏好；更新源定义中的锁定配置后，旧存储不能隐藏或移动受保护的列。

#### 由业务自行保存

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
