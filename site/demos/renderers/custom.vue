<script setup lang="ts">
import { h } from 'vue'
import { VTable, createTableRenderers, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  department: string
}

const renderers = createTableRenderers<Member>({
  memberLink: ({ record, displayValue, fieldProps }) => ({
    children: h('a', { href: `/members/${record.key}` }, String(displayValue)),
    tooltipText: String(fieldProps.tooltip ?? record.name),
  }),
})

const columns: TableColumnsType<Member> = [
  {
    dataIndex: 'name',
    title: '成员',
    valueType: 'memberLink',
    fieldProps: ({ record }) => ({ tooltip: `查看 ${record.name} 的成员资料` }),
    ellipsis: true,
    width: 240,
  },
  { dataIndex: 'department', title: '部门' },
]

const rows: Member[] = [
  { key: 1, name: '林明', department: '产品部' },
  { key: 2, name: '跨区域企业客户服务与技术支持项目负责人陈思远', department: '客户服务部' },
]
</script>

<template>
  <VTable :columns="columns" :data-source="rows" :renderers="renderers" row-key="key" />
  <p>成员名称被截断时，悬停链接查看自定义提示。</p>
</template>
