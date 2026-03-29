# 标题、页脚与摘要行

这一组能力主要覆盖表格上下附加信息的渲染：`title` 适合放概览信息，`footer` 适合放补充说明，`summary` 适合在表尾输出汇总值或统计结果。

## 基础用法

```vue
<script setup lang="ts">
import { h } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'

const totalScore = dataSource.reduce((sum, row) => sum + row.score, 0)
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :title="() => 'Table Title'"
    :footer="() => 'Table Footer'"
  >
    <template #summary>
      <VTable.Summary>
        <VTable.Summary.Row>
          <VTable.Summary.Cell :index="0">Total</VTable.Summary.Cell>
          <VTable.Summary.Cell :index="1" align="right">{{ totalScore }}</VTable.Summary.Cell>
        </VTable.Summary.Row>
      </VTable.Summary>
    </template>
  </VTable>
</template>
```

## 适用场景

- `title`：表格顶部的标题、筛选摘要、批量操作说明。
- `footer`：底部补充描述、分页说明、数据更新时间。
- `summary`：金额合计、平均值、统计数、选中项总计。

## 当前实现约定

- `title` 和 `footer` 通过 props 渲染，适合简单文本或函数返回节点。
- `summary` 通过 slot 渲染，适合更复杂的表格结构。
- 摘要行使用独立主题 slot，因此可以和普通 body row 保持不同视觉层级。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 相关实现：packages/table/src/components/VTableSummary.tsx

<PlaygroundDemo
  title="标题、页脚与摘要行对照页"
  route="/advanced"
  note="Advanced 页面中的 Case 04 覆盖 title、footer props 以及 summary slot 的组合用法。"
  :height="760"
/>
