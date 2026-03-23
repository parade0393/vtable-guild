<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/table'

interface DemoRow {
  id: string
  name: string
  age: number
  active: boolean
}

const rows: DemoRow[] = [
  { id: '1', name: 'Ada', age: 32, active: true },
  { id: '2', name: 'Linus', age: 35, active: false },
]

const columns: ColumnsType<DemoRow> = [
  { key: 'name', dataIndex: 'name', title: 'Name' },
  { key: 'age', dataIndex: 'age', title: 'Age' },
]

function expectRow(row: DemoRow) {
  return row
}

function expectRows(data: DemoRow[]) {
  return data
}

const rowSelection = {
  onSelect(record: DemoRow, selected: boolean, selectedRows: DemoRow[]) {
    expectRow(record)
    expectRows(selectedRows)
    return selected
  },
}
</script>

<template>
  <VTable :data-source="rows" :columns="columns" :row-selection="rowSelection">
    <template #bodyCell="{ record }">
      {{ expectRow(record).name }}
    </template>
    <template #title="{ data }">
      {{ expectRows(data).length }}
    </template>
    <template #footer="{ data }">
      {{ expectRows(data).length }}
    </template>
  </VTable>
</template>
