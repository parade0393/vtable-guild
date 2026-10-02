<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type RowSelection } from '@vtable-guild/vtable-guild'
const columns = [
  { key: 'key', dataIndex: 'key', title: 'ID', width: 80 },
  { key: 'name', dataIndex: 'name', title: 'Name' },
]
const data = Array.from({ length: 87 }, (_, i) => ({ key: i + 1, name: `Record ${i + 1}` }))
const selectedCount = ref(0)
const rowSelection: RowSelection<(typeof data)[number]> = {
  selections: true,
  onChange: (keys) => {
    selectedCount.value = keys.length
  },
}
</script>

<template>
  <p>表头复选框选择当页；选择菜单支持全选所有、反选当页和清空所有。</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="data"
    :pagination="{}"
    :row-selection="rowSelection"
  />
  <p role="status" aria-live="polite">已选 {{ selectedCount }} 条</p>
</template>
