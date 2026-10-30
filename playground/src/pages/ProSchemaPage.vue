<script setup lang="ts">
import { computed, inject, nextTick, ref, type FunctionalComponent } from 'vue'
import {
  Button as AntButton,
  DatePicker,
  Form as AntForm,
  Input as AntInput,
  InputNumber,
  Select as AntSelect,
  TimePicker,
} from 'ant-design-vue'
import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTimePicker,
} from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/time-picker/style/css'
import {
  VTable,
  VTableQuery,
  VTableToolbar,
  createAntdvTableControls,
  createElementPlusTableControls,
  createTableDictionary,
  deriveTableQueryFields,
  useTableDictionary,
  useTableEditable,
  useTableQuery,
  type CustomRenderContext,
  type TableBodyCellSlotProps,
  type TableColumnType,
  type TableControlContext,
  type TableInstance,
  type TableQueryField,
  type TableQueryInstance,
} from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Detail {
  id: number
  name: string
  category: string
  quantity: number
  unitPrice: number
  delivery: string | number
  note: { memo: string }
  locked: boolean
}
interface QueryValues {
  name: string
  category: string | undefined
  minQuantity: number | undefined
  delivery: [string, string] | undefined
  advancedNote: string
}
interface SearchParams extends Omit<QueryValues, 'delivery'> {
  from: string | undefined
  to: string | undefined
}
type QueryColumn = TableColumnType<Detail> & {
  query?: false | (Omit<TableQueryField<QueryValues>, 'name'> & { name?: keyof QueryValues })
}
interface HostForm {
  validate: () => Promise<unknown>
  clearValidate?: () => void
}

const context = inject(PLAYGROUND_CONTEXT_KEY)
const element = computed(() => context?.preset.value === 'element-plus')
const button = computed(() => (element.value ? ElButton : AntButton))
const hostForm = computed(() => (element.value ? ElForm : AntForm))
const hostFormItem = computed(() => (element.value ? ElFormItem : AntForm.Item))
const actionProps = computed(() =>
  element.value ? { link: true, type: 'primary' as const } : { type: 'link' as const },
)
const controls = computed(() =>
  element.value
    ? createElementPlusTableControls({
        Input: ElInput,
        Select: ElSelect,
        Option: ElOption,
        InputNumber: ElInputNumber,
        DatePicker: ElDatePicker,
        TimePicker: ElTimePicker,
      })
    : createAntdvTableControls({
        Input: AntInput,
        Select: AntSelect,
        InputNumber,
        DatePicker,
        RangePicker: DatePicker.RangePicker,
        TimePicker,
      }),
)
const narrow = ref(false)
const virtual = ref(false)
const light = ref(false)
const autoSubmit = ref(false)
const showAdvanced = ref(true)
const omitHidden = ref(false)
const requestCount = ref(0)
const dictionaryCount = ref(0)
const sourceChanges = ref(0)
const rowSaves = ref(0)
const submitCount = ref(0)
const failNextSubmit = ref(false)
const submitting = ref(false)
const feedback = ref('')
const queryHost = ref<HostForm>()
const mainHost = ref<HostForm>()
const queryView = ref<TableQueryInstance>()
const table = ref<TableInstance>()
const project = ref({ name: '华东采购申请' })
const queryRules = { name: [{ max: 12, message: '查询名称最多 12 个字', trigger: 'blur' }] }
const projectRules = { name: [{ required: true, message: '请输入申请名称', trigger: 'blur' }] }
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const initialRows = (): Detail[] =>
  Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `${['办公耗材', '会议服务', '设备采购'][index % 3]} ${String(index + 1).padStart(2, '0')}`,
    category: ['goods', 'service', 'equipment'][index % 3] ?? 'goods',
    quantity: index % 3 === 1 ? 1 : index + 1,
    unitPrice: 120 + index * 35,
    delivery: Date.UTC(2026, 10, 2 + index),
    note: { memo: index % 2 ? '正常采购' : '优先安排' },
    locked: index === 2,
  }))
