<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import {
  Button as AntButton,
  Input as AntInput,
  Select as AntSelect,
  Progress as AntProgress,
} from 'ant-design-vue'
import { ElButton, ElInput, ElSelect, ElOption, ElProgress } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/progress/style/css'
import {
  VTable,
  VTableToolbar,
  createTableDictionary,
  useTableDictionary,
  useTableRequest,
  type TableColumnsType,
  type TableColumnSettingsSize,
  type TableDictionaryOption,
} from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Task {
  key: number
  name: string
  status: number
  progress: number
  ratio: number
  window: [string | null, string | null]
  updated: string
}
const context = inject(PLAYGROUND_CONTEXT_KEY)
const element = computed(() => context?.preset.value === 'element-plus')
const button = computed(() => (element.value ? ElButton : AntButton))
const narrow = ref(false)
const virtual = ref(false)
const size = ref<TableColumnSettingsSize>('large')
const keyword = ref('')
const requests = ref(0)
const dictionaryRequests = ref(0)
const failNext = ref(false)
const failDictionary = ref(false)
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const statusDictionary = createTableDictionary({
  key: 'task-status',
  async request() {
    dictionaryRequests.value++
    await delay(350)
    if (failDictionary.value) {
      failDictionary.value = false
      throw new Error('字典加载失败，请重试')
    }
    return {
      options: [
        { value: 0, label: '待执行', status: 'default' as const },
        { value: 1, label: '进行中', status: 'processing' as const },
        { value: 2, label: '已完成', status: 'success' as const },
      ],
      complete: true,
    }
  },
})
const status = useTableDictionary({ dictionary: statusDictionary })
const queryStatus = useTableDictionary({ dictionary: statusDictionary })
// This demo uses numeric IDs. Ant Select does not accept the dictionary's boolean value type.
function numericOptions(options: readonly TableDictionaryOption[]) {
  return options.flatMap((item) =>
    typeof item.value === 'number' ? [{ ...item, value: item.value }] : [],
  )
}
const statusOptions = computed(() => numericOptions(queryStatus.options.value))
const selectedStatus = ref<number | undefined>()
const region = ref('east')
const owner = ref(99)
const ownerOptions = [{ value: 99, label: '已归档负责人' }]
const owners = useTableDictionary({
  dictionary: createTableDictionary<{ region: string }>({
    key: 'owners',
    async request(params, { keyword }) {
      await delay(350)
      const names = params.region === 'east' ? ['陈嘉', '苏晚', '周野'] : ['林悦', '陆川', '沈明']
      return {
        options: names
          .map((label, index) => ({ value: index + (params.region === 'east' ? 1 : 10), label }))
          .filter((item) => item.label.includes(keyword)),
        complete: false,
      }
    },
  }),
  params: () => ({ region: region.value }),
  selectedOptions: ownerOptions,
  debounceTime: 200,
})
const { options: searchOptions, loading: ownersLoading } = owners
const ownerChoices = computed(() => {
  const current = owners.valueEnum.value.get(owner.value)
  const label = typeof current === 'string' ? current : current?.text
  const candidates = numericOptions(searchOptions.value)
  return searchOptions.value.some((item) => item.value === owner.value)
    ? candidates
    : [{ value: owner.value, label: String(label ?? owner.value) }, ...candidates]
})
const remote = useTableRequest<Task, { keyword: string; status: number }>({
  polling: 5000,
  revalidateOnFocus: true,
  initialPagination: { pageSize: 5 },
  async request(params, sort, filters) {
    requests.value++
    await delay(450)
    if (failNext.value) {
      failNext.value = false
      throw new Error('刷新失败，已保留上次数据；点击刷新重试')
    }
    let rows: Task[] = Array.from(
      { length: 18 },
      (_, index): Task => ({
        key: index + 1,
        name:
          ['数据同步', '报表生成', '账单核验'][index % 3] +
          ` ${String(index + 1).padStart(2, '0')}`,
        status: index % 3,
        progress:
          index % 3 === 2 ? 100 : index % 3 === 0 ? 0 : Math.min(95, 15 + requests.value * 5),
        ratio: (index + 1) / 20,
        window: ['2026-10-26', index % 4 ? '2026-10-30' : null],
        updated: '2026-10-26T08:30:00Z',
      }),
    ).filter(
      (row) =>
        (!params.keyword || row.name.includes(params.keyword)) &&
        (params.status === undefined || row.status === params.status) &&
        (!filters.status?.length || filters.status.includes(row.status)),
    )
    if (sort.progress)
      rows = [...rows].sort(
        (a, b) => (a.progress - b.progress) * (sort.progress === 'ascend' ? 1 : -1),
      )
    const start = (params.current - 1) * params.pageSize
    return { data: rows.slice(start, start + params.pageSize), total: rows.length }
  },
})
const { dataSource, pagination, loading, refreshing, paused, error, manual, onChange } = remote
const columns = computed<TableColumnsType<Task>>(() => [
  { key: 'name', title: '任务名称', dataIndex: 'name', width: 180, fixed: 'left', copyable: true },
  {
    key: 'status',
    title: '状态',
    dataIndex: 'status',
    width: 120,
    valueType: 'tag',
    valueEnum: status.valueEnum.value,
    filters: status.filters.value,
    filteredValue: remote.filters.value.status ?? null,
  },
  {
    key: 'progress',
    title: '执行进度',
    dataIndex: 'progress',
    width: 220,
    valueType: 'progress',
    sorter: true,
    sortOrder: remote.sort.value.progress ?? null,
  },
  {
    key: 'ratio',
    title: '占比',
    dataIndex: 'ratio',
    width: 100,
    valueType: 'percent',
    fieldProps: { percentScale: 'ratio' },
  },
  { key: 'window', title: '计划区间', dataIndex: 'window', width: 250, valueType: 'dateRange' },
  { key: 'updated', title: '更新时间', dataIndex: 'updated', width: 200, valueType: 'dateTime' },
])
function submit() {
  void remote.submit({ keyword: keyword.value.trim(), status: selectedStatus.value })
}
function reset() {
  keyword.value = ''
  selectedStatus.value = undefined
  void remote.reset()
}
async function retryDictionary() {
  failDictionary.value = true
  await status.reload()
}
function simulateRequestFailure() {
  failNext.value = true
  void remote.reload()
}
</script>

