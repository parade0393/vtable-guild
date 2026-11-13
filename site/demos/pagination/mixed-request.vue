<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import {
  Button,
  VTable,
  useTableRequest,
  type SortOrder,
  type TableColumnsType,
  type TablePaginationConfig,
  type VTableEventProps,
} from '@vtable-guild/vtable-guild'

type Row = { key: number; name: string; enabled: boolean }
type Query = { enabled: boolean | null }
// Keep the language outside request params so switching it never reloads data.
const lang = inject('vtg-demo-lang', ref('zh-CN'))
const locale = computed(() => (lang.value.startsWith('en') ? 'en-US' : 'zh-CN'))
const copy = computed(() =>
  locale.value === 'en-US'
    ? {
        intro: 'Filter on the server; sort and page all returned matches in the browser.',
        requests: 'Requests',
        loaded: 'Loaded',
        page: 'Page',
        filter: 'Filter',
        all: 'All',
        refresh: 'Refresh data',
        reset: 'Reset and reload',
        name: 'Name',
        member: 'Member',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        total: (count: number) => `${count} matching records`,
      }
    : {
        intro: '筛选由接口处理，排序和分页在前端处理全部匹配记录。',
        requests: '请求次数',
        loaded: '已加载',
        page: '页码',
        filter: '筛选',
        all: '全部',
        refresh: '刷新数据',
        reset: '重置并刷新',
        name: '姓名',
        member: '成员',
        status: '状态',
        enabled: '启用',
        disabled: '禁用',
        total: (count: number) => `共 ${count} 条匹配记录`,
      },
)
const requests = ref(0)
const remoteStatus = ref<boolean | null>(null)
const nameOrder = ref<SortOrder>(null)
const current = ref(1)
const pageSize = ref(10)
const records: Row[] = Array.from({ length: 20 }, (_, index) => ({
  key: index + 1,
  name: String(index + 1).padStart(2, '0'),
  enabled: index % 3 !== 2,
}))

// Only remoteStatus enters request params. Local sorting/paging never enters the hook.
const { dataSource, loading, error, reload } = useTableRequest<Row, Query>({
  params: () => ({ enabled: remoteStatus.value }),
  async request(params, _sort, _filters, { signal }) {
    requests.value++
    // Replace this mock with your filtered full-list API and pass signal to the client.
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
    const rows = records.filter(
      (record) => params.enabled == null || record.enabled === params.enabled,
    )
    // Return every matching record. The table performs sorting and pagination.
    return { data: rows, total: rows.length }
  },
  onLoad: () => {
    current.value = 1
  },
})

const columns = computed<TableColumnsType<Row>>(() => [
  {
    key: 'name',
    dataIndex: 'name',
    title: copy.value.name,
    sorter: true,
    sortOrder: nameOrder.value,
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
    filteredValue: remoteStatus.value == null ? null : [remoteStatus.value],
    customRender: ({ text: value }) => (value ? copy.value.enabled : copy.value.disabled),
  },
])
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  disabled: loading.value,
  showSizeChanger: true,
  pageSizeOptions: [5, 10, 20],
  // Omit total: the table counts all returned matching rows before slicing.
  showTotal: (total) => copy.value.total(total),
}))

const handleChange: NonNullable<VTableEventProps<Row>['onChange']> = (filters, sorter, extra) => {
  if (extra.action === 'paginate' && extra.pagination) {
    current.value = extra.pagination.current
    pageSize.value = extra.pagination.pageSize
  } else if (extra.action === 'sort') {
    const results = Array.isArray(sorter) ? sorter : [sorter]
    nameOrder.value = results.find((result) => result.columnKey === 'name')?.order ?? null
    current.value = 1
  } else if (extra.action === 'filter') {
    current.value = 1
    const selected = filters.enabled?.[0]
    // Changing this query parameter triggers one request; do not also call reload.
    remoteStatus.value = typeof selected === 'boolean' ? selected : null
  }
}

function refresh() {
  current.value = 1
  void reload()
}

function reset() {
  current.value = 1
  nameOrder.value = null
  if (remoteStatus.value !== null) {
    // The params watcher requests after the filter is cleared.
    remoteStatus.value = null
  } else {
    // Reset still refreshes when no remote condition changed.
    void reload()
  }
}
</script>

<template>
  <p>{{ copy.intro }}</p>
  <p role="status">
    {{ copy.requests }}: {{ requests }} · {{ copy.loaded }}: {{ dataSource.length }} ·
    {{ copy.page }}: {{ current }} · {{ copy.filter }}:
    {{ remoteStatus == null ? copy.all : remoteStatus ? copy.enabled : copy.disabled }}
  </p>
  <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px">
    <Button :disabled="loading" @click="refresh">{{ copy.refresh }}</Button>
    <Button :disabled="loading" @click="reset">{{ copy.reset }}</Button>
  </div>
  <p v-if="error" role="alert">{{ error.message }}</p>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :locale="locale"
    :manual="{ filter: true }"
    :pagination="pagination"
    @change="handleChange"
  />
</template>
