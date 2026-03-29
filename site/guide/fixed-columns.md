# 固定列

固定列依赖两部分一起工作：一是 `scroll.x` 提供横向滚动容器，二是列上的 `fixed: 'left' | 'right'` 决定粘性位置。当前实现还会根据滚动位置附加左右阴影，用来提示还有内容被遮挡。

## 基础配置

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  age: number
  status: string
  address: string
}

const columns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 220, fixed: 'right' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :scroll="{ x: 720 }" />
</template>
```

## 组合场景

- 只固定列：设置 `scroll.x`，适合列较多但数据量不大的宽表。
- 固定列 + 固定表头：同时设置 `scroll.x` 和 `scroll.y`。
- 固定列 + 选择列 / 展开列：选择列和展开列都支持固定到左侧或右侧，会一起参与 offset 计算。

## 当前行为约定

- 固定列使用 `position: sticky`，因此列宽需要稳定，建议为固定列显式声明 `width`。
- 当表格尚未滚动到一侧边界时，对应固定列会显示阴影；滚动到边界后阴影会被隐藏。
- 如果表头分组和固定列一起使用，建议保持 `tableLayout="fixed"` 或提供明确的列宽。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 当前测试覆盖：packages/table/src/components/VTable.test.ts、packages/table/src/composables/useScroll.test.ts

<PlaygroundDemo
  title="固定列与固定表头对照页"
  route="/advanced"
  note="该页包含左右固定列、scroll.y 固定表头，以及固定列与滚动联动的阴影效果。"
  :height="760"
/>
