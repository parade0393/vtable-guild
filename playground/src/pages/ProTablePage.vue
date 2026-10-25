<script setup lang="ts">
import { computed, inject, ref, shallowRef } from 'vue'
import { Button as AntButton, Input as AntInput, Select as AntSelect } from 'ant-design-vue'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { ElButton, ElInput, ElSelect, ElOption } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/select/style/css'
import {
  VTable,
  VTableToolbar,
  useTableEdit,
  useTableQuery,
  useTableRequest,
  type TableColumnsType,
  type TableInstance,
  type TableColumnSettingsSize,
} from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Order {
  key: number
  name: string
  amount: number
  status: 'pending' | 'done'
  date: string
}
interface Node {
  key: string
  name: string
  leaf?: boolean
}
const context = inject(PLAYGROUND_CONTEXT_KEY)
const element = computed(() => context?.preset.value === 'element-plus')
const button = computed(() => (element.value ? ElButton : AntButton))
const actionProps = computed(() =>
  element.value ? { link: true, type: 'primary' as const } : { type: 'link' as const },
)
const size = ref<TableColumnSettingsSize>('large')
const narrow = ref(false)
const requests = ref(0)
const feedback = ref('')
const store = ref<Order[]>(
  Array.from({ length: 24 }, (_, index) => ({
    key: index + 1,
    name: `订单 ${index + 1}`,
    amount: 1280.5 + index * 100,
    status: index % 2 ? 'done' : 'pending',
    date: '2026-10-25',
  })),
)
const columns = shallowRef<TableColumnsType<Order>>([
  { key: 'name', dataIndex: 'name', title: '订单', width: 180, copyable: true, fixed: 'left' },
  { key: 'amount', dataIndex: 'amount', title: '金额', valueType: 'money', width: 160 },
  {
    key: 'status',
    dataIndex: 'status',
    title: '状态',
    valueType: 'tag',
    width: 120,
    valueEnum: {
      pending: { text: '待处理', status: 'warning' },
      done: { text: '已完成', status: 'success' },
    },
  },
  { key: 'date', dataIndex: 'date', title: '日期', valueType: 'date', width: 150 },
  { key: 'actions', title: '操作', width: 170, fixed: 'right' },
])
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'done', label: '已完成' },
]
const remote = useTableRequest<Order, { keyword: string; status: string }>({
  manualRequest: true,
  initialPagination: { pageSize: 5 },
  async request(params) {
    requests.value++
    const rows = store.value.filter(
      (row) =>
        (!params.keyword || row.name.includes(params.keyword)) &&
        (!params.status || row.status === params.status),
    )
    const start = (params.current - 1) * params.pageSize
    return { data: rows.slice(start, start + params.pageSize), total: rows.length }
  },
})
const { dataSource, pagination, loading, manual, onChange } = remote
const { draft, collapsed, submit, reset, toggleCollapsed } = useTableQuery({
  defaultValues: { keyword: '', status: '' },
  transform: (values) => ({ ...values, keyword: values.keyword?.trim() }),
  onSubmit: remote.submit,
  onReset: remote.reset,
})
const edit = useTableEdit<Order>({
  rowKey: 'key',
  mode: 'multiple',
  validate: (row) => (row.name.trim() ? undefined : { fields: { name: '请输入订单名称' } }),
  async onSave(row, { signal }) {
    if (signal.aborted) return
    const index = store.value.findIndex((item) => item.key === row.key)
    if (index < 0) store.value.unshift(row)
    else store.value[index] = row
  },
})
const { newRecords, errors, savingKeys } = edit
const editedRows = computed(() => [...newRecords.value, ...dataSource.value])
let nextKey = 100
function add() {
  edit.add({ key: nextKey++, name: '', amount: 0, status: 'pending', date: '2026-10-25' })
}
function changeName(key: number, value: string | number) {
  edit.setDraft(key, { name: String(value) })
}
async function save(key: number) {
  if (await edit.save(key)) await remote.reload()
}
const tree = ref<TableInstance>()
const treeData: Node[] = [{ key: 'root', name: '产品团队（首次失败可重试）' }]
const treeColumns: TableColumnsType<Node> = [
  { key: 'name', dataIndex: 'name', title: '组织', width: 500 },
]
let attempt = 0
async function loadData(record: Node, { signal }: { signal: AbortSignal }): Promise<Node[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500))
  if (signal.aborted) return []
  if (++attempt === 1) throw new Error('模拟加载失败')
  return Array.from({ length: 100 }, (_, index) => ({
    key: `${record.key}-${index}`,
    name: `设计小组 ${index + 1}`,
    leaf: true,
  }))
}
async function locate() {
  feedback.value = (await tree.value?.scrollTo({ key: 'root-80', align: 'top' }))
    ? '已定位设计小组 81'
    : '请先展开并加载组织节点'
}
void submit()
</script>

