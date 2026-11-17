<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import {
  Input,
  VTableQuery,
  createTableDictionary,
  useTableDictionary,
  useTableQuery,
  type TableControls,
  type TableQueryField,
  type TableQueryLocale,
} from '@vtable-guild/vtable-guild'

interface Values {
  keyword: string
  status: number | undefined
  range: [string, string]
  internal: string
}
interface Params {
  keyword: string
  status: number
  start: string
  end: string
  internal: string
}
const lang = inject('vtg-demo-lang', ref('zh-CN'))
const english = computed(() => lang.value.startsWith('en'))
const labels = computed(() =>
  english.value
    ? {
        keyword: 'Task',
        status: 'Status',
        active: 'In progress',
        completed: 'Completed',
        all: 'All statuses',
        range: 'Date range',
        start: 'Start date',
        end: 'End date',
        internal: 'Internal filter',
        placeholder: 'Up to 12 characters',
        invalid: 'Enter up to 12 characters',
        narrow: 'Narrow container',
        omit: 'Omit hidden fields on submit',
      }
    : {
        keyword: '任务',
        status: '状态',
        active: '进行中',
        completed: '已完成',
        all: '全部状态',
        range: '日期区间',
        start: '开始日期',
        end: '结束日期',
        internal: '内部条件',
        placeholder: '最多 12 个字符',
        invalid: '任务名称最多 12 个字符',
        narrow: '窄容器',
        omit: '提交时省略隐藏字段',
      },
)
const locale = computed<Partial<TableQueryLocale>>(() =>
  english.value
    ? {
        label: 'Query',
        submit: 'Search',
        reset: 'Reset',
        expand: 'Expand',
        collapse: 'Collapse',
        validationFailed: 'Validation failed',
      }
    : {},
)
const narrow = ref(false)
const omitHidden = ref(false)
const requests = ref(0)
const errors = ref<Partial<Record<keyof Values, string>>>({})
const status = useTableDictionary({
  dictionary: createTableDictionary({
    key: 'schema-demo-status',
    request: async () => ({
      options: [
        { value: 1, label: labels.value.active },
        { value: 2, label: labels.value.completed },
      ],
      complete: true,
    }),
  }),
})
const query = useTableQuery<Values, Params>({
  defaultValues: { keyword: '', status: undefined, range: ['', ''], internal: 'demo' },
  fieldTransforms: {
    range: ([start, end]) => ({ start: start || undefined, end: end || undefined }),
  },
  onSubmit() {
    requests.value++
  },
  onReset() {
    requests.value++
  },
})
const fields = computed<TableQueryField<Values>[]>(() => [
  {
    name: 'keyword',
    label: labels.value.keyword,
    valueType: 'text',
    fieldProps: { placeholder: labels.value.placeholder },
  },
  { name: 'status', label: labels.value.status, valueType: 'select', dictionary: status },
  { name: 'range', label: labels.value.range, valueType: 'dateRange', colSize: 2 },
  { name: 'internal', label: labels.value.internal, hidden: true },
])
// The documentation demo stays UI-library independent. Applications normally use the host factories.
const controls: TableControls = {
  text: (context) =>
    h(Input, {
      ...context.fieldProps,
      id: context.id,
      inputClass: 'schema-query-native',
      value: String(context.value ?? ''),
      disabled: context.disabled || context.readonly,
      'onUpdate:value': context.onChange,
    }),
  select: (context) =>
    h(
      'select',
      {
        id: context.id,
        class: 'schema-query-native',
        value: context.value === undefined ? '' : String(context.value),
        disabled: context.disabled || context.readonly,
        onChange: (event: Event) => {
          const value = (event.target as HTMLSelectElement).value
          context.onChange(value === '' ? undefined : Number(value))
        },
      },
      [
        h('option', { value: '' }, labels.value.all),
        ...context.options.map((option) =>
          h('option', { value: String(option.value) }, option.label),
        ),
      ],
    ),
  dateRange: (context) =>
    h(
      'div',
      { class: 'schema-query-range' },
      [0, 1].map((index) =>
        h('input', {
          type: 'date',
          class: 'schema-query-native',
          value: (context.value as [string, string])[index],
          disabled: context.disabled || context.readonly,
          'aria-label': index ? labels.value.end : labels.value.start,
          onInput: (event: Event) => {
            const value = [...(context.value as [string, string])]
            value[index] = (event.target as HTMLInputElement).value
            context.onChange(value)
          },
        }),
      ),
    ),
}
function validate(values: Readonly<Values>) {
  errors.value = values.keyword.length > 12 ? { keyword: labels.value.invalid } : {}
  return Object.keys(errors.value).length === 0
}
</script>

<template>
  <div class="schema-query-settings">
    <label><input v-model="narrow" type="checkbox" /> {{ labels.narrow }}</label>
    <label><input v-model="omitHidden" type="checkbox" /> {{ labels.omit }}</label>
  </div>
  <div :style="{ maxWidth: narrow ? '400px' : undefined }">
    <VTableQuery
      :query="query"
      :fields="fields"
      :controls="controls"
      :locale="locale"
      :preserve="!omitHidden"
      :validate="validate"
      :errors="errors"
    />
  </div>
  <p role="status">
    {{ english ? `Requests: ${requests} · Submitted params` : `请求 ${requests} 次 · 已提交参数` }}
  </p>
  <pre>{{ JSON.stringify(query.params.value ?? {}, null, 2) }}</pre>
</template>

<style>
.schema-query-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.schema-query-settings label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.schema-query-native {
  width: 100%;
  min-width: 0;
  height: var(--vtg-query-control-height, 32px);
  padding: 0 8px;
  color: var(--color-on-surface);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--vtg-input-border-radius);
}

.schema-query-range {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.schema-query-range > input {
  flex: 1 1 132px;
}
</style>
