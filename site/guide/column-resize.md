# 列宽拖拽

列宽拖拽适合那些“字段很多、内容长度差异大、用户希望现场微调布局”的业务表格。

如果你来自 ant-design-vue，这套列宽控制心智并不陌生。vtable-guild 保留了 resizable、minWidth、maxWidth 这组常用字段，并把它作为更直接的内建能力提供。

## 怎么开启

在列上设置 resizable: true，并为可拖拽列提供 width。需要限制范围时，再补上 minWidth 和 maxWidth。

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: ColumnsType<UserRow> = [
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

## 当前行为

- 只有 resizable: true 的列会显示拖拽手柄。
- 拖拽过程中会实时更新列宽。
- 拖拽结束时会触发 resizeColumn 事件，参数顺序为 (column, width)，便于你把宽度持久化到页面状态或用户偏好里。
- 未显式设置 minWidth 时，默认下限是 50。

## 推荐做法

- 尽量给可拖拽列提供初始 width，这样拖拽反馈更稳定。
- 内容长度差异特别大的字段，建议同时设置 minWidth 和 maxWidth。
- 如果表格还有固定列，优先让固定列宽度保持稳定，再把中间内容列设为可拖拽。

## 适合什么场景

- 运维后台和数据看板里字段很多的表格。
- 用户希望自己微调列宽后持续使用相同布局。
- 原来只能靠 CSS 或第三方拖拽库硬拼宽度调整的页面。

## 相关页面

- [固定列](/guide/fixed-columns)
- [功能对比总览](/comparison/)
