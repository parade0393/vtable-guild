---
title: 行选择
description: 区分受控与非受控 selectedRowKeys、preserveSelectedRowKeys 的跨页记录缓存，以及选择回调中 keys 与 rows 的顺序和范围。
---

# 行选择

rowSelection 用来开启行选择列，并统一管理单选、多选、全选、自定义批量选择和树形联动行为。

如果你的页面有“批量操作”“勾选后侧边编辑”“按选中项导出”这类需求，这一组能力会是高频入口。

## 在线示例

受控多选 + `getCheckboxProps` 禁用单行 + 表头「选择项」下拉（含一个自定义项）。

<Demo src="selection/basic">

<<< @/demos/selection/basic.vue

</Demo>

## 基础多选

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType, type RowSelection } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  disabled?: boolean
}

const columns: TableColumnsType<UserRow> = [{ title: '姓名', dataIndex: 'name', key: 'name' }]

const rowSelection: RowSelection<UserRow> = {
  type: 'checkbox',
  getCheckboxProps: (record) => ({
    disabled: record.disabled,
  }),
}

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada' },
  { key: '2', name: 'Grace', disabled: true },
]
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :row-selection="rowSelection"
  />
</template>
```

## 受控选择

当选中项需要和页面状态、侧边栏操作区或接口请求保持同步时，建议直接使用受控模式。

传入 `selectedRowKeys` 即进入受控模式，选中 key 由业务维护。组件通过 `onChange` 请求更新，父组件回写后才接受新的选中状态。替换 `dataSource` 时不会自动裁剪受控 key，即使未设置 `preserveSelectedRowKeys` 或显式设置为 `false`。

下面沿用基础示例中的 `UserRow`。`RowSelection<UserRow>` 为内联回调提供上下文类型：`onChange` 的参数分别是 `Key[]` 和 `UserRow[]`，无需再逐个手工标注。

```ts
import { computed, ref } from 'vue'
import type { Key, RowSelection } from '@vtable-guild/vtable-guild'

const selectedRowKeys = ref<Key[]>([])