<template>
  <main class="pro-data-page" :class="{ 'is-narrow': narrow }">
    <div class="pro-data-controls">
      <component :is="button" @click="narrow = !narrow">{{
        narrow ? '宽容器' : '520px 窄容器'
      }}</component>
      <component :is="button" @click="virtual = !virtual">{{
        virtual ? '普通表体' : '虚拟表体'
      }}</component>
      <component :is="button" @click="simulateRequestFailure">模拟请求失败</component>
      <component :is="button" @click="retryDictionary">模拟字典失败</component>
    </div>
    <form class="pro-data-query" @submit.prevent="submit">
      <label class="pro-data-field"
        ><span>任务名称</span>
        <ElInput v-if="element" v-model="keyword" placeholder="请输入任务名称" clearable />
        <AntInput v-else v-model:value="keyword" placeholder="请输入任务名称" allow-clear />
      </label>
      <label class="pro-data-field"
        ><span>状态</span>
        <ElSelect v-if="element" v-model="selectedStatus" clearable placeholder="全部状态">
          <ElOption
            v-for="item in statusOptions"
            :key="String(item.value)"
            :value="item.value"
            :label="item.label"
          />
        </ElSelect>
        <AntSelect
          v-else
          v-model:value="selectedStatus"
          :options="statusOptions"
          placeholder="全部状态"
          allow-clear
        />
      </label>
      <div class="pro-data-actions">
        <component :is="button" @click="reset">重置</component>
        <component :is="button" type="primary" @click="submit">查询</component>
      </div>
    </form>
    <section class="pro-data-card">
      <VTableToolbar
        v-model:size="size"
        title="任务列表"
        :loading="loading || refreshing"
        :options="{ setting: false }"
        @reload="remote.reload()"
      >
        <template #actions>
          <span class="pro-data-feedback" role="status">{{
            paused ? '已暂停' : refreshing ? '正在更新' : '每 5 秒刷新'
          }}</span>
          <component :is="button" @click="paused ? remote.resume(true) : remote.pause()">{{
            paused ? '恢复轮询' : '暂停轮询'
          }}</component>
        </template>
      </VTableToolbar>
      <p v-if="error" class="pro-data-error" role="alert">{{ error.message }}</p>
      <p v-if="status.error.value" class="pro-data-error" role="alert">
        {{ status.error.value.message }}
        <component :is="button" size="small" @click="status.reload()">重试字典</component>
      </p>
      <VTable
        row-key="key"
        :columns="columns"
        :data-source="dataSource"
        :pagination="pagination"
        :manual="manual"
        :loading="loading"
        :size="size"
        :virtual="virtual"
        :scroll="{ x: 1070, y: 310 }"
        @change="onChange"
      />
      <p class="pro-data-feedback">
        数据请求 {{ requests }} 次 · 两个字典订阅共 {{ dictionaryRequests }} 次请求
      </p>
    </section>
    <section class="pro-data-card">
      <h3>远程选项与依赖参数</h3>
      <div class="pro-data-query pro-data-query--inline">
        <component :is="button" @click="region = region === 'east' ? 'west' : 'east'">{{
          region === 'east' ? '华东区域' : '华西区域'
        }}</component>
        <label class="pro-data-field"
          ><span>负责人</span>
          <ElSelect
            v-if="element"
            v-model="owner"
            filterable
            remote
            :remote-method="owners.search"
            :loading="ownersLoading"
          >
            <ElOption
              v-for="item in ownerChoices"
              :key="String(item.value)"
              :value="item.value"
              :label="item.label"
            />
          </ElSelect>
          <AntSelect
            v-else
            v-model:value="owner"
            show-search
            :filter-option="false"
            :options="ownerChoices"
            :loading="ownersLoading"
            @search="owners.search"
          />
        </label>
      </div>
      <p class="pro-data-feedback">
        切换区域保留业务选择；远程搜索只提供候选项，不生成完整表头筛选。
      </p>
      <h3>原生 Progress 对照</h3>
      <div class="pro-data-reference">
        <template v-if="element"
          ><ElProgress :percentage="35" :stroke-width="6" /><ElProgress
            :percentage="100"
            status="success"
            :stroke-width="6"
        /></template>
        <template v-else
          ><AntProgress :percent="35" size="small" /><AntProgress :percent="100" size="small"
        /></template>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pro-data-page {
  display: grid;
  gap: 16px;
  max-width: 1200px;
}

.pro-data-page.is-narrow {
  max-width: 520px;
}

.pro-data-controls,
.pro-data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pro-data-query {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--vtg-table-bg);
  border-radius: 6px;
}

.pro-data-query--inline {
  padding: 0;
}

.pro-data-field {
  display: flex;
  flex: 1 1 240px;
  align-items: center;
  gap: 12px;
  max-width: 360px;
}

.pro-data-field > span:first-child {
  flex-shrink: 0;
}

.pro-data-field > :last-child {
  flex: 1;
  min-width: 120px;
}

.pro-data-card {
  min-width: 0;
  padding: 16px 24px;
  background: var(--vtg-table-bg);
  border-radius: 6px;
}

.pro-data-card h3 {
  margin: 8px 0 20px;
  font-size: 16px;
  font-weight: 500;
}

.pro-data-feedback {
  color: var(--color-muted);
  font-size: 13px;
}

.pro-data-error {
  color: var(--vtg-cell-error);
}

.pro-data-reference {
  display: grid;
  gap: 12px;
  width: min(100%, 320px);
}
</style>