const source = ref(initialRows())
const category = useTableDictionary({
  dictionary: createTableDictionary({
    key: 'procurement-category',
    async request(_params, { keyword }) {
      dictionaryCount.value++
      await delay(200)
      return {
        options: [
          { value: 'goods', label: '办公耗材' },
          { value: 'service', label: '会议服务' },
          { value: 'equipment', label: '设备采购' },
        ].filter((item) => item.label.includes(keyword)),
        complete: !keyword,
      }
    },
  }),
  debounceTime: 150,
})
const columns = computed<QueryColumn[]>(() => [
  {
    key: 'name',
    title: '明细名称',
    dataIndex: 'name',
    width: 205,
    fixed: 'left',
    editor: {
      fieldProps: { placeholder: '请输入名称' },
      readonly: ({ draft }) => draft.locked,
      validate: (value) => (String(value ?? '').trim() ? undefined : '请输入明细名称'),
    },
    query: {
      order: 0,
      fieldProps: { placeholder: '名称可不填', allowClear: true, clearable: true },
    },
  },
  {
    key: 'category',
    title: '分类',
    dataIndex: 'category',
    width: 165,
    valueEnum: category.valueEnum.value,
    editor: {
      valueType: 'select',
      dictionary: category,
      onValueChange: (value, { draft }) => ({ quantity: value === 'service' ? 1 : draft.quantity }),
      validate: (value) => (value ? undefined : '请选择分类'),
    },
    query: {
      order: 1,
      valueType: 'select',
      dictionary: category,
      fieldProps: { placeholder: '全部分类', allowClear: true, clearable: true },
    },
  },
  {
    key: 'quantity',
    title: '数量',
    dataIndex: 'quantity',
    width: 135,
    valueType: 'digit',
    editor: {
      valueType: 'digit',
      fieldProps: { min: 1, precision: 0 },
      disabled: ({ draft }) => draft.category === 'service',
      validate: (value) => (Number(value) > 0 ? undefined : '数量必须大于 0'),
    },
    query: {
      name: 'minQuantity',
      label: '最小数量',
      valueType: 'digit',
      order: 3,
      fieldProps: { min: 0 },
    },
  },
  {
    key: 'unitPrice',
    title: '单价',
    dataIndex: 'unitPrice',
    width: 150,
    valueType: 'money',
    editor: {
      valueType: 'money',
      fieldProps: { min: 0, precision: 2 },
      validate: (value) => (Number(value) >= 0 ? undefined : '单价不能为负数'),
    },
    query: false,
  },
  {
    key: 'delivery',
    title: '交付日期',
    dataIndex: 'delivery',
    width: 180,
    valueType: 'date',
    editor: {
      valueType: 'date',
      convertValue: (value) => new Date(Number(value)).toISOString().slice(0, 10),
      transform: (value) => new Date(`${String(value)}T00:00:00Z`).getTime(),
      validate: (value) => (value ? undefined : '请选择交付日期'),
    },
    query: { order: 2, valueType: 'dateRange', label: '交付区间' },
  },
  {
    key: 'memo',
    title: '备注',
    dataIndex: ['note', 'memo'],
    width: 160,
    editor: { fieldProps: { placeholder: '补充说明' } },
    query: { name: 'advancedNote', order: 4, label: '备注关键词', hidden: !showAdvanced.value },
  },
  {
    key: 'total',
    title: '小计',
    width: 130,
    align: 'right',
    customRender: ({ record }) => `¥${(record.quantity * record.unitPrice).toFixed(2)}`,
    query: false,
  },
  { key: 'actions', title: '操作', width: 160, fixed: 'right', query: false },
])
const fields = computed(() => deriveTableQueryFields<QueryValues, Detail>(columns.value))
const applied = ref<Partial<SearchParams>>({})
const query = useTableQuery<QueryValues, SearchParams>({
  defaultValues: {
    name: '',
    category: undefined,
    minQuantity: undefined,
    delivery: undefined,
    advancedNote: '',
  },
  fieldTransforms: { delivery: (range) => ({ from: range?.[0], to: range?.[1] }) },
  onSubmit: async (params) => {
    requestCount.value++
    await delay(150)
    applied.value = params
  },
})
async function validateQuery() {
  try {
    return (await queryHost.value?.validate()) !== false
  } catch {
    return false
  }
}
let nextKey = 100
const edit = useTableEditable<Detail>({
  rowKey: 'id',
  mode: 'multiple',
  columns: () => columns.value,
  controls,
  dataSource: source,
  onChange: (rows) => {
    source.value = rows
    sourceChanges.value++
  },
  createRecord: () => ({
    id: nextKey++,
    name: '',
    category: 'goods',
    quantity: 1,
    unitPrice: 0,
    delivery: Date.UTC(2026, 10, 2),
    note: { memo: '' },
    locked: false,
  }),
  maxRows: 16,
  async onSave(_row, { signal }) {
    await delay(200)
    if (!signal.aborted) rowSaves.value++
  },
})
const { errors, savingKeys, validating } = edit
const visibleRows = computed(() => {
  const params = applied.value
  const added = new Set(edit.newRecords.value.map((row) => row.id))
  return edit.records.value.filter((row) => {
    if (added.has(row.id)) return true
    const day =
      typeof row.delivery === 'number'
        ? new Date(row.delivery).toISOString().slice(0, 10)
        : row.delivery
    return (
      (!params.name || row.name.includes(params.name)) &&
      (!params.category || row.category === params.category) &&
      (params.minQuantity === undefined || row.quantity >= params.minQuantity) &&
      (!params.from || day >= params.from) &&
      (!params.to || day <= params.to) &&
      (!params.advancedNote || row.note.memo.includes(params.advancedNote))
    )
  })
})
function cellContext(scope: TableBodyCellSlotProps<Detail>): CustomRenderContext<Detail> {
  return { ...scope, value: scope.text, renderIndex: scope.index }
}
const Editor: FunctionalComponent<{ cell: CustomRenderContext<Detail> }> = (props) =>
  edit.renderEditor(props.cell)