const rowSelection = computed<RowSelection<UserRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))
```

## 单选与批量选择

- type: 'radio' 时进入单选模式。
- selections: true 可以开启默认批量选择菜单。
- selections 也可以传入自定义菜单项，用于“只选当前结果”“只选可操作项”等业务动作。
- hideSelectAll 可以隐藏表头全选入口。

## 分页与跨页选择

开启 `pagination` 后，表头复选框只选择或取消当前页的可选行；反选和 Shift 连选也限定当前页。本地分页切换页码时会保留其他页的选择。

`selections: true` 开启“全选所有 / 反选当页 / 清空所有”菜单，也可通过 `[SELECTION_ALL]` 单独开启“全选所有”。“全选所有”（英文 `Select all data`）选择筛选后全部已加载的可选记录，不受当前页限制。远程分页通常只加载当前页，不会因此请求或选择尚未加载的页。

远程翻页通常会替换 `dataSource`。跨页 key 是否保留与回调能否返回此前页的行数据，需要分别判断：

| 选择模式                       | `preserveSelectedRowKeys` | 替换 `dataSource` 后的 key               | `onChange` 的 rows                   |
| ------------------------------ | ------------------------- | ---------------------------------------- | ------------------------------------ |
| 受控：传入 `selectedRowKeys`   | 未设置或 `false`          | 由业务维护，组件不自动裁剪               | 仅包含当前 `dataSource` 中的选中记录 |
| 非受控：未传 `selectedRowKeys` | 未设置或 `false`          | 自动裁剪当前 `dataSource` 中不存在的 key | 仅包含当前 `dataSource` 中的选中记录 |
| 受控：传入 `selectedRowKeys`   | `true`                    | 由业务维护，组件不自动裁剪               | 当前记录加上此前缓存的跨页选中记录   |
| 非受控：未传 `selectedRowKeys` | `true`                    | 保留当前 `dataSource` 中不存在的 key     | 当前记录加上此前缓存的跨页选中记录   |

例如，受控模式下第 1 页选中 key `1`，翻到第 2 页再选中 key `11`：未开启 preserve 时，`onChange` 的 keys 为 `[1, 11]`，rows 只包含第 2 页的记录 `11`；返回第 1 页时，记录 `1` 仍然勾选。因此，按 keys 展示的已选数量可能大于 rows 的数量。

需要 `onChange: (keys: Key[], rows: TRecord[]) => void` 返回此前页的选中记录时，设置 `preserveSelectedRowKeys: true`，在选择期间缓存已加载的选中记录。它不会请求未加载页，也无法仅凭 key 补出从未加载或缓存过的行数据。请为每条记录提供稳定的 `rowKey`。

如果业务要求受控选择在切页、重新查询或删除记录后清空，应在对应业务流程中主动清空 `selectedRowKeys` 和自行保存的选中行数据。只设置 `preserveSelectedRowKeys: false` 不会自动清空受控 key。

可在[本地分页示例](/guide/pagination#本地分页)验证表头全选与菜单全选的范围，在[远程分页示例](/guide/pagination#远程分页)验证跨页保留与已选记录回填。

## 回调顺序

选择回调的 `selectedRows` 按同次 `selectedRowKeys` 的顺序返回。普通复选框的 keys 保留原有插入顺序，新选择的 key 追加到末尾；受控模式以业务传入的 key 顺序为基础，树形联动可能按联动规则追加父子 key。

组件依次按 key 查找记录，优先使用当前数据源中的记录，开启 `preserveSelectedRowKeys` 后再查找跨页缓存。例如，同页先选 `3` 再选 `1`，keys 和 rows 的 ID 顺序都是 `[3, 1]`；开启 preserve 后，第 1 页选 `1`、第 2 页再选 `11`，两者的顺序都是 `[1, 11]`，当前页记录不会被统一放到前面。

无法获取记录的 key 会被跳过，rows 中不会插入占位值。因此 rows 保持 keys 的相对顺序，但数量仍可能小于 keys；只有每个 key 都能获取记录时，两个数组才按下标一一对应。业务关联记录时应使用 `rowKey`。

一次选择操作的 `onChange` 与 `onSelect`、`onSelectAll` 或 `onSelectMultiple` 共用规范化后的选中结果，父组件在 `onChange` 中同步修改 keys 或数据源不会让后续回调重新取另一份 rows。`changeRows` 表示本次实际变化的行，保留操作遍历顺序，独立于全部选中行的顺序。

## 树形数据联动

当 checkStrictly 为 false 时，父子节点会联动：

- 选中所有子节点后，父节点自动选中。
- 只选中部分子节点时，父节点显示为半选。
- 点击父节点会递归切换整棵子树。

如果你的业务更强调“每一行独立选择”，把 checkStrictly 保持为 true 会更清晰。

## 使用建议

- 非受控模式需要保留数据源外的 key，或回调需要此前页的选中记录时，设置 `preserveSelectedRowKeys: true`；受控 key 的保留与清空由业务维护。
- 如果某些行不可操作，优先通过 getCheckboxProps 禁用，而不是在点击后再回滚状态。
- 树形联动适合权限树、组织架构和分组数据，不适合每行语义完全独立的表格。

## API

`TRecord` 表示业务行类型。下表只列与行选择相关的配置，全部 props 见 [API Reference](/guide/api-reference)。

### Props

<!-- @api: props selection -->

### RowSelection

<!-- @api: row-selection selection -->

启用分页后，表头全选和反选限定当前页；“全选所有”选择筛选后全部已加载的可选记录，见[分页与跨页选择](#分页与跨页选择)。

### Events

<!-- @api: events selection -->

选择变化时 `extra.action` 为 `'select'`，`extra.currentDataSource` 为当前页展示数据。只关心选中项时，直接用 `rowSelection.onChange` 更简单。

## 主题

只改颜色时优先覆盖 [CSS 变量](#css-变量)；要改 class 时，用实例 `ui` 或全局 `theme.table.slots`。三种方式怎么选见[三层主题覆盖](/guide/theme-overrides)。

### ui slots

<!-- @api: ui selection -->

### 预设默认值

两套预设在上述 slot 上的默认 class，按 `createVTableGuild({ theme })` 的结构给出，复制后修改即可；覆盖值会通过 `cn()` 与默认值合并。element-plus 与 Element Plus 原版一致，选中行不改变背景。默认预编译模式下这些 utility 在运行时带 `vtg-` 前缀，覆盖规则见 [utility 前缀与覆盖规则](/guide/theme-overrides#utility-前缀与覆盖规则)。

<!-- @api: theme selection -->

### CSS 变量

表中为亮色模式下的默认值，暗色模式在 `.dark` 下另行覆盖。弹层变量由批量选择菜单与筛选面板等表格弹层共用。

<!-- @api: css-vars selection -->

## Type Declarations

`RowSelection<TRecord>` 中所有行回调都保留业务行类型。选择哨兵是 `SELECTION_ALL`、`SELECTION_INVERT`、`SELECTION_NONE` 常量的类型；导入方式与渲染返回类型见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#RowSelectionType

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

<<< @/.vitepress/type-declarations/table.ts#SelectionSentinel

<<< @/.vitepress/type-declarations/table.ts#RowSelection

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

:::

## 相关页面

- [树形表格](/guide/tree-table)
- [批量操作提示条](/guide/selection-alert)
- [API Reference](/guide/api-reference)
- [类型参考](/guide/type-reference)
