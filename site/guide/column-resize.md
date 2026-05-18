# 列宽拖拽

列宽拖拽适合字段很多、内容长短差异大、用户希望现场微调布局的业务表格。它延续了接近 ant-design-vue 的字段心智，但作为内建能力提供。

## 基础示例

在列上设置 `resizable: true`，并为可拖拽列提供 `width`。需要限制范围时，再补上 `minWidth` 和 `maxWidth`。

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180, resizable: true, minWidth: 120 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, resizable: true, maxWidth: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140, resizable: true },
]
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    @resize-column="handleResize"
  />
</template>
```

## 关键行为

- 只有 `resizable: true` 的列会显示拖拽手柄
- 拖拽过程中会实时更新列宽
- 拖拽结束时会触发 `resizeColumn` 事件，参数顺序为 `(column, width)`
- 未显式设置 `minWidth` 时，默认下限是 `50`

## 什么时候用

- 运维后台、报表页面或数据看板里字段很多
- 用户希望自己微调列宽，并把宽度持久化
- 你原本只能靠 CSS 或第三方拖拽库去拼列宽调整

## 相关页面

- [固定列](/guide/fixed-columns)
- [功能对比总览](/comparison/)
