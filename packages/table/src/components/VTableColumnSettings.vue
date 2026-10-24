<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import TableColumnSettings from './TableColumnSettings'
import type { ColumnsType } from '../types'
import type {
  TableColumnSettingsProps,
  TableColumnSettingsSize,
  TableColumnSettingsSlots,
} from '../types/column-settings'

defineOptions({ name: 'VTableColumnSettings', inheritAttrs: false })
const props = defineProps<TableColumnSettingsProps<TRecord>>()
const emit = defineEmits<{
  'update:columns': [columns: ColumnsType<TRecord>]
  'update:size': [size: TableColumnSettingsSize]
  reset: []
}>()
defineSlots<TableColumnSettingsSlots<TRecord>>()

// The public generic bridge restores the caller's record type around the TSX implementation.
function withRecordType<T>(value: unknown): T {
  return value as T
}
</script>

<template>
  <TableColumnSettings
    v-bind="{ ...$attrs, ...withRecordType<TableColumnSettingsProps>(props) }"
    @update:columns="emit('update:columns', withRecordType<ColumnsType<TRecord>>($event))"
    @update:size="emit('update:size', $event)"
    @reset="emit('reset')"
  >
    <template v-if="$slots.columnLabel" #columnLabel="scope">
      <slot
        name="columnLabel"
        v-bind="
          withRecordType<
            Parameters<NonNullable<TableColumnSettingsSlots<TRecord>['columnLabel']>>[0]
          >(scope)
        "
      />
    </template>
  </TableColumnSettings>
</template>
