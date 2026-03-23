<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import { computed, useAttrs } from 'vue'
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

const props = defineProps<TableProps<TRecord>>()

const emit = defineEmits<{
  change: [filters: TableFiltersInfo, sorter: VTableSorterResult<TRecord>, extra: TableChangeExtra<TRecord>]
  resizeColumn: [column: ColumnType<TRecord>, width: number]
}>()

defineSlots<TableSlotsDecl<TRecord>>()

const attrs = useAttrs()
const forwardedBindings = computed(() => ({
  ...(attrs as Record<string, unknown>),
  ...(props as any),
}))

function handleChange(
  filters: TableFiltersInfo,
  sorter: SorterResult<Record<string, unknown>>,
  extra: TableChangeExtra<Record<string, unknown>>,
) {
  emit(
    'change',
    filters,
    sorter as unknown as VTableSorterResult<TRecord>,
    extra as unknown as TableChangeExtra<TRecord>,
  )
}

function handleResizeColumn(column: ColumnType<Record<string, unknown>>, width: number) {
  emit('resizeColumn', column as unknown as ColumnType<TRecord>, width)
}

function asBodyCellSlotProps(slotProps: TableBodyCellSlotProps<Record<string, unknown>>) {
  return slotProps as unknown as TableBodyCellSlotProps<TRecord>
}

function asHeaderCellSlotProps(
  slotProps: TableHeaderCellSlotProps<Record<string, unknown>>,
) {
  return slotProps as unknown as TableHeaderCellSlotProps<TRecord>
}

function asCustomFilterDropdownSlotProps(
  slotProps: CustomFilterDropdownSlotProps<Record<string, unknown>>,
) {
  return slotProps as unknown as CustomFilterDropdownSlotProps<TRecord>
}

function asCustomFilterIconSlotProps(slotProps: {
  column: ColumnType<Record<string, unknown>>
  filtered: boolean
}) {
  return slotProps as unknown as { column: ColumnType<TRecord>; filtered: boolean }
}

function asDataSlotProps(slotProps: TableDataSlotProps<Record<string, unknown>>) {
  return slotProps as unknown as TableDataSlotProps<TRecord>
}
</script>

<template>
  <TableImpl v-bind="forwardedBindings" @change="handleChange" @resize-column="handleResizeColumn">
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
