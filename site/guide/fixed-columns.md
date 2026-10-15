# 固定列

固定列适合字段很多、横向滚动明显的宽表。它依赖两部分同时成立：

- 表格提供 `scroll.x`，形成横向滚动区
- 需要固定的列声明 `fixed: 'left'` 或 `fixed: 'right'`；`fixed: true` 是 `fixed: 'left'` 的简写（与 ant-design-vue 对齐）

## 在线示例

九列宽表，左侧两列与右侧「状态」列固定。横向拖动滚动条看固定效果与阴影。

<Demo src="fixed-columns/basic">

<<< @/demos/fixed-columns/basic.vue

</Demo>

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
  address: string
}

const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, align: 'right' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '地址', dataIndex: 'address', key: 'address', width: 220, fixed: 'right' },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada', age: 28, status: 'Active', address: 'Shanghai' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :scroll="{ x: 720 }" />
</template>
```

## 常见组合

- 固定列 + 横向滚动
- 固定列 + 固定表头
- 固定列 + 行选择 / 展开列

## 关键边界

- 固定列最好显式提供 `width`，否则 `sticky` 布局更容易出现错位
- 如果还有多级表头，建议保持列宽稳定，必要时使用 `tableLayout="fixed"`
- 固定列和列宽拖拽可以组合，但优先保证固定列的宽度边界稳定

## 什么时候用

- 用户需要一边横向滚动，一边保留关键主列
- 表格同时存在状态列、操作列和大量内容列
- 页面不适合拆成多张表，但横向信息量很高

## 相关页面

- [列宽拖拽](/guide/column-resize)
- [虚拟滚动](/guide/virtualization)

## Type Declarations

固定列使用 `ColumnType<TRecord>['fixed']`，滚动和粘性配置属于 `TableProps<TRecord>`。props / 列配置为相关字段节选；`FixedColumnFields` 和 `ScrollFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#FixedColumnFields

<<< @/.vitepress/type-declarations/table.ts#TableLayout

<<< @/.vitepress/type-declarations/table.ts#TableSticky

<<< @/.vitepress/type-declarations/features.ts#ScrollFields

:::
