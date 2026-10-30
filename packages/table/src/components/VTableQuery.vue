<script
  setup
  lang="ts"
  generic="TValues extends object = Record<string, unknown>, TParams extends object = TValues"
>
import { ref } from 'vue'
import TableQuery from './TableQuery'
import type { TableQueryInstance, TableQueryProps, TableQuerySlots } from '../types/query-form'

defineOptions({ name: 'VTableQuery', inheritAttrs: false })
const props = withDefaults(defineProps<TableQueryProps<TValues, TParams>>(), { collapsible: true })
const emit = defineEmits<{ submitted: [success: boolean]; reset: [success: boolean] }>()
defineSlots<TableQuerySlots<TValues>>()
const inner = ref<TableQueryInstance>()
defineExpose<TableQueryInstance>({
  submit: () => inner.value?.submit() ?? Promise.resolve(false),
  reset: () => inner.value?.reset() ?? Promise.resolve(false),
  cancel: () => inner.value?.cancel(),
})
function withValuesType<T>(value: unknown): T {
  return value as T
}
</script>

<template>
  <TableQuery
    ref="inner"
    v-bind="{ ...$attrs, ...withValuesType<TableQueryProps>(props) }"
    @submitted="emit('submitted', $event)"
    @reset="emit('reset', $event)"
  >
    <template v-if="$slots.field" #field="scope"
      ><slot
        name="field"
        v-bind="
          withValuesType<Parameters<NonNullable<TableQuerySlots<TValues>['field']>>[0]>(scope)
        "
    /></template>
    <template v-if="$slots.actions" #actions="scope"
      ><slot name="actions" v-bind="scope"
    /></template>
  </TableQuery>
</template>
