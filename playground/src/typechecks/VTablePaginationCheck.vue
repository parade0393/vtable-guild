<script setup lang="ts">
import {
  VTable,
  type ColumnsType,
  type TablePaginationConfig,
  type TablePaginationLayout,
  type TablePaginationSlotProps,
} from '@vtable-guild/vtable-guild'

interface PaginationRow {
  id: number
  name: string
}

const rows: PaginationRow[] = [{ id: 1, name: 'Ada' }]
const columns: ColumnsType<PaginationRow> = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const layout = {
  left: [{ slot: 'selection' }, 'total'],
  right: ['sizes', 'prev', 'pager', 'next', { slot: 'refresh' }],
} as const satisfies TablePaginationLayout
const pagination: TablePaginationConfig = {
  position: ['topLeft', 'bottomRight'],
  layout,
}

function expectPaginationSlot(props: TablePaginationSlotProps) {
  return props
}

function reloadPage(current: number, pageSize: number) {
  return { current, pageSize }
}
</script>

<template>
  <VTable :data-source="rows" :columns="columns" :pagination="pagination" row-key="id">
    <template #paginationItem="slotProps">
      <span v-if="slotProps.name === 'selection'">
        {{ expectPaginationSlot(slotProps).range[0] }}–{{ slotProps.range[1] }} /
        {{ slotProps.total }} ({{ slotProps.pageCount }} pages) {{ slotProps.position }} /
        {{ slotProps.region }}
      </span>
      <button
        v-else-if="slotProps.name === 'refresh'"
        type="button"
        :disabled="slotProps.disabled"
        @click="reloadPage(slotProps.current, slotProps.pageSize)"
      >
        Refresh
      </button>
    </template>
  </VTable>
</template>
