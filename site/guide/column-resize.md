# 列宽拖拽

列宽拖拽用于处理宽表里的人工微调场景。当前实现通过列配置上的 `resizable` 开启拖拽能力，并结合 `minWidth`、`maxWidth` 约束控制可调整范围。

## 基础用法

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170, resizable: true, minWidth: 120 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, resizable: true, maxWidth: 180 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 130, resizable: true },
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

- 拖拽手柄位于表头单元格右侧，仅 `resizable: true` 的列会显示。
- 拖拽过程中会实时更新列宽，并在 `pointerup` 后触发 `resizeColumn` 事件。
- 未设置最小宽度时默认下限是 `50`。
- 如果没有显式 `key`，内部会回退到 `dataIndex` 或列索引作为宽度记录键值。

## 适用建议

- 对允许拖拽的列尽量提供初始 `width`，这样拖拽体验更稳定。
- 如果列内容有明显最小可读宽度，建议同步设置 `minWidth`。
- 和固定列一起使用时，优先保证固定列宽度稳定，再让中间列参与拖拽。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 当前测试覆盖：packages/table/src/composables/useResize.test.ts

<PlaygroundDemo
  title="列宽拖拽对照页"
  route="/advanced"
  note="Advanced 页面中的 Case 05 演示了列宽拖拽和 resizeColumn 事件触发。"
  :height="760"
/>
