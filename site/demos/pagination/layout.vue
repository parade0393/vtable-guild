<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  type Key,
  type RowSelection,
  type TablePaginationConfig,
  type TablePaginationLayout,
} from '@vtable-guild/vtable-guild'

type Row = { key: number; name: string; revision: number }
type LayoutMode = 'default' | 'inline' | 'split' | 'left' | 'right' | 'empty'

const mode = ref<LayoutMode>('split')
const narrow = ref(false)
const bothPositions = ref(false)
const simple = ref(false)
const disabled = ref(false)
const showSizes = ref(true)
const showJumper = ref(true)
const emptyData = ref(false)
const hidePagination = ref(false)
const current = ref(1)
const pageSize = ref(5)
const paginationChanges = ref(0)
const refreshCount = ref(0)
const lastRefresh = ref('尚未刷新')
const selectedRowKeys = ref<Key[]>([])
const data = ref<Row[]>(
  Array.from({ length: 87 }, (_, i) => ({
    key: i + 1,
    name: `Record ${i + 1}`,
    revision: 1,
  })),
)
const rows = computed(() => (emptyData.value ? [] : data.value))
const columns = [
  { key: 'key', dataIndex: 'key', title: 'ID', width: 64 },
  { key: 'name', dataIndex: 'name', title: 'Name' },
  { key: 'revision', dataIndex: 'revision', title: 'Revision', width: 96 },
]
const layouts: Record<Exclude<LayoutMode, 'default'>, TablePaginationLayout> = {
  inline: [
    'sizes',
    'prev',
    'pager',
    'next',
    'jumper',
    'total',
    { slot: 'selection' },
    { slot: 'refresh' },
  ],
  split: {
    left: [{ slot: 'selection' }, 'total'],
    right: ['sizes', 'prev', 'pager', 'next', 'jumper', { slot: 'refresh' }],
  },
  left: { left: [{ slot: 'selection' }, 'total', { slot: 'refresh' }] },
  right: { right: ['prev', 'pager', 'next', { slot: 'refresh' }] },
  empty: [],
}
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  layout: mode.value === 'default' ? undefined : layouts[mode.value],
  position: hidePagination.value
    ? ['none']
    : bothPositions.value
      ? ['topLeft', 'bottomRight']
      : ['bottomRight'],
  simple: simple.value,
  disabled: disabled.value,
  pagerCount: 5,
  showSizeChanger: showSizes.value,
  showQuickJumper: showJumper.value ? { goButton: 'Go' } : false,
  pageSizeOptions: [5, 10, 20],
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  onChange: (page, size) => {
    current.value = page
    pageSize.value = size
    paginationChanges.value++
  },
}))
const rowSelection = computed<RowSelection<Row>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  },
}))

// Application-owned refresh: replace this local update with your page-loading function.
function reloadPage(page: number, size: number) {
  const start = (page - 1) * size
  data.value = data.value.map((row, index) =>
    index >= start && index < start + size ? { ...row, revision: row.revision + 1 } : row,
  )
  refreshCount.value++
  lastRefresh.value = `已刷新第 ${page} 页（${start + 1}–${Math.min(start + size, data.value.length)}）`
}
</script>

<template>
  <div class="pagination-layout-demo">
    <div class="pagination-layout-demo__toolbar">
      <label>
        布局
        <select v-model="mode">
          <option value="default">默认顺序</option>
          <option value="inline">单组重排</option>
          <option value="split">左右分区</option>
          <option value="left">仅左侧</option>
          <option value="right">仅右侧</option>
          <option value="empty">空布局</option>
        </select>
      </label>
      <label><input v-model="narrow" type="checkbox" /> 窄容器（420px）</label>
      <label><input v-model="bothPositions" type="checkbox" /> 上下分页</label>
      <label><input v-model="showSizes" type="checkbox" /> showSizeChanger</label>
      <label><input v-model="showJumper" type="checkbox" /> showQuickJumper</label>
      <label><input v-model="simple" type="checkbox" /> Simple</label>
      <label><input v-model="disabled" type="checkbox" /> Disabled</label>
      <label><input v-model="emptyData" type="checkbox" /> 空数据</label>
      <label><input v-model="hidePagination" type="checkbox" /> 隐藏分页</label>
    </div>
    <p>
      勾选记录后观察分页行的已选数量；刷新会更新当前页的 Revision。
      切换布局和刷新均不会增加分页回调次数。
    </p>
    <div
      class="pagination-layout-demo__container"
      :class="{ 'pagination-layout-demo__container--narrow': narrow }"
    >
      <VTable
        row-key="key"
        :columns="columns"
        :data-source="rows"
        :pagination="pagination"
        :row-selection="rowSelection"
      >
        <template
          #paginationItem="{ name, current: page, pageSize: size, disabled, position, region }"
        >
          <span v-if="name === 'selection'" :title="`${position} / ${region}`">
            已选 {{ selectedRowKeys.length }} 条
          </span>
          <button
            v-else-if="name === 'refresh'"
            type="button"
            class="pagination-layout-demo__refresh"
            :disabled="disabled"
            :title="`${position} / ${region}`"
            @click="reloadPage(page, size)"
          >
            刷新
          </button>
        </template>
      </VTable>
    </div>
    <p role="status" aria-live="polite">
      已选 {{ selectedRowKeys.length }} 条 · 分页回调 {{ paginationChanges }} 次 · 刷新
      {{ refreshCount }} 次 · {{ lastRefresh }}
    </p>
  </div>
</template>

<style scoped>
.pagination-layout-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-layout-demo__toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pagination-layout-demo__container {
  width: 100%;
  min-width: 0;
}

.pagination-layout-demo__container--narrow {
  max-width: 420px;
}

.pagination-layout-demo__refresh {
  min-height: var(--vtg-pagination-size);
  padding-inline: var(--vtg-pagination-gap);
  border: 1px solid var(--vtg-pagination-border);
  border-radius: var(--vtg-pagination-radius);
  color: inherit;
  background: var(--vtg-pagination-bg);
  font: inherit;
  cursor: pointer;
}

.pagination-layout-demo__refresh:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.pagination-layout-demo__refresh:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
