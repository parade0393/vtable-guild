# 行选择

rowSelection 用来开启行选择列，并统一管理单选、多选、全选、自定义批量选择和树形联动行为。

如果你的页面有“批量操作”“勾选后侧边编辑”“按选中项导出”这类需求，这一组能力会是高频入口。

## 基础多选

```vue
<script setup lang="ts">
import { VTable, type ColumnsType, type RowSelection } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  disabled?: boolean
}

const columns: ColumnsType<UserRow> = [{ title: '姓名', dataIndex: 'name', key: 'name' }]

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

## 树形数据联动

当 checkStrictly 为 false 时，父子节点会联动：

- 选中所有子节点后，父节点自动选中。
- 只选中部分子节点时，父节点显示为半选。
- 点击父节点会递归切换整棵子树。

如果你的业务更强调“每一行独立选择”，把 checkStrictly 保持为 true 会更清晰。

## 使用建议

- 需要长期保留选中结果时，使用 preserveSelectedRowKeys。
- 如果某些行不可操作，优先通过 getCheckboxProps 禁用，而不是在点击后再回滚状态。
- 树形联动适合权限树、组织架构和分组数据，不适合每行语义完全独立的表格。

## 相关页面

- [树形表格](/guide/tree-table)
- [API Reference](/guide/api-reference)
