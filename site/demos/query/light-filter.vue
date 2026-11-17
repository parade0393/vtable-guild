<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import {
  Input,
  VTableQuery,
  useTableQuery,
  type TableControlRenderer,
  type TableControls,
  type TableQueryField,
  type TableQueryLocale,
} from '@vtable-guild/vtable-guild'

interface Values {
  keyword?: string
  status?: number
  assignee?: string
  tag?: string
}

const lang = inject('vtg-demo-lang', ref('zh-CN'))
const english = computed(() => lang.value.startsWith('en'))
const locale = computed<Partial<TableQueryLocale>>(() =>
  english.value ? { label: 'Filters', more: 'More filters', confirm: 'Apply', clear: 'Clear' } : {},
)
const fields = computed<TableQueryField<Values>[]>(() => [
  { name: 'keyword', label: english.value ? 'Keyword' : '关键词' },
  {
    name: 'status',
    label: english.value ? 'Status' : '状态',
    valueType: 'select',
    options: [
      { value: 1, label: english.value ? 'Open' : '进行中' },
      { value: 2, label: english.value ? 'Complete' : '已完成' },
    ],
  },
  { name: 'assignee', label: english.value ? 'Assignee' : '负责人', secondary: true },
  { name: 'tag', label: english.value ? 'Tag' : '标签', secondary: true },
])

const select: TableControlRenderer = (context) =>
  h(
    'select',
    {
      id: context.id,
      class: 'light-filter-demo-control',
      value: context.value === undefined ? '' : String(context.value),
      disabled: context.disabled || context.readonly,
      onChange: (event: Event) => {
        const value = (event.target as HTMLSelectElement).value
        context.onChange(value === '' ? undefined : Number(value))
      },
    },
    [
      h('option', { value: '' }, english.value ? 'Any status' : '不限状态'),
      ...context.options.map(({ value, label }) => h('option', { value: String(value) }, label)),
    ],
  )
select.lightFilter = { submitOnChange: true, closeOnChange: true }

const controls: TableControls = {
  text: (context) =>
    h(Input, {
      id: context.id,
      inputClass: 'light-filter-demo-control',
      value: String(context.value ?? ''),
      disabled: context.disabled || context.readonly,
      'onUpdate:value': (value: string) => context.onChange(value || undefined),
    }),
  select,
}

const collapse = ref(false)
const requests = ref(0)
const query = useTableQuery<Values>({
  defaultValues: { status: 1 },
  onSubmit() {
    requests.value++
  },
})
</script>

<template>
  <label style="display: inline-flex; gap: 6px; margin-bottom: 12px">
    <input v-model="collapse" type="checkbox" />
    {{ english ? 'Group all filters' : '合并全部筛选条件' }}
  </label>
  <VTableQuery
    :query="query"
    :fields="fields"
    :controls="controls"
    :locale="locale"
    :collapse="collapse"
    layout-type="LightFilter"
  />
  <p role="status">
    {{ english ? `Requests: ${requests} · Submitted params` : `请求 ${requests} 次 · 已提交参数` }}
  </p>
  <pre>{{ JSON.stringify(query.params.value ?? {}, null, 2) }}</pre>
</template>

<style>
.light-filter-demo-control {
  width: 100%;
  min-width: 0;
  height: var(--vtg-query-control-height, 32px);
  padding: 0 8px;
  color: var(--color-on-surface);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--vtg-input-border-radius);
}
</style>
