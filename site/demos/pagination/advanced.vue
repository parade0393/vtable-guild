<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { VTable, type TablePaginationConfig } from '@vtable-guild/vtable-guild'
const simple = ref(false)
const disabled = ref(false)
const data = Array.from({ length: 230 }, (_, i) => ({ key: i + 1, name: `Record ${i + 1}` }))
const columns = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const pagination = computed<TablePaginationConfig>(() => ({
  simple: simple.value,
  disabled: disabled.value,
  responsive: true,
  showLessItems: true,
  showQuickJumper: { goButton: 'Go' },
  showSizeChanger: true,
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  itemRender: ({ type, originalElement }) =>
    type === 'prev' ? h('span', '‹') : type === 'next' ? h('span', '›') : originalElement,
}))
</script>

<template>
  <div>
    <label><input v-model="simple" type="checkbox" /> Simple</label>
    <label><input v-model="disabled" type="checkbox" /> Disabled</label>
    <VTable row-key="key" :columns="columns" :data-source="data" :pagination="pagination" />
  </div>
</template>
