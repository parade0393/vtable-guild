<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import TableToolbar from './TableToolbar'
import type { ColumnsType } from '../types'
import type { TableColumnSettingsSize } from '../types/column-settings'
import type { TableToolbarProps, TableToolbarSlots } from '../types/toolbar'

defineOptions({ name: 'VTableToolbar', inheritAttrs: false })
const props = withDefaults(defineProps<TableToolbarProps<TRecord>>(), { options: undefined })
const emit = defineEmits<{
  'update:columns': [columns: ColumnsType<TRecord>]
  'update:size': [size: TableColumnSettingsSize]
  reset: []
  reload: []
  'update:searchValue': [value: string]
  search: [value: string]
  clearSearch: []
  fullscreenChange: [active: boolean]
  fullscreenError: [error: unknown]
}>()
defineSlots<TableToolbarSlots<TRecord>>()

function withRecordType<T>(value: unknown): T {
  return value as T
}
</script>

<template>
  <TableToolbar
    v-bind="{ ...$attrs, ...withRecordType<TableToolbarProps>(props) }"
    @update:columns="emit('update:columns', withRecordType<ColumnsType<TRecord>>($event))"
    @update:size="emit('update:size', $event)"
    @reset="emit('reset')"
    @reload="emit('reload')"
    @update:search-value="emit('update:searchValue', $event)"
    @search="emit('search', $event)"
    @clear-search="emit('clearSearch')"
    @fullscreen-change="emit('fullscreenChange', $event)"
    @fullscreen-error="emit('fullscreenError', $event)"
  >
    <template v-if="$slots.title" #title="scope">
      <slot
        name="title"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['title']>>[0]>(scope)
        "
      />
    </template>
    <template v-if="$slots.actions" #actions="scope">
      <slot
        name="actions"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['actions']>>[0]>(scope)
        "
      />
    </template>
    <template v-if="$slots.settings" #settings="scope">
      <slot
        name="settings"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['settings']>>[0]>(scope)
        "
      />
    </template>
    <template v-if="$slots.columnLabel" #columnLabel="scope">
      <slot
        name="columnLabel"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['columnLabel']>>[0]>(
            scope,
          )
        "
      />
    </template>
    <template v-if="$slots.search" #search="scope">
      <slot
        name="search"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['search']>>[0]>(scope)
        "
      />
    </template>
    <template v-if="$slots.filter" #filter="scope">
      <slot
        name="filter"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['filter']>>[0]>(scope)
        "
      />
    </template>
    <template v-if="$slots.extra" #extra="scope">
      <slot
        name="extra"
        v-bind="
          withRecordType<Parameters<NonNullable<TableToolbarSlots<TRecord>['extra']>>[0]>(scope)
        "
      />
    </template>
  </TableToolbar>
</template>
