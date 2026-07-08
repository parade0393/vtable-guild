<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import { getCurrentInstance } from 'vue'
import TableImpl from './Table'
import type {
  ColumnType,
  CustomFilterDropdownSlotProps,
  TableChangeExtra,
  TableDataSlotProps,
  TableBodyCellSlotProps,
  TableFiltersInfo,
  TableHeaderCellSlotProps,
  TableProps,
  TableSlotsDecl,
  VTableSorterResult,
} from '../types'
import type { SorterResult } from '../composables'

defineOptions({
  name: 'VTable',
})

defineProps<TableProps<TRecord>>()

const emit = defineEmits<{
  change: [
    filters: TableFiltersInfo,
    sorter: VTableSorterResult<TRecord>,
    extra: TableChangeExtra<TRecord>,
  ]
  resizeColumn: [column: ColumnType<TRecord>, width: number]
}>()

defineSlots<TableSlotsDecl<TRecord>>()

const instance = getCurrentInstance()
function getForwardedBindings() {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(instance?.vnode.props ?? {})) {
    if (key !== 'onChange' && key !== 'onResizeColumn') {
      result[key] = value
    }
  }
  return result
}

/**
 * 泛型桥接（唯一的类型断言点）：
 * 内部 TSX 实现（Table.tsx）以 Record<string, unknown> 单态运行，
 * SFC 层持有调用方的真实 TRecord。运行时对象本就是调用方传入的数据，
 * 这里仅做类型还原，无运行时成本。
 */
function withRecordType<T>(value: unknown): T {
  return value as T
}

function handleChange(
  filters: TableFiltersInfo,
  sorter: SorterResult<Record<string, unknown>>,
  extra: TableChangeExtra<Record<string, unknown>>,
) {
  emit(
    'change',
    filters,
    withRecordType<VTableSorterResult<TRecord>>(sorter),
    withRecordType<TableChangeExtra<TRecord>>(extra),
  )
}

function handleResizeColumn(column: ColumnType<Record<string, unknown>>, width: number) {
  emit('resizeColumn', withRecordType<ColumnType<TRecord>>(column), width)
}

function asBodyCellSlotProps(slotProps: TableBodyCellSlotProps<Record<string, unknown>>) {
  return withRecordType<TableBodyCellSlotProps<TRecord>>(slotProps)
}

function asHeaderCellSlotProps(slotProps: TableHeaderCellSlotProps<Record<string, unknown>>) {
  return withRecordType<TableHeaderCellSlotProps<TRecord>>(slotProps)
}

function asCustomFilterDropdownSlotProps(
  slotProps: CustomFilterDropdownSlotProps<Record<string, unknown>>,
) {
  return withRecordType<CustomFilterDropdownSlotProps<TRecord>>(slotProps)
}

function asCustomFilterIconSlotProps(slotProps: {
  column: ColumnType<Record<string, unknown>>
  filtered: boolean
}) {
  return withRecordType<{ column: ColumnType<TRecord>; filtered: boolean }>(slotProps)
}

function asDataSlotProps(slotProps: TableDataSlotProps<Record<string, unknown>>) {
  return withRecordType<TableDataSlotProps<TRecord>>(slotProps)
}
</script>

<template>
  <TableImpl
    v-bind="getForwardedBindings()"
    @change="handleChange"
    @resize-column="handleResizeColumn"
  >
    <template v-if="$slots.bodyCell" #bodyCell="slotProps">
      <slot name="bodyCell" v-bind="asBodyCellSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.headerCell" #headerCell="slotProps">
      <slot name="headerCell" v-bind="asHeaderCellSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.empty" #empty>
      <slot name="empty" />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.customFilterDropdown" #customFilterDropdown="slotProps">
      <slot name="customFilterDropdown" v-bind="asCustomFilterDropdownSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.customFilterIcon" #customFilterIcon="slotProps">
      <slot name="customFilterIcon" v-bind="asCustomFilterIconSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.title" #title="slotProps">
      <slot name="title" v-bind="asDataSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.footer" #footer="slotProps">
      <slot name="footer" v-bind="asDataSlotProps(slotProps)" />
    </template>
    <template v-if="$slots.summary" #summary>
      <slot name="summary" />
    </template>
  </TableImpl>
</template>
