<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import { Button as AntButton, Tooltip as AntTooltip } from 'ant-design-vue'
import type { TableProps as AntTableProps } from 'ant-design-vue'
import type { ColumnsType as AntColumnsType } from 'ant-design-vue/es/table/interface'
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import {
  VTable,
  VTableSelectionAlert,
  VTableToolbar,
  useColumnState,
} from '@vtable-guild/vtable-guild'
import type {
  ColumnType,
  Key,
  SortOrder,
  TableColumnsType,
  TableColumnSettingsSize,
  VTableEventProps,
} from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Order {
  key: number
  orderNo: string
  name: string
  status: 'pending' | 'done' | 'rejected'
  city: string
  amount: number | null
  note: string | null
}

const context = inject(PLAYGROUND_CONTEXT_KEY)
const businessButton = computed(() =>
  context?.preset.value === 'element-plus' ? ElButton : AntButton,
)
const narrow = ref(false)
const multipleLine = ref(false)
const manualSort = ref(false)
const disabled = ref(false)
const keyword = ref('')
const submitted = ref('')
const status = ref('')
const size = ref<TableColumnSettingsSize>('middle')
const selectedRowKeys = ref<Key[]>([1, 2, 99])
const message = ref('已选 3 个 keys，其中 key 99 未加载，可核对跨页批量操作。')
const refreshes = ref(0)
const sortOrder = ref<SortOrder>(null)
const copied = ref('')
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'done', label: '已完成' },
  { value: 'rejected', label: '已驳回' },
]
const statusEnum = {
  pending: { text: '待处理', status: 'processing' },
  done: { text: '已完成', status: 'success' },
  rejected: { text: '已驳回', status: 'error' },
} as const
const rows: Order[] = [
  {
    key: 1,
    orderNo: 'ORD-20261024-001',
    name: '陈嘉',
    status: 'pending',
    city: '杭州',
    amount: 1280,
    note: null,
  },
  {
    key: 2,
    orderNo: 'ORD-20261024-002',
    name: '苏晚',
    status: 'done',
    city: '上海',
    amount: 0,
    note: '优先配送',
  },
  {
    key: 3,
    orderNo: 'ORD-20261024-003',
    name: '周野',
    status: 'rejected',
    city: '深圳',
    amount: null,
    note: '',
  },
  {
    key: 4,
    orderNo: 'ORD-20261024-004',
    name: '林澄',
    status: 'pending',
    city: '北京',
    amount: 520,
    note: '周末送达',
  },
  {
    key: 5,
    orderNo: 'ORD-20261024-005',
    name: '宋禾',
    status: 'done',
    city: '杭州',
    amount: 860,
    note: null,
  },
  {
    key: 6,
    orderNo: 'ORD-20261024-006',
    name: '许清',
    status: 'pending',
    city: '成都',
    amount: 230,
    note: '电话联系',
  },
]
const definitions = computed<TableColumnsType<Order>>(() => [
  {
    key: 'orderNo',
    title: '订单编号',
    dataIndex: 'orderNo',
    width: 210,
    disable: { checkbox: true },
    copyable: {
      text: ({ record }) => record.orderNo,
      onCopy: (text) => {
        copied.value = text
      },
      onError: () => {
        copied.value = '复制失败，请检查浏览器剪贴板权限'
      },
    },
  },
  {
    key: 'name',
    title: '姓名',
    dataIndex: 'name',
    width: 130,
    tooltip: '下单人姓名，点击列标题排序',
    sorter: true,
    sortOrder: sortOrder.value,
    showSorterTooltip: { placement: 'bottom', mouseEnterDelay: 0.1 },
  },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    width: 130,
    valueEnum: statusEnum,
    filters: true,
    onFilter: true,
  },
  { key: 'city', title: '城市', dataIndex: 'city', width: 110 },
  { key: 'amount', title: '金额', dataIndex: 'amount', width: 110, align: 'right' },
  { key: 'note', title: '备注', dataIndex: 'note', width: 150, visible: false },
])
const {
  columns,
  state,
  reset: resetColumns,
} = useColumnState(definitions, {
  storageKey: 'playground.enterprise.columns',
  version: 1,
  onError: () => {
    message.value = '浏览器存储不可用，本页仍可继续调整列。'
  },
})
const visibleRows = computed(() =>
  rows.filter(
    (row) =>
      (!submitted.value || `${row.name} ${row.orderNo} ${row.city}`.includes(submitted.value)) &&
      (!status.value || row.status === status.value),
  ),
)
const selectedRows = computed(() =>
  visibleRows.value.filter((row) => selectedRowKeys.value.includes(row.key)),
)
const selection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: Key[]) => {
    selectedRowKeys.value = keys
  },
}))
const nativeColumns = computed<AntColumnsType<Order>>(() =>
  columns.value.flatMap((column) => {
    if (typeof column === 'symbol' || 'children' in column || column.visible === false) return []
    const leaf = column as ColumnType<Order>
    return [
      {
        key: leaf.key,
        title:
          leaf.key === 'name'
            ? h('span', [
                '姓名 ',
                h(AntTooltip, { title: '下单人姓名，点击列标题排序' }, () => h(InfoCircleOutlined)),
              ])
            : typeof leaf.title === 'string'
              ? leaf.title
              : String(leaf.key),
        dataIndex: leaf.dataIndex,
        width: leaf.width,
        fixed: leaf.fixed,
        align: leaf.align,
        ...(leaf.key === 'name'
          ? {
              sorter: manualSort.value
                ? true
                : (a: Order, b: Order) => a.name.localeCompare(b.name),
              sortOrder: sortOrder.value,
            }
          : {}),
        ...(leaf.key === 'status'
          ? {
              filters: Object.entries(statusEnum).map(([value, item]) => ({
                value,
                text: item.text,
              })),
              onFilter: (value: unknown, record: Order) => record.status === value,
            }
          : {}),
      },
    ]
  }),
)
const pagination = {
  defaultPageSize: 4,
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
}
const handleChange: NonNullable<VTableEventProps<Order>['onChange']> = (
  _filters,
  sorter,
  extra,
) => {
  if (extra.action === 'sort') {
    const active = Array.isArray(sorter) ? sorter[0] : sorter
    sortOrder.value = active?.order ?? null
  }
  message.value = `VTable：${extra.action}；手动排序 ${manualSort.value ? '开启，保留输入顺序' : '关闭，本地排序'}`
}
const handleNativeChange: NonNullable<AntTableProps<Order>['onChange']> = (
  _pagination,
  _filters,
  sorter,
  extra,
) => {
  if (extra.action === 'sort') {
    const active = Array.isArray(sorter) ? sorter[0] : sorter
    sortOrder.value = active?.order ?? null
  }
  message.value = `Ant Table：${extra.action}`
}
function search(value: string) {
  submitted.value = value
  message.value = `查询：${value || '全部'}；输入本身不会提交查询。`
}
function batch(keys: readonly Key[]) {
  message.value = `批量审核 keys：${keys.join('、')}；客户端可用记录 ${selectedRows.value.length} 条。`
}
function clear() {
  selectedRowKeys.value = []
  message.value = '已清空选择。'
}
const preferenceSummary = computed(() => JSON.stringify(state.value))
</script>

