# 筛选

筛选能力由列上的 filters、onFilter、filteredValue、defaultFilteredValue 以及筛选面板配置共同组成。

对使用者来说，最重要的是先区分两种模式：一类是组件内部维护状态，另一类是页面外部完全受控。

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  status: 'active' | 'paused'
}

const columns: ColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada', status: 'active' },
  { key: '2', name: 'Grace', status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## 受控与非受控

- defaultFilteredValue 只在首次渲染时生效，适合简单默认筛选。
- filteredValue 表示当前列进入受控模式，筛选状态完全由外部管理。
- filterResetToDefaultFilteredValue 用于控制“重置”后是否回到默认值，而不是直接清空。

## 筛选组合规则

- 同一列里选中多个值时，是 OR 关系。
- 不同列之间是 AND 关系。
- change 事件会返回当前所有列的 filters 快照，适合做查询条件同步。

## 自定义筛选面板

如果默认筛选面板不够用，可以选择两种扩展方式：

- customFilterDropdown，走表级插槽统一接管。
- filterDropdown，在单列上直接定义自定义面板。

除此之外，你还可以使用：

- filterSearch，为筛选项增加搜索能力。
- filterMode: 'tree'，把筛选项渲染成树形结构。

## 什么时候用受控模式

以下场景建议直接用 filteredValue：

- 筛选条件需要同步到 URL。
- 页面查询由接口驱动，表格只负责展示当前结果。
- 多个筛选控件之间需要互相联动。

## 相关页面

- [排序](/guide/sorting)
- [API Reference](/guide/api-reference)
