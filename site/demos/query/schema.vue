<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  Input,
  VTableQuery,
  createTableDictionary,
  useTableDictionary,
  useTableQuery,
  type TableControls,
  type TableQueryField,
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
const light = ref(false)
const autoSubmit = ref(false)
const omitHidden = ref(false)
const requests = ref(0)
const errors = ref<Partial<Record<keyof Values, string>>>({})
const status = useTableDictionary({
  dictionary: createTableDictionary({
    key: 'schema-demo-status',
    request: async () => ({
      options: [
        { value: 1, label: '进行中' },
        { value: 2, label: '已完成' },
      ],
      complete: true,
    }),
  }),
})
const query = useTableQuery<Values, Params>({
  defaultValues: { keyword: '', status: undefined, range: ['', ''], internal: '保留的隐藏条件' },
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
    label: '任务名称',
    valueType: 'text',
    fieldProps: { placeholder: '最多 12 个字符' },
  },
  { name: 'status', label: '状态', valueType: 'select', dictionary: status },
  { name: 'range', label: '日期区间', valueType: 'dateRange' },
  { name: 'internal', label: '内部条件', hidden: true },
])
// The documentation demo stays UI-library independent. Applications normally use the host factories.
const controls: TableControls = {
  text: (context) =>
    h(Input, {
      ...context.fieldProps,
      id: context.id,
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
        h('option', { value: '' }, '全部状态'),
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
          'aria-label': index ? '结束日期' : '开始日期',
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
  errors.value = values.keyword.length > 12 ? { keyword: '任务名称最多 12 个字符' } : {}
  return Object.keys(errors.value).length === 0
}
</script>

<template>
  <div class="schema-query-settings">
    <label><input v-model="light" type="checkbox" /> 轻量布局</label>
    <label><input v-model="autoSubmit" type="checkbox" /> 轻量模式自动提交（300ms）</label>
    <label><input v-model="omitHidden" type="checkbox" /> 省略隐藏条件</label>
  </div>
  <VTableQuery
    :query="query"
    :fields="fields"
    :controls="controls"
    :layout="light ? 'light' : 'form'"
    :auto-submit="autoSubmit"
    :debounce-time="300"
    :collapsed-count="2"
    :hidden-policy="omitHidden ? 'omit' : 'preserve'"
    :validate="validate"
    :errors="errors"
  />
  <p role="status">请求 {{ requests }} 次；只有提交成功才更新参数：</p>
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
  height: 32px;
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
