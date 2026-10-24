<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { Button, VTable, VTableToolbar } from '@vtable-guild/vtable-guild'
import type { TableColumnsType, TableColumnSettingsSize } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  city: string
  status: string
}
const columns = shallowRef<TableColumnsType<Member>>([
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'city', title: '城市', dataIndex: 'city' },
  { key: 'status', title: '状态', dataIndex: 'status', visible: false },
])
const rows: Member[] = [
  { key: 1, name: '陈嘉', city: '杭州', status: '在职' },
  { key: 2, name: '苏晚', city: '上海', status: '在职' },
  { key: 3, name: '周野', city: '深圳', status: '休假' },
]
const size = ref<TableColumnSettingsSize>('middle')
const target = ref<HTMLElement | null>(null)
const loading = ref(false)
const refreshes = ref(0)
const csv = ref('')
let refreshTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(refreshTimer))
function reload() {
  loading.value = true
  // Replace this sample with your data-loading function and clear loading in finally.
  refreshTimer = setTimeout(() => {
    refreshes.value++
    loading.value = false
  }, 500)
}
function exportCsv(data: Member[], currentColumns: TableColumnsType<Member>) {
  const visible = currentColumns.flatMap<{ key: 'name' | 'city' | 'status'; title: unknown }>(
    (column) =>
      typeof column !== 'symbol' &&
      column.visible !== false &&
      (column.key === 'name' || column.key === 'city' || column.key === 'status')
        ? [{ key: column.key, title: column.title }]
        : [],
  )
  if (!visible.length) return
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  csv.value = [
    visible.map((column) => cell(column.title)).join(','),
    ...data.map((row) => visible.map((column) => cell(row[column.key])).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', csv.value], { type: 'text/csv;charset=utf-8;' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'members.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
</script>

<template>
  <div ref="target" class="toolbar-demo">
    <VTable :columns="columns" :size="size" :data-source="rows" :loading="loading" bordered>
      <template #title="{ data }">
        <VTableToolbar
          v-model:columns="columns"
          v-model:size="size"
          title="团队成员"
          :loading="loading"
          :options="{ fullScreen: true }"
          :fullscreen-target="() => target"
          @reload="reload"
        >
          <template #actions="{ columns: currentColumns, disabled }">
            <Button :disabled="disabled" @click="exportCsv(data, currentColumns)">导出 CSV</Button>
          </template>
        </VTableToolbar>
      </template>
    </VTable>
    <p aria-live="polite">已刷新 {{ refreshes }} 次</p>
    <pre v-if="csv" class="toolbar-demo-csv" aria-label="导出内容">{{ csv }}</pre>
  </div>
</template>

<style scoped>
.toolbar-demo {
  position: relative;
  background: var(--color-surface);
}

.toolbar-demo:fullscreen {
  padding: 24px;
  overflow: auto;
}

.toolbar-demo-csv {
  max-width: 100%;
  overflow: auto;
}
</style>
