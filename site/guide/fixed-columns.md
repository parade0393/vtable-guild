# 固定列

固定列适合字段很多、横向滚动明显的宽表。它依赖两部分同时成立：

- 表格提供 scroll.x，形成横向滚动区。
- 需要固定的列声明 fixed: 'left' 或 fixed: 'right'。

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
  address: string
}

const columns: ColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, align: 'right' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '地址', dataIndex: 'address', key: 'address', width: 220, fixed: 'right' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :scroll="{ x: 720 }" />
</template>
```

## 常见组合

- 固定列 + 横向滚动，适合字段多但行数不算特别大的宽表。
- 固定列 + 固定表头，同时设置 scroll.x 和 scroll.y。
- 固定列 + 行选择 / 展开列，适合业务后台常见的操作型表格。

## 使用建议

- 固定列最好显式提供 width，否则 sticky 布局更容易出现错位。
- 如果还有多级表头，建议保持列宽稳定，必要时使用 tableLayout="fixed"。
- 固定列和列宽拖拽可以组合，但优先保证固定列的宽度边界更稳定。

## 什么时候需要它

- 用户需要一边横向滚动，一边保留关键主列。
- 表格同时存在状态列、操作列和大量内容列。
- 页面不适合拆成多张表，但横向信息量又很高。

## 相关页面

- [列宽拖拽](/guide/column-resize)
- [虚拟滚动](/guide/virtualization)
