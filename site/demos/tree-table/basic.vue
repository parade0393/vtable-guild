<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { Key, RowSelection, TableColumnsType } from '@vtable-guild/vtable-guild'

interface OrgNode {
  key: string
  name: string
  owner: string
  headcount: number
  children?: OrgNode[]
}

const columns: TableColumnsType<OrgNode> = [
  { title: '组织', dataIndex: 'name', key: 'name', width: 260 },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '人数', dataIndex: 'headcount', key: 'headcount', align: 'right' },
]

const treeData: OrgNode[] = [
  {
    key: 'tech',
    name: '技术中心',
    owner: '陈嘉',
    headcount: 86,
    children: [
      {
        key: 'tech-fe',
        name: '前端组',
        owner: '苏晚',
        headcount: 24,
        children: [
          { key: 'tech-fe-ds', name: '设计系统', owner: '周野', headcount: 6 },
          { key: 'tech-fe-biz', name: '业务前端', owner: '何川', headcount: 18 },
        ],
      },
      {
        key: 'tech-be',
        name: '后端组',
        owner: '林悦',
        headcount: 41,
        children: [
          { key: 'tech-be-pay', name: '交易与支付', owner: '罗宇', headcount: 22 },
          { key: 'tech-be-infra', name: '基础设施', owner: '范宁', headcount: 19 },
        ],
      },
      { key: 'tech-qa', name: '质量保障', owner: '祝寒', headcount: 21 },
    ],
  },
  {
    key: 'ops',
    name: '运营中心',
    owner: '钟离',
    headcount: 34,
    children: [
      { key: 'ops-content', name: '内容运营', owner: '尹夏', headcount: 15 },
      { key: 'ops-growth', name: '增长运营', owner: '柏舟', headcount: 19 },
    ],
  },
]

// 受控展开：expandedRowKeys 传入后由外部状态说了算，
// 展开/折叠通过 onExpandedRowsChange 回写（没有 v-model 语法糖）
const expandedRowKeys = ref<Key[]>(['tech', 'tech-fe'])
const selectedRowKeys = ref<Key[]>([])

const rowSelection = computed<RowSelection<OrgNode>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => (selectedRowKeys.value = keys),
  // checkStrictly: true 可断开父子联动
  checkStrictly: false,
}))
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="treeData"
    children-column-name="children"
    :indent-size="20"
    :expanded-row-keys="expandedRowKeys"
    :on-expanded-rows-change="(keys: Key[]) => (expandedRowKeys = keys)"
    :row-selection="rowSelection"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    展开节点 {{ expandedRowKeys.length }} 个；已选 {{ selectedRowKeys.length }} 项（父子联动开启）
  </p>
</template>
