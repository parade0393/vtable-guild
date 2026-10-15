# 排序

排序能力围绕这几个字段展开：sorter、sortOrder、defaultSortOrder 和 sortDirections。

如果你来自 ant-design-vue，这套写法会比较熟悉。区别在于 vtable-guild 更强调直接可用的列排序能力，并把排序结果统一收敛到 change 事件里。

## 在线示例

单列、多列、自定义比较函数在同一张表里。点击表头切换排序，按住 Shift 叠加多列。

<Demo src="sorting/basic">

<<< @/demos/sorting/basic.vue

</Demo>

## 你可以怎么开启排序

- sorter: true，使用默认比较规则。数字按数值排序，其他值按字符串比较。
- `sorter: (a: TRecord, b: TRecord) => number`，使用自定义比较函数；`TRecord` 是行数据类型。
- sorter: { multiple: number }，启用多列排序并指定优先级。
- defaultSortOrder，在首次渲染时设置默认排序方向。
- sortOrder，进入受控模式，由外部状态决定当前排序方向。

## 最常见的写法

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  score: number
}

const columns: TableColumnsType<ScoreRow> = [
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
import type { SortOrder, TableColumnsType, VTableEventProps } from '@vtable-guild/vtable-guild'

const scoreOrder = ref<SortOrder>('ascend')

const columns = computed<TableColumnsType<ScoreRow>>(() => [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '分数',
    dataIndex: 'score',
    key: 'score',
    sorter: true,
    sortOrder: scoreOrder.value,
  },
])

const handleChange: NonNullable<VTableEventProps<ScoreRow>['onChange']> = (_filters, sorter) => {
  const results = Array.isArray(sorter) ? sorter : [sorter]
  scoreOrder.value = results.find((result) => result.columnKey === 'score')?.order ?? null
}
```

沿用上面的 `ScoreRow`，再给表格绑定 `@change="handleChange"`。`VTableEventProps<ScoreRow>['onChange']` 提供完整事件参数类型，`NonNullable` 去掉可选事件属性的 `undefined`。单列结果是对象，多列结果是数组，读取前用 `Array.isArray` 收窄。在受控模式下，是否更新 `sortOrder` 由你自己决定。

## 多列排序

当多个字段都需要参与排序时，使用 multiple 指定优先级。数值越大，优先级越高。

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface TeamScoreRow {
  key: string
  age: number
  team: string
  score: number
}

const columns: TableColumnsType<TeamScoreRow> = [
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
- [类型参考](/guide/type-reference)

## Type Declarations

`TRecord` 表示业务行类型。以下声明覆盖列排序配置和 `change` 事件。列配置为相关字段节选；`SortingColumnFields` 是文档辅助接口，不是包导出，完整声明和导入方式见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#SortOrder

<<< @/.vitepress/type-declarations/table.ts#SorterFn

<<< @/.vitepress/type-declarations/table.ts#ColumnSorterObject

<<< @/.vitepress/type-declarations/table.ts#ColumnSorter

<<< @/.vitepress/type-declarations/features.ts#SortingColumnFields

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::
