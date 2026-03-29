# 行选择

行选择能力覆盖 checkbox、radio、受控键集合、自定义选择菜单，以及树形数据下的父子联动。当前已经补上严格模式与非严格模式的状态测试。

## 基础 checkbox

```vue
<script setup lang="ts">
import { VTable, type ColumnsType, type RowSelection } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  disabled?: boolean
}

const columns: ColumnsType<DemoRow> = [{ title: 'Name', dataIndex: 'name', key: 'name' }]

const rowSelection: RowSelection<DemoRow> = {
  type: 'checkbox',
  getCheckboxProps: (record) => ({ disabled: record.disabled }),
}
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

## 受控模式

```ts
const selectedRowKeys = ref<Key[]>([1, 3])

const rowSelection = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))
```

## 树形联动

当 `checkStrictly` 为 `false` 时，选择会在父子节点之间联动：

- 选中所有子节点后，父节点会自动变成选中。
- 只选中部分子节点时，父节点会显示为半选。
- 点击父节点会递归切换整棵子树。

## 扩展项

- `type: 'radio'`：单选模式。
- `selections: true | SelectionItem[]`：开启默认批量选择菜单，或提供自定义菜单项。
- `hideSelectAll`：隐藏表头全选。
- `preserveSelectedRowKeys`：在数据裁剪或分页场景下保留已选 key。

## 对照示例来源

- playground 入口：`playground/src/pages/SelectionPage.vue`
- 当前测试覆盖：`packages/table/src/composables/useSelection.test.ts`

<PlaygroundDemo
  title="行选择对照页"
  route="/selection"
  note="这一页覆盖 checkbox、radio、受控 selectedRowKeys、自定义 selections 和保留 key 等能力。"
  :height="560"
/>
