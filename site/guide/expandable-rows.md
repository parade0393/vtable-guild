# 展开行

展开行适合在不跳转详情页的前提下，直接在当前表格里展示补充信息。

它和树形表格不是同一类能力。树形表格处理的是数据本身有层级；展开行处理的是“当前行需要额外展开一块内容”。

## 基础用法

```vue
<script setup lang="ts">
import { VTable, type ColumnsType, type Expandable } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  role: string
  city: string
}

const columns: ColumnsType<UserRow> = [{ title: '姓名', dataIndex: 'name', key: 'name' }]

const expandable: Expandable<UserRow> = {
  expandRowByClick: true,
  expandedRowRender: (record) => `${record.name} 负责 ${record.role}，所在城市为 ${record.city}`,
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :expandable="expandable" />
</template>
```

## 受控展开

当展开状态要和外部筛选条件、路由状态或其他组件联动时，直接使用 expandedRowKeys。

```ts
import { computed, ref } from 'vue'
import type { Expandable, Key } from '@vtable-guild/vtable-guild'

const expandedRowKeys = ref<Key[]>(['1'])

const expandable = computed<Expandable<UserRow>>(() => ({
  expandedRowKeys: expandedRowKeys.value,
  expandedRowRender: (record) => record.name,
  onExpandedRowsChange: (keys) => {
    expandedRowKeys.value = [...keys]
  },
}))
```

## 常见扩展点

- expandRowByClick，让整行都可点击展开。
- rowExpandable(record)，按业务条件决定哪些行可以展开。
- expandIcon(props)，自定义展开图标。
- showExpandColumn: false，只保留行点击展开，不显示独立展开列。

## 适合什么场景

- 行内详情预览。
- 补充说明、标签、备注信息。
- 不值得单独跳转详情页，但信息又明显超出单元格承载范围的内容。

## 相关页面

- [树形表格](/guide/tree-table)
- [自定义行与插槽](/guide/api-wiring-and-slots)