<template>
  <main class="pro-table-page" :class="{ 'is-narrow': narrow }">
    <h2>ProTable · 查询、编辑、字段与树形定位</h2>
    <p>对齐 Ant Design ProTable 的查询提交、EditableProTable 草稿及 ProField 展示语义。</p>
    <label><input v-model="narrow" type="checkbox" /> 窄容器</label>
    <form class="pro-table-query" @submit.prevent="submit()">
      <label for="pro-order-name">订单名称</label>
      <ElInput
        v-if="element"
        id="pro-order-name"
        v-model="draft.keyword"
        placeholder="请输入订单名称"
        clearable
      />
      <AntInput
        v-else
        id="pro-order-name"
        v-model:value="draft.keyword"
        placeholder="请输入订单名称"
        allow-clear
      />
      <component :is="button" @click="reset()">重置</component>
      <component :is="button" type="primary" @click="submit()">查询</component>
      <component
        :is="button"
        v-bind="actionProps"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed()"
      >
        {{ collapsed ? '展开' : '收起' }}
        <DownOutlined v-if="collapsed" /><UpOutlined v-else />
      </component>
      <div v-if="!collapsed" class="pro-table-query-extra">
        <label for="pro-order-status">订单状态</label>
        <ElSelect
          v-if="element"
          id="pro-order-status"
          v-model="draft.status"
          :empty-values="[null, undefined]"
          aria-label="订单状态"
        >
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </ElSelect>
        <AntSelect
          v-else
          id="pro-order-status"
          v-model:value="draft.status"
          :options="statusOptions"
          aria-label="订单状态"
        />
      </div>
    </form>
    <section class="pro-table-card">
      <VTableToolbar
        v-model:columns="columns"
        v-model:size="size"
        title="订单管理"
        @reload="remote.reload()"
      >
        <template #actions
          ><component :is="button" type="primary" @click="add()">新建订单</component></template
        >
      </VTableToolbar>
      <p role="status">请求 {{ requests }} 次；编辑 {{ edit.editableKeys.value.length }} 行</p>
      <VTable
        row-key="key"
        :columns="columns"
        :size="size"
        :data-source="editedRows"
        :pagination="pagination"
        :loading="loading"
        :manual="manual"
        :scroll="{ x: 780 }"
        @change="onChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name' && edit.isEditing(record.key)">
            <div class="pro-table-editor" :data-invalid="!!errors.get(record.key)">
              <ElInput
                v-if="element"
                :model-value="edit.getDraft(record.key)?.name"
                aria-label="编辑订单名称"
                :aria-invalid="!!errors.get(record.key)"
                :aria-describedby="errors.get(record.key) ? `pro-error-${record.key}` : undefined"
                @update:model-value="changeName(record.key, $event)"
              />
              <AntInput
                v-else
                :value="edit.getDraft(record.key)?.name"
                aria-label="编辑订单名称"
                :status="errors.get(record.key) ? 'error' : undefined"
                :aria-invalid="!!errors.get(record.key)"
                :aria-describedby="errors.get(record.key) ? `pro-error-${record.key}` : undefined"
                @update:value="changeName(record.key, $event)"
              />
              <span
                v-if="errors.get(record.key)"
                :id="`pro-error-${record.key}`"
                class="pro-table-error"
                role="alert"
                >{{ errors.get(record.key)?.fields?.name ?? errors.get(record.key)?.message }}</span
              >
            </div>
          </template>
          <span v-else-if="column.key === 'actions'" class="pro-table-actions">
            <template v-if="edit.isEditing(record.key)">
              <component
                :is="button"
                v-bind="actionProps"
                size="small"
                :loading="savingKeys.has(record.key)"
                @click="save(record.key)"
                >保存</component
              >
              <component
                :is="button"
                v-bind="actionProps"
                size="small"
                @click="edit.cancel(record.key)"
                >取消</component
              >
            </template>
            <component
              :is="button"
              v-else
              v-bind="actionProps"
              size="small"
              @click="edit.start(record)"
              >编辑</component
            >
          </span>
        </template>
      </VTable>
    </section>
    <section class="pro-table-card">
      <VTableToolbar title="组织树 · 虚拟滚动" :columns="treeColumns" :options="false">
        <template #actions
          ><component :is="button" @click="locate">定位设计小组 81</component></template
        >
      </VTableToolbar>
      <p role="status">{{ feedback || '展开 → 失败 → 点击重试 → 折叠与展开使用缓存 → 定位' }}</p>
      <VTable
        ref="tree"
        row-key="key"
        :columns="treeColumns"
        :data-source="treeData"
        :load-data="loadData"
        :is-leaf="(record: Node) => !!record.leaf"
        :row-selection="{ checkStrictly: false }"
        :scroll="{ y: 240 }"
        virtual
        @tree-load-error="(error: Error) => (feedback = error.message)"
      />
    </section>
  </main>
</template>

<style scoped>
.pro-table-page {
  display: grid;
  gap: 16px;
  max-width: 1200px;
}

.pro-table-page.is-narrow {
  max-width: 520px;
}

.pro-table-query {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: var(--vtg-table-bg);
  border-radius: 6px;
}

.pro-table-query > :nth-child(2) {
  flex: 1 1 200px;
  max-width: 340px;
}

.pro-table-query-extra {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-basis: 100%;
  margin: 0;
}

.pro-table-query-extra > :last-child {
  flex: 1 1 200px;
  max-width: 340px;
}

.pro-table-error {
  display: block;
  color: var(--vtg-cell-error);
  font-size: 12px;
  line-height: 20px;
}

.pro-table-editor[data-invalid='true'] :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.pro-table-card {
  min-width: 0;
  padding: 16px 24px;
  background: var(--vtg-table-bg);
  border-radius: 6px;
}

.pro-table-actions {
  display: inline-flex;
  gap: 8px;
}
</style>
