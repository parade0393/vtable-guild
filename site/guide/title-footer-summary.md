# 标题、页脚与摘要行

这一组能力用于在表格上下补充结构化信息。

它们的分工可以简单理解为：

- title 负责表格上方的信息。
- footer 负责表格下方的补充说明。
- summary 负责和数据本身强相关的汇总行。

## 基础示例

```vue
<script setup lang="ts">
import { VTable } from '@vtable-guild/vtable-guild'

const totalScore = dataSource.reduce((sum, row) => sum + row.score, 0)
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :title="() => '部门绩效总览'"
    :footer="() => '数据更新时间：今天 09:30'"
  >
    <template #summary>
      <VTable.Summary>
        <VTable.Summary.Row>
          <VTable.Summary.Cell :index="0">合计</VTable.Summary.Cell>
          <VTable.Summary.Cell :index="1" align="right">{{ totalScore }}</VTable.Summary.Cell>
        </VTable.Summary.Row>
      </VTable.Summary>
    </template>
  </VTable>
</template>
```

## 什么时候用哪一个

- title 适合标题、统计摘要、筛选说明、批量操作提示。
- footer 适合说明文字、更新时间、口径备注。
- summary 适合金额合计、平均值、总数和选中项汇总。

## 使用建议

- 只是放一段说明文字时，优先用 title 或 footer，不要把它塞进 summary。
- summary 更适合表现和当前数据直接相关的结果，而不是通用描述。
- 如果你已经在页面外层有完整卡片头部，表格 title 可以只承载局部状态信息。

## 相关页面

- [多级表头与单元格合并](/guide/grouped-and-merged-cells)
- [自定义行与插槽](/guide/api-wiring-and-slots)
