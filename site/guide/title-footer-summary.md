# 标题、页脚与摘要行

这组能力用于在表格上下补充结构化信息。它们的分工可以简单理解为：

- `title`
  表格上方的信息区
- `footer`
  表格下方的补充说明
- `summary`
  和当前数据直接相关的汇总行

## 在线示例

<Demo src="title-footer-summary/basic">

<<< @/demos/title-footer-summary/basic.vue

</Demo>

## 基础示例

摘要行组件从 `VTableSummary` 导入，`Row` / `Cell` 挂在它上面。`Cell` 的 `index` 对应列下标。

```vue
<script setup lang="ts">
import {
  VTable,
  VTableSummary,
  type TableColumnsType,
  type TableProps,
} from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  score: number
}

const columns: TableColumnsType<ScoreRow> = [
  { title: '姓名', key: 'name', dataIndex: 'name' },
  { title: '分数', key: 'score', dataIndex: 'score', align: 'right' },
]
const dataSource: ScoreRow[] = [
  { key: '1', name: 'Ada', score: 95 },
  { key: '2', name: 'Grace', score: 92 },
]

const totalScore = dataSource.reduce((sum, row) => sum + row.score, 0)
const title: NonNullable<TableProps<ScoreRow>['title']> = (data) =>
  `部门绩效总览 · ${data.length} 人`
const footer: NonNullable<TableProps<ScoreRow>['footer']> = () => '数据更新时间：今天 09:30'
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :title="title"
    :footer="footer"
  >
    <template #summary>
      <VTableSummary>
        <VTableSummary.Row>
          <VTableSummary.Cell :index="0">合计</VTableSummary.Cell>
          <VTableSummary.Cell :index="1" align="right">{{ totalScore }}</VTableSummary.Cell>
        </VTableSummary.Row>
      </VTableSummary>
    </template>
  </VTable>
</template>
```

`title` / `footer` 的函数签名都是 `(data: TRecord[]) => VNodeChild`；分页开启时接收当前页展示数据。对应的 `#title` / `#footer` 插槽接收 `{ data: TRecord[] }`，而 `#summary` 不提供参数。`VNodeChild` 是 Vue 的可渲染内容类型。

## 什么时候用哪一个

- `title`
  标题、统计摘要、筛选说明、批量操作提示
- `footer`
  说明文字、更新时间、口径备注
- `summary`
  金额合计、平均值、总数和选中项汇总

## 使用边界

- 只是放一段说明文字时，优先用 `title` 或 `footer`
- `summary` 更适合表达和当前数据直接相关的结果，而不是通用描述
- 如果页面外层已经有完整卡片头部，表格 `title` 可以只承载局部状态信息

## 相关页面

- [多级表头与单元格合并](/guide/grouped-and-merged-cells)
- [自定义行与插槽](/guide/api-wiring-and-slots)

## Type Declarations

`title` / `footer` 的函数声明属于 `TableProps<TRecord>`，插槽参数使用 `TableDataSlotProps<TRecord>`。props 为相关字段节选；`TitleFooterFields`、`VTableSummaryProps` 和 `VTableSummaryCellProps` 是文档辅助接口，不是包导出。`VTableSummary.Row` 没有自定义 props，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#TitleFooterFields

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

:::
