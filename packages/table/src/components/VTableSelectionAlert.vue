<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import TableSelectionAlert from './TableSelectionAlert'
import type { Key } from '../types/column'
import type { TableSelectionAlertProps, TableSelectionAlertSlots } from '../types/selection-alert'

defineOptions({ name: 'VTableSelectionAlert', inheritAttrs: false })
const props = withDefaults(defineProps<TableSelectionAlertProps<TRecord>>(), { showClear: true })
const emit = defineEmits<{
  'update:selectedRowKeys': [keys: Key[]]
  clear: [selectedRowKeys: readonly Key[], selectedRows: readonly TRecord[]]
}>()
defineSlots<TableSelectionAlertSlots<TRecord>>()

function withRecordType<T>(value: unknown): T {
  return value as T
}

function handleClear(keys: readonly Key[], records: readonly Record<string, unknown>[]) {
  emit('clear', keys, withRecordType<readonly TRecord[]>(records))
}
</script>

<template>
  <TableSelectionAlert
    v-bind="{ ...$attrs, ...withRecordType<TableSelectionAlertProps>(props) }"
    @update:selected-row-keys="emit('update:selectedRowKeys', $event)"
    @clear="handleClear"
  >
    <template v-if="$slots.info" #info="scope">
      <slot
        name="info"
        v-bind="
          withRecordType<Parameters<NonNullable<TableSelectionAlertSlots<TRecord>['info']>>[0]>(
            scope,
          )
        "
      />
    </template>
    <template v-if="$slots.actions" #actions="scope">
      <slot
        name="actions"
        v-bind="
          withRecordType<Parameters<NonNullable<TableSelectionAlertSlots<TRecord>['actions']>>[0]>(
            scope,
          )
        "
      />
    </template>
  </TableSelectionAlert>
</template>