const QueryControl: FunctionalComponent<{ control: TableControlContext; valueType?: string }> = (
  props,
) => controls.value[props.valueType ?? 'text']?.(props.control)
QueryControl.props = ['control', 'valueType']
function itemName(name: string) {
  return element.value ? { prop: name } : { name }
}
function add(position: 'top' | 'bottom', mode: 'cache' | 'source' = 'cache') {
  feedback.value = edit.add(undefined, { position, mode })
    ? mode === 'source'
      ? '已加入父表单明细，取消编辑会保留此行'
      : '已创建缓存行，保存前可取消'
    : '明细最多 16 行，请先处理已有明细'
}
async function locateError() {
  const key = errors.value.keys().next().value
  if (key === undefined) return
  applied.value = {}
  const row = source.value.find((item) => item.id === key)
  if (row && !edit.isEditing(key)) edit.start(row)
  await nextTick()
  await table.value?.scrollTo({ key, align: 'top' })
}
function makeOffscreenError() {
  const row = source.value[source.value.length - 1]
  if (!row) return
  if (!edit.isEditing(row.id)) edit.start(row)
  edit.setDraft(row.id, { name: '' })
  feedback.value = `已清空第 ${row.id} 行名称；提交申请将校验离屏草稿`
}
async function submitApplication() {
  if (submitting.value) return
  submitting.value = true
  feedback.value = ''
  try {
    if ((await mainHost.value?.validate()) === false) return
    const result = await edit.validateAll()
    if (!result.valid || !result.values) {
      feedback.value = result.obsolete
        ? '明细已变化，请重新提交'
        : `有 ${result.errors.size} 行需要完善，已定位首个错误`
      await locateError()
      return
    }
    submitCount.value++
    await delay(300)
    if (failNextSubmit.value) {
      failNextSubmit.value = false
      feedback.value = '提交失败，当前草稿已保留，可直接重试'
      return
    }
    source.value = result.values
    edit.reset()
    feedback.value = `已提交「${project.value.name}」，共 ${result.values.length} 条明细`
  } catch {
    feedback.value = '请先填写申请名称'
  } finally {
    submitting.value = false
  }
}
function resetDrafts() {
  edit.reset()
  feedback.value = '已还原到父表单当前明细'
  mainHost.value?.clearValidate?.()
}
void query.submit()
</script>

