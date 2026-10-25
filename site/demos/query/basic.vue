<script setup lang="ts">
import { ref } from 'vue'
import {
  VTable,
  useTableQuery,
  useTableRequest,
  type TableColumnsType,
} from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
  age: number
}
interface Values {
  keyword: string
  ageRange: { min: string; max: string }
}
interface Params {
  keyword: string
  minAge: number
  maxAge: number
}
const requests = ref(0)
const rows: Row[] = [
  { key: 1, name: '陈嘉', age: 24 },
  { key: 2, name: '苏晚', age: 31 },
  { key: 3, name: '周野', age: 28 },
  { key: 4, name: '林溪', age: 36 },
]
const columns: TableColumnsType<Row> = [
  { key: 'name', dataIndex: 'name', title: '姓名' },
  { key: 'age', dataIndex: 'age', title: '年龄' },
]
const table = useTableRequest<Row, Params>({
  manualRequest: true,
  initialPagination: { pageSize: 2 },
  async request(params) {
    requests.value++
    const filtered = rows.filter(
      (row) =>
        (!params.keyword || row.name.includes(params.keyword)) &&
        (params.minAge === undefined || row.age >= params.minAge) &&
        (params.maxAge === undefined || row.age <= params.maxAge),
    )
    const start = (params.current - 1) * params.pageSize
    return { data: filtered.slice(start, start + params.pageSize), total: filtered.length }
  },
})
const { dataSource, pagination, loading, manual, onChange } = table
const { draft, collapsed, params, error, submit, reset, resetFields, toggleCollapsed } =
  useTableQuery<Values, Params>({
    defaultValues: { keyword: '', ageRange: { min: '', max: '' } },
    fieldTransforms: {
      ageRange: ({ min, max }) => ({
        minAge: min === '' ? undefined : Number(min),
        maxAge: max === '' ? undefined : Number(max),
      }),
    },
    transform: (values) => ({ ...values, keyword: values.keyword?.trim() }),
    onSubmit: (values) => table.submit(values),
    onReset: (values) => table.reset(values),
  })
void submit()
</script>

<template>
  <form class="query-form" @submit.prevent="submit()">
    <label>姓名 <input v-model="draft.keyword" type="search" placeholder="输入后点击查询" /></label>
    <template v-if="!collapsed">
      <label>最小年龄 <input v-model="draft.ageRange.min" type="number" min="0" /></label>
      <label>最大年龄 <input v-model="draft.ageRange.max" type="number" min="0" /></label>
    </template>
    <button type="submit">查询</button>
    <button type="button" @click="reset()">重置并查询</button>
    <button type="button" @click="resetFields()">仅还原草稿</button>
    <button type="button" :aria-expanded="!collapsed" @click="toggleCollapsed()">
      {{ collapsed ? '展开' : '收起' }}
    </button>
  </form>
  <p role="status">请求 {{ requests }} 次；已提交参数：{{ JSON.stringify(params) }}</p>
  <p v-if="error" role="alert">{{ error.message }}</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :pagination="pagination"
    :loading="loading"
    :manual="manual"
    @change="onChange"
  />
</template>

<style scoped>
.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
