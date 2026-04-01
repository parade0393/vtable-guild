# 排序

排序能力围绕这几个字段展开：sorter、sortOrder、defaultSortOrder 和 sortDirections。

如果你来自 ant-design-vue，这套写法会比较熟悉。区别在于 vtable-guild 更强调直接可用的列排序能力，并把排序结果统一收敛到 change 事件里。

## 你可以怎么开启排序

- sorter: true，使用默认比较规则。数字按数值排序，其他值按字符串比较。
- sorter: (a, b) => number，使用自定义比较函数。
- sorter: { multiple: number }，启用多列排序并指定优先级。
- defaultSortOrder，在首次渲染时设置默认排序方向。
- sortOrder，进入受控模式，由外部状态决定当前排序方向。

## 最常见的写法

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  score: number
}

const columns: ColumnsType<ScoreRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '分数',
    dataIndex: 'score',
    key: 'score',
    align: 'right',
    sorter: true,
  },
]

const dataSource: ScoreRow[] = [
  { key: '1', name: 'Charlie', score: 80 },
  { key: '2', name: 'Alice', score: 95 },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## 受控排序

当排序状态需要和页面查询参数、服务端请求或外部状态同步时，使用受控模式更稳。

```ts
import { computed, ref } from 'vue'
import type { SortOrder } from '@vtable-guild/vtable-guild'

const scoreOrder = ref<SortOrder>('ascend')

const columns = computed(() => [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '分数',
    dataIndex: 'score',
    key: 'score',
    sorter: true,
    sortOrder: scoreOrder.value,
  },
])
```

在这种模式下，点击表头后会通过 change 返回新的 sorter 结果，是否更新 sortOrder 由你自己决定。

## 多列排序

当多个字段都需要参与排序时，使用 multiple 指定优先级。数值越大，优先级越高。

```ts
const columns = [
  { title: '年龄', dataIndex: 'age', key: 'age', sorter: { multiple: 1 } },
  { title: '团队', dataIndex: 'team', key: 'team', sorter: { multiple: 2 } },
  { title: '分数', dataIndex: 'score', key: 'score', sorter: { multiple: 3 } },
]
```

## 实际使用建议

- 简单排序优先用 sorter: true，避免为普通数字和字符串字段重复写比较函数。
- 如果页面还有筛选，当前数据处理顺序是先筛选再排序，多列排序会基于筛选后的结果运行。
- 如果你打算和服务端联动，建议从一开始就用受控模式，减少前后端状态不一致的问题。

## 相关页面

- [筛选](/guide/filtering)
- [API Reference](/guide/api-reference)
