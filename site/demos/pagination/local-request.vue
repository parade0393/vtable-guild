<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import {
  Button,
  VTable,
  useTableRequest,
  type TableColumnsType,
  type TablePaginationConfig,
} from '@vtable-guild/vtable-guild'

type Row = { key: number; name: string; enabled: boolean }
// The docs host provides its language; standalone copies default to Chinese.
const lang = inject('vtg-demo-lang', ref('zh-CN'))
const locale = computed(() => (lang.value.startsWith('en') ? 'en-US' : 'zh-CN'))
const copy = computed(() =>
  locale.value === 'en-US'
    ? {
        intro: 'Load 20 records once. Paging, sorting and filtering stay in the browser.',
        requests: 'Requests',
        loaded: 'Loaded',
        refresh: 'Refresh data',
        name: 'Name',
        member: 'Member',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        total: (count: number) => `${count} matching records`,
      }
    : {
        intro: '首次加载 20 条记录，翻页、排序和筛选均在本地处理。',
        requests: '请求次数',
        loaded: '已加载',
        refresh: '刷新数据',
        name: '姓名',
        member: '成员',
        status: '状态',
        enabled: '启用',
        disabled: '禁用',
        total: (count: number) => `共 ${count} 条匹配记录`,
      },
)
const requests = ref(0)
const records: Row[] = Array.from({ length: 20 }, (_, index) => ({
  key: index + 1,
  name: String(index + 1).padStart(2, '0'),
  enabled: index % 2 === 0,
}))

// Use the hook for loading only: do not bind its manual, pagination or onChange.
const { dataSource, loading, error, reload } = useTableRequest<Row>({
  async request(_params, _sort, _filters, { signal }) {
    requests.value++
    // Replace this delay with your full-list API call and pass signal to the client.
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
    // Ignore the hook's current/pageSize: return the complete data set without slicing.
    return { data: [...records], total: records.length }
  },
})

const columns = computed<TableColumnsType<Row>>(() => [
  {
    key: 'name',
    dataIndex: 'name',
    title: copy.value.name,
    sorter: true,
    customRender: ({ text: value }) => `${copy.value.member} ${value}`,
  },
  {
    key: 'enabled',
    dataIndex: 'enabled',
    title: copy.value.status,
    filters: [
      { text: copy.value.enabled, value: true },
      { text: copy.value.disabled, value: false },
    ],
    filterMultiple: false,
    onFilter: (value, record) => record.enabled === value,
    customRender: ({ text: value }) => (value ? copy.value.enabled : copy.value.disabled),
  },
])
// No controlled current, pageSize or total: the table derives the filtered total.
const pagination: TablePaginationConfig = {
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: [5, 10, 20],
  showTotal: (total) => copy.value.total(total),
}
</script>

<template>
  <p>{{ copy.intro }}</p>
  <p role="status">
    {{ copy.requests }}: {{ requests }} · {{ copy.loaded }}: {{ dataSource.length }}
  </p>
  <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px">
    <Button :disabled="loading" @click="reload()">{{ copy.refresh }}</Button>
  </div>
  <p v-if="error" role="alert">{{ error.message }}</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :locale="locale"
    :manual="false"
    :pagination="pagination"
  />
</template>
