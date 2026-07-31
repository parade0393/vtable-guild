<script setup lang="ts">
import { computed } from 'vue'
import { VTable, VTableSummary } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface DeptRow {
  key: string
  dept: string
  headcount: number
  budget: number
  used: number
}

const columns: TableColumnsType<DeptRow> = [
  { title: '部门', dataIndex: 'dept', key: 'dept' },
  { title: '人数', dataIndex: 'headcount', key: 'headcount', align: 'right' },
  {
    title: '预算',
    dataIndex: 'budget',
    key: 'budget',
    align: 'right',
    customRender: ({ text }) => `¥ ${Number(text).toLocaleString()}`,
  },
  {
    title: '已支出',
    dataIndex: 'used',
    key: 'used',
    align: 'right',
    customRender: ({ text }) => `¥ ${Number(text).toLocaleString()}`,
  },
]

const dataSource: DeptRow[] = [
  { key: '1', dept: '平台组', headcount: 24, budget: 1200000, used: 864000 },
  { key: '2', dept: '交易组', headcount: 41, budget: 2050000, used: 1710500 },
  { key: '3', dept: '设计系统', headcount: 6, budget: 300000, used: 182000 },
  { key: '4', dept: '质量保障', headcount: 21, budget: 940000, used: 733000 },
]

const total = computed(() =>
  dataSource.reduce(
    (acc, row) => ({
      headcount: acc.headcount + row.headcount,
      budget: acc.budget + row.budget,
      used: acc.used + row.used,
    }),
    { headcount: 0, budget: 0, used: 0 },
  ),
)

const money = (value: number) => `¥ ${value.toLocaleString()}`
</script>

<template>
  <VTable
    row-key="key"
    bordered
    :columns="columns"
    :data-source="dataSource"
    :title="() => '2026 财年部门预算执行'"
    :footer="() => '口径：含外包成本，不含办公场地分摊'"
  >
    <!-- Summary 的 index 对应列下标，align 单独控制摘要单元格对齐 -->
    <template #summary>
      <VTableSummary>
        <VTableSummary.Row>
          <VTableSummary.Cell :index="0">合计</VTableSummary.Cell>
          <VTableSummary.Cell :index="1" align="right">{{ total.headcount }}</VTableSummary.Cell>
          <VTableSummary.Cell :index="2" align="right">{{
            money(total.budget)
          }}</VTableSummary.Cell>
          <VTableSummary.Cell :index="3" align="right">{{ money(total.used) }}</VTableSummary.Cell>
        </VTableSummary.Row>
      </VTableSummary>
    </template>
  </VTable>
</template>
