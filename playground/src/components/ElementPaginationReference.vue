<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ElConfigProvider, ElPagination, ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import enUS from 'element-plus/es/locale/lang/en'
import type { TablePaginationConfig } from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Row {
  key: number
  name: string
  group?: string
}
const props = defineProps<{
  data: Row[]
  columns: { key: string; dataIndex: string; title: string; width?: number }[]
  pagination: TablePaginationConfig
  nativeLayout?: string
  height?: number
  selection?: boolean
}>()
const emit = defineEmits<{ selectionChange: [count: number] }>()
const playground = inject(PLAYGROUND_CONTEXT_KEY)!
const locale = computed(() => (playground.locale.value === 'en-US' ? enUS : zhCN))
const innerCurrent = ref(props.pagination.defaultCurrent ?? 1)
const innerSize = ref(props.pagination.defaultPageSize ?? 10)
const pageSize = computed(() => props.pagination.pageSize ?? innerSize.value)
const total = computed(() => props.pagination.total ?? props.data.length)
const pagerCount = computed(() => {
  const count = props.pagination.pagerCount
  return count !== undefined &&
    Number.isInteger(count) &&
    count >= 5 &&
    count <= 21 &&
    count % 2 === 1
    ? count
    : props.pagination.showLessItems
      ? 5
      : 7
})
const current = computed(() =>
  Math.min(
    props.pagination.current ?? innerCurrent.value,
    Math.max(1, Math.ceil(total.value / pageSize.value)),
  ),
)
const rows = computed(() =>
  props.data.length < total.value && props.data.length <= pageSize.value
    ? props.data
    : props.data.slice((current.value - 1) * pageSize.value, current.value * pageSize.value),
)
const layout = computed(() =>
  [
    props.pagination.showTotal && !props.pagination.simple ? 'slot' : '',
    !props.pagination.simple && (props.pagination.showSizeChanger ?? total.value > 50)
      ? 'sizes'
      : '',
    'prev',
    'pager',
    'next',
    props.pagination.showQuickJumper && !props.pagination.simple ? 'jumper' : '',
  ]
    .filter(Boolean)
    .join(', '),
)
const TotalText = () =>
  props.pagination.showTotal?.(total.value, [
    total.value === 0 ? 0 : (current.value - 1) * pageSize.value + 1,
    Math.min(current.value * pageSize.value, total.value),
  ])
function change(page: number, size: number) {
  innerCurrent.value = page
  innerSize.value = size
  props.pagination.onChange?.(page, size)
}
</script>

<template>
  <ElConfigProvider :locale="locale">
    <ElPagination
      v-if="pagination.position?.some((p) => p.startsWith('top'))"
      :current-page="current"
      :page-size="pageSize"
      :total="total"
      :layout="nativeLayout ?? layout"
      :page-sizes="(pagination.pageSizeOptions ?? [10, 20, 50, 100]).map(Number)"
      :pager-count="pagerCount"
      :size="pagination.size"
      :disabled="pagination.disabled"
      :hide-on-single-page="pagination.hideOnSinglePage"
      class="element-pagination-reference__pager"
      @update:current-page="innerCurrent = $event"
      @update:page-size="innerSize = $event"
      @change="change"
    >
      <slot name="pagination" :current="current" :page-size="pageSize" :total="total">
        <span class="el-pagination__total"><TotalText /></span>
      </slot>
    </ElPagination>
    <ElTable
      :data="rows"
      row-key="key"
      :height="height"
      @selection-change="emit('selectionChange', $event.length)"
    >
      <ElTableColumn v-if="selection" type="selection" :reserve-selection="true" width="48" />
      <ElTableColumn
        v-for="column in columns"
        :key="column.key"
        :prop="column.dataIndex"
        :label="column.title"
        :width="column.width"
      />
    </ElTable>
    <ElPagination
      :current-page="current"
      :page-size="pageSize"
      :total="total"
      :layout="nativeLayout ?? layout"
      :page-sizes="(pagination.pageSizeOptions ?? [10, 20, 50, 100]).map(Number)"
      :pager-count="pagerCount"
      :size="pagination.size"
      :disabled="pagination.disabled"
      :hide-on-single-page="pagination.hideOnSinglePage"
      class="element-pagination-reference__pager"
      @update:current-page="innerCurrent = $event"
      @update:page-size="innerSize = $event"
      @change="change"
    >
      <slot name="pagination" :current="current" :page-size="pageSize" :total="total">
        <span class="el-pagination__total"><TotalText /></span>
      </slot>
    </ElPagination>
    <p v-if="pagination.simple" class="play-inline-note">
      Element Plus 无 simple 模式，此处显示原生页码列表。
    </p>
    <p v-if="typeof pagination.showQuickJumper === 'object'" class="play-inline-note">
      Element Plus 无 Go 按钮，此处使用原生跳页输入。
    </p>
  </ElConfigProvider>
</template>

<style scoped>
.element-pagination-reference__pager {
  justify-content: flex-end;
  padding-block: 16px;
}
</style>
