# 排序

排序能力由 `sorter`、`sortOrder`、`defaultSortOrder` 和 `sortDirections` 组合完成，对齐的是常见 Vue 表格里的两类模式：组件内部管理状态，以及外部完全受控。

## 支持的方式

- `sorter: true`：使用默认比较，数字按数值、其他值按字符串比较。
- `sorter: (a, b) => number`：使用自定义比较函数。
- `sorter: { multiple: number }`：启用多列排序，并按 `multiple` 权重排序。
- `defaultSortOrder`：初始化时设置一次默认排序。
- `sortOrder`：受控模式，由外部状态决定当前排序方向。

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  score: number
}

const columns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Score', dataIndex: 'score', key: 'score', align: 'right', sorter: true },
]

const dataSource: DemoRow[] = [
  { key: '1', name: 'Charlie', score: 80 },
  { key: '2', name: 'Alice', score: 95 },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## 受控排序

```ts
const controlledOrder = ref<SortOrder>('ascend')

const columns = computed(() => [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    sorter: true,
    sortOrder: controlledOrder.value,
  },
])
```

这种模式下，点击表头后组件会通过 `change` 事件返回新的 sorter 结果，外部再决定是否更新 `sortOrder`。

## 多列排序

```ts
const columns = [
  { title: 'Age', dataIndex: 'age', key: 'age', sorter: { multiple: 1 } },
  { title: 'Score', dataIndex: 'score', key: 'score', sorter: { multiple: 3 } },
  { title: 'Team', dataIndex: 'team', key: 'team', sorter: { multiple: 2 } },
]
```

权重越大，优先级越高。当前内部排序顺序是先筛选、再排序，因此多列排序会基于已筛选后的数据集运行。

## 对照示例来源

- playground 入口：`playground/src/pages/SortPage.vue`
- 当前测试覆盖：`packages/table/src/composables/useSorter.test.ts`、`packages/table/src/components/VTable.test.ts`

<PlaygroundDemo
  title="排序能力对照页"
  route="/sort"
  note="这个页面覆盖基础单列排序、自定义比较器、默认排序、受控排序和多列排序。"
  :height="520"
/>