<template>
  <main class="pro-schema-page" :class="{ 'is-narrow': narrow }">
    <div class="pro-schema-controls">
      <component :is="button" @click="narrow = !narrow">{{
        narrow ? '宽容器' : '520px 窄容器'
      }}</component>
      <component :is="button" @click="virtual = !virtual">{{
        virtual ? '普通表体' : '虚拟表体'
      }}</component>
      <component :is="button" @click="light = !light">{{
        light ? '标准查询' : '轻量筛选'
      }}</component>
      <component :is="button" @click="autoSubmit = !autoSubmit">{{
        autoSubmit ? '关闭自动查询' : '开启自动查询（300ms）'
      }}</component>
      <component :is="button" @click="showAdvanced = !showAdvanced">{{
        showAdvanced ? '隐藏备注查询' : '显示备注查询'
      }}</component>
      <component :is="button" @click="omitHidden = !omitHidden">{{
        omitHidden ? '隐藏字段：省略' : '隐藏字段：保留'
      }}</component>
    </div>
    <section class="pro-schema-card pro-schema-query">
      <component :is="hostForm" ref="queryHost" :model="query.draft.value" :rules="queryRules">
        <VTableQuery
          ref="queryView"
          :query="query"
          :fields="fields"
          :controls="controls"
          root-tag="div"
          :layout="light ? 'light' : 'form'"
          :auto-submit="autoSubmit"
          :debounce-time="300"
          :hidden-policy="omitHidden ? 'omit' : 'preserve'"
          :validate="validateQuery"
          :collapsed-count="3"
        >
          <template #field="{ field, control }">
            <component :is="hostFormItem" v-bind="itemName(field.name)">
              <QueryControl :control="control" :value-type="field.valueType" />
            </component>
          </template>
        </VTableQuery>
      </component>
      <p class="pro-schema-feedback">
        查询 {{ requestCount }} 次 · 字典 {{ dictionaryCount }} 次 ·
        {{ light && autoSubmit ? '修改后自动查询' : '点击查询后生效' }}
      </p>
    </section>
    <section class="pro-schema-card">
      <div class="pro-schema-heading">
        <h3>采购申请</h3>
        <span>主表单与明细一次提交</span>
      </div>
      <component
        :is="hostForm"
        ref="mainHost"
        :model="project"
        :rules="projectRules"
        class="pro-schema-main-form"
      >
        <component :is="hostFormItem" v-bind="itemName('name')" label="申请名称">
          <ElInput v-if="element" v-model="project.name" placeholder="请输入申请名称" />
          <AntInput v-else v-model:value="project.name" placeholder="请输入申请名称" />
        </component>
      </component>
      <VTableToolbar title="申请明细" :options="{ setting: false }" @reload="queryView?.submit()">
        <template #actions>
          <component :is="button" @click="add('top')">新增顶部</component>
          <component :is="button" @click="add('bottom')">新增底部</component>
          <component :is="button" @click="add('bottom', 'source')">直接加入明细</component>
        </template>
      </VTableToolbar>
      <VTable
        ref="table"
        row-key="id"
        :columns="columns"
        :data-source="visibleRows"
        :virtual="virtual"
        :scroll="{ x: 1285, y: 340 }"
        :pagination="false"
      >
        <template #bodyCell="scope">
          <template v-if="scope.column.key === 'actions'">
            <div class="pro-schema-row-actions">
              <template v-if="edit.isEditing(scope.record.id)">
                <component
                  :is="button"
                  v-bind="actionProps"
                  :loading="savingKeys.has(scope.record.id)"
                  @click="edit.save(scope.record.id)"
                  >保存</component
                >
                <component :is="button" v-bind="actionProps" @click="edit.cancel(scope.record.id)"
                  >取消</component
                >
              </template>
              <component v-else :is="button" v-bind="actionProps" @click="edit.start(scope.record)"
                >编辑</component
              >
            </div>
          </template>
          <Editor v-else-if="edit.getCell(cellContext(scope))" :cell="cellContext(scope)" />
        </template>
      </VTable>
      <div class="pro-schema-form-actions">
        <component
          :is="button"
          type="primary"
          :loading="submitting || validating"
          @click="submitApplication"
          >提交申请</component
        >
        <component :is="button" @click="resetDrafts">重置草稿</component>
        <component :is="button" @click="makeOffscreenError">制造离屏错误</component>
        <component :is="button" @click="failNextSubmit = !failNextSubmit">{{
          failNextSubmit ? '下次提交将失败' : '模拟提交失败'
        }}</component>
        <component v-if="errors.size" :is="button" @click="locateError">定位错误</component>
      </div>
      <p v-if="feedback" class="pro-schema-result" role="status">{{ feedback }}</p>
      <p class="pro-schema-feedback">
        提交请求 {{ submitCount }} 次 · 单行保存 {{ rowSaves }} 次 · 父表单更新
        {{ sourceChanges }} 次 · 当前 {{ edit.records.value.length }} / 16 行
      </p>
      <p class="pro-schema-feedback">
        设备采购 03 的名称只读；会议服务数量固定为
        1。筛选仅影响显示，提交会校验当前全部客户端明细及离屏草稿。
      </p>
    </section>
  </main>
</template>

<style scoped>
.pro-schema-page {
  display: grid;
  gap: 16px;
  max-width: 1280px;
}

.pro-schema-page.is-narrow {
  max-width: 520px;
}

.pro-schema-controls,
.pro-schema-form-actions,
.pro-schema-row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.pro-schema-card {
  min-width: 0;
  padding: 16px 24px;
  background: var(--vtg-table-bg);
  border-radius: 6px;
}

.pro-schema-query {
  padding: 0;
}

.pro-schema-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 20px;
}

.pro-schema-heading h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.pro-schema-heading span,
.pro-schema-feedback {
  color: var(--color-muted);
  font-size: 13px;
}

.pro-schema-query :deep(.ant-form-item),
.pro-schema-query :deep(.el-form-item) {
  margin-bottom: 0;
}

.pro-schema-main-form {
  max-width: 420px;
}

.pro-schema-row-actions {
  flex-wrap: nowrap;
  gap: 0;
}

.pro-schema-form-actions {
  margin-top: 24px;
}

.pro-schema-feedback {
  margin: 12px 0 0;
}

.pro-schema-query > .pro-schema-feedback {
  margin: 0;
  padding: 0 24px 16px;
}

.pro-schema-result {
  margin: 16px 0 0;
  color: var(--color-primary);
}
</style>
