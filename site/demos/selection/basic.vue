<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { Key, RowSelection, TableColumnsType } from '@vtable-guild/vtable-guild'

interface MemberRow {
  key: string
  name: string
  role: string
  seat: string
  locked: boolean
}

const columns: TableColumnsType<MemberRow> = [
  { title: '成员', dataIndex: 'name', key: 'name' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '工位', dataIndex: 'seat', key: 'seat' },
]

const dataSource: MemberRow[] = [
  { key: '1', name: '陈嘉', role: '前端', seat: 'A-12', locked: false },
  { key: '2', name: '林悦', role: '后端', seat: 'A-15', locked: false },
  { key: '3', name: '周野', role: '设计', seat: 'B-03', locked: true },
  { key: '4', name: '苏晚', role: '前端', seat: 'B-07', locked: false },
  { key: '5', name: '何川', role: '测试', seat: 'C-01', locked: false },
]

const selectedRowKeys = ref<Key[]>(['1'])

const rowSelection = computed<RowSelection<MemberRow>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => (selectedRowKeys.value = keys),
  // getCheckboxProps 控制单行是否可选
  getCheckboxProps: (record) => ({ disabled: record.locked }),
  // selections: true 展示「全选 / 反选 / 清空」下拉；也可以传数组混入自定义项
  selections: [
    VTable.SELECTION_ALL,
    VTable.SELECTION_INVERT,
    VTable.SELECTION_NONE,
    {
      key: 'frontend',
      text: '只选前端',
      onSelect: () => {
        selectedRowKeys.value = dataSource
          .filter((row) => row.role === '前端' && !row.locked)
          .map((row) => row.key)
      },
    },
  ],
}))
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :row-selection="rowSelection"
  />
  <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
    已选 {{ selectedRowKeys.length }} 项：{{ selectedRowKeys.join('、') || '无' }}（周野一行被
    getCheckboxProps 禁用）
  </p>
</template>
