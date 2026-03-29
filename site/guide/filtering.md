# 筛选

筛选能力由列上的 `filters`、`onFilter`、`filteredValue`、`defaultFilteredValue` 和筛选下拉行为共同组成。当前实现支持菜单模式与树形模式，并且已经覆盖默认值、确认和重置的状态管理测试。

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  status: 'active' | 'paused'
}

const columns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## 状态模式

- `defaultFilteredValue`：只在首次渲染时初始化内部筛选值。
- `filteredValue`：受控模式，由外部完全接管筛选状态。
- `filterResetToDefaultFilteredValue`：重置时恢复默认值，而不是直接清空。

## 组合规则

- 同一列多个筛选值是 OR 关系。
- 不同列之间是 AND 关系。
- `change` 事件返回的 `filters` 快照会带上当前所有列的筛选状态。

## 自定义能力

- `customFilterDropdown`：使用表级 slot 自定义筛选面板。
- `filterDropdown`：直接在列上定义自定义面板。
- `filterSearch`：为筛选项提供搜索。
- `filterMode: 'tree'`：使用树形筛选结构。

## 对照示例来源

- playground 现有筛选能力主要分布在对照页面和综合页面。
- 当前测试覆盖：`packages/table/src/composables/useFilter.test.ts`、`packages/table/src/components/VTable.test.ts`

<PlaygroundDemo
  title="筛选与对照页"
  route="/filter"
  note="当前筛选示例主要集中在对照页和综合页，后续会继续拆成更细的独立 demo。"
  :height="520"
/>
