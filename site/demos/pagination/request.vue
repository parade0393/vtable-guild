<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  VTableToolbar,
  useTableRequest,
  type TableColumnsType,
} from '@vtable-guild/vtable-guild'

type Row = { key: number; name: string; enabled: boolean }
type Query = { keyword: string }
const keyword = ref('')
const requests = ref(0)
const records: Row[] = Array.from({ length: 48 }, (_, index) => ({
  key: index + 1,
  name: `Member ${String(index + 1).padStart(2, '0')}`,
  enabled: index % 3 !== 0,
}))

const {
  dataSource,
  pagination,
  loading,
  error,
  manual,
  sort,
  filters,
  onChange,
  submit,
  reload,
  reset,
} = useTableRequest<Row, Query>({
  defaultParams: { keyword: '' },
  initialPagination: { pageSize: 5 },
  pagination: { showSizeChanger: true, pageSizeOptions: [5, 10, 20] },
  async request(params, sorting, filtering, { signal }) {
    requests.value++
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer)
        reject(new Error('Cancelled'))
      }
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', cancel)
        resolve()
      }, 250)
      signal.addEventListener('abort', cancel, { once: true })
    })
    let rows = records.filter((record) => record.name.includes(params.keyword ?? ''))
    const enabled = filtering.enabled
    if (enabled?.length) rows = rows.filter((record) => enabled.includes(record.enabled))
    if (sorting.name) {
      rows = [...rows].sort((a, b) =>
        sorting.name === 'ascend' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      )
    }
    const start = (params.current - 1) * params.pageSize
    return { data: rows.slice(start, start + params.pageSize), total: rows.length }
  },
})

const columns = computed<TableColumnsType<Row>>(() => [
  {
    key: 'name',
    dataIndex: 'name',
    title: 'Name',
    sorter: true,
    sortOrder: sort.value.name ?? null,
  },
  {
    key: 'enabled',
    dataIndex: 'enabled',
    title: 'Status',
    filters: [
      { text: 'Enabled', value: true },
      { text: 'Disabled', value: false },
    ],
    filteredValue: filters.value.enabled ?? null,
    customRender: ({ text }) => (text ? 'Enabled' : 'Disabled'),
  },
])

function resetQuery() {
  keyword.value = ''
  void reset()
}
</script>

<template>
  <form @submit.prevent="submit({ keyword })">
    <label>
      Name
      <input v-model="keyword" type="search" placeholder="Member 01" />
    </label>
    <button type="submit">Search</button>
    <button type="button" @click="resetQuery">Reset</button>
  </form>
  <p role="status">Requests: {{ requests }} · Loading: {{ loading }}</p>
  <p v-if="error" role="alert">{{ error.message }}</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :pagination="pagination"
    :loading="loading"
    :manual="manual"
    @change="onChange"
  >
    <template #title>
      <VTableToolbar title="Remote members" :loading="loading" @reload="reload" />
    </template>
  </VTable>
</template>