<template>
  <section class="enterprise-page">
    <header class="enterprise-page-heading">
      <div>
        <h2>企业表格能力 · Ant Design 对照</h2>
        <p>
          同一份数据、列偏好和已选 keys。切换全局预设可核对 Element Plus；左侧始终保留 Ant Design
          原生参照。
        </p>
      </div>
      <a-button @click="resetColumns">恢复全部列偏好</a-button>
    </header>

    <div class="enterprise-page-controls">
      <a-checkbox v-model:checked="narrow">窄容器</a-checkbox>
      <a-checkbox v-model:checked="multipleLine">筛选独立一行</a-checkbox>
      <a-checkbox v-model:checked="manualSort">手动排序：仅更新状态，保留输入顺序</a-checkbox>
      <a-checkbox v-model:checked="disabled">禁用操作</a-checkbox>
      <span>刷新 {{ refreshes }} 次</span>
    </div>

    <div class="enterprise-page-grid" :class="{ 'is-narrow': narrow }">
      <article class="enterprise-page-panel">
        <h3>Ant Design Vue · 原生组合参照</h3>
        <a-config-provider :locale="context?.antLocale.value">
          <a-table
            row-key="key"
            :columns="nativeColumns"
            :data-source="visibleRows"
            :row-selection="selection"
            :pagination="pagination"
            :scroll="{ x: 760 }"
            :size="size"
            @change="handleNativeChange"
          >
            <template #title>
              <div class="enterprise-page-reference-toolbar">
                <strong>订单列表</strong>
                <a-input-search
                  v-model:value="keyword"
                  placeholder="姓名、订单号或城市"
                  allow-clear
                  :disabled="disabled"
                  @search="search"
                />
              </div>
              <a-alert type="info" :show-icon="false" class="enterprise-page-reference-alert">
                <template #message>
                  <div class="enterprise-page-reference-alert-content">
                    <span
                      >已选择 <strong>{{ selectedRowKeys.length }}</strong> 项
                      <a-button
                        type="link"
                        size="small"
                        :disabled="disabled || !selectedRowKeys.length"
                        @click="clear"
                        >清空选择</a-button
                      >
                    </span>
                    <a-button
                      size="small"
                      :disabled="disabled || !selectedRowKeys.length"
                      @click="batch(selectedRowKeys)"
                      >批量审核</a-button
                    >
                  </div>
                </template>
              </a-alert>
            </template>
            <template #bodyCell="{ column, record, text }">
              <a-typography-text
                v-if="column.key === 'orderNo'"
                :copyable="{ text: record.orderNo }"
                >{{ record.orderNo }}</a-typography-text
              >
              <a-badge
                v-else-if="column.key === 'status'"
                :status="statusEnum[record.status as Order['status']].status"
                :text="statusEnum[record.status as Order['status']].text"
              />
              <template v-else>{{ text ?? '—' }}</template>
            </template>
          </a-table>
        </a-config-provider>
      </article>

      <article class="enterprise-page-panel" data-enterprise-vtable>
        <h3>VTable · {{ context?.preset.value ?? 'antdv' }}</h3>
        <VTable
          row-key="key"
          :columns="columns"
          :data-source="visibleRows"
          :row-selection="selection"
          :pagination="pagination"
          :scroll="{ x: 760 }"
          :size="size"
          :manual="{ sort: manualSort }"
          column-empty-text="—"
          @change="handleChange"
        >
          <template #title>
            <VTableToolbar
              v-model:columns="columns"
              v-model:size="size"
              v-model:search-value="keyword"
              title="订单列表"
              :search="{ placeholder: '姓名、订单号或城市' }"
              :disabled="disabled"
              :multiple-line="multipleLine"
              @search="search"
              @clear-search="search('')"
              @reload="refreshes++"
            >
              <template #filter>
                <a-select
                  v-model:value="status"
                  :options="statusOptions"
                  :disabled="disabled"
                  aria-label="订单状态"
                  class="enterprise-page-status"
                />
              </template>
              <template #extra>
                <VTableSelectionAlert
                  v-model:selected-row-keys="selectedRowKeys"
                  :selected-rows="selectedRows"
                  :disabled="disabled"
                  always-show
                  class="enterprise-page-alert"
                  @clear="message = '已清空选择。'"
                >
                  <template #actions="{ selectedRowKeys: keys, disabled: actionDisabled }">
                    <component
                      :is="businessButton"
                      :disabled="actionDisabled || !keys.length"
                      @click="batch(keys)"
                      >批量审核</component
                    >
                  </template>
                </VTableSelectionAlert>
              </template>
            </VTableToolbar>
          </template>
        </VTable>
      </article>
    </div>

    <a-alert class="enterprise-page-result" :message="message" type="info" />
    <p v-if="copied" role="status">复制结果：{{ copied }}</p>
    <details class="enterprise-page-preferences">
      <summary>查看已保存的列偏好</summary>
      <pre>{{ preferenceSummary }}</pre>
    </details>
  </section>
</template>

<style scoped>
.enterprise-page {
  padding: 24px;
}

.enterprise-page-heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.enterprise-page-heading h2 {
  margin: 0 0 8px;
}

.enterprise-page-heading p {
  margin: 0;
}

.enterprise-page-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-block: 20px;
}

.enterprise-page-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.enterprise-page-grid.is-narrow {
  grid-template-columns: minmax(0, 420px);
  justify-content: center;
}

.enterprise-page-panel {
  min-width: 0;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.enterprise-page-panel h3 {
  margin: 0 0 16px;
}

.enterprise-page-reference-toolbar,
.enterprise-page-reference-alert-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.enterprise-page-reference-toolbar :deep(.ant-input-search) {
  max-width: 240px;
}

.enterprise-page-reference-alert {
  margin-top: 12px;
}

.enterprise-page-reference-alert-content strong {
  color: #1677ff;
}

.enterprise-page-status {
  min-width: 120px;
}

.enterprise-page-alert {
  width: 100%;
}

.enterprise-page-result,
.enterprise-page-preferences {
  margin-top: 20px;
}

.enterprise-page-preferences pre {
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (width <= 1100px) {
  .enterprise-page-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
