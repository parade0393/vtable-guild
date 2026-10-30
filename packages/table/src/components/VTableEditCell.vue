<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>">
import type { UseTableEditableReturn } from '../types/editable'
import type { TableBodyCellSlotProps } from '../types/table'

defineOptions({ name: 'VTableEditCell', inheritAttrs: false })
const props = defineProps<{
  edit: Pick<UseTableEditableReturn<TRecord>, 'renderEditor'>
  cell: TableBodyCellSlotProps<TRecord>
}>()
// This bridge has a stable component identity so a draft update preserves focus and host state.
const Render = () =>
  props.edit.renderEditor({
    ...props.cell,
    value: props.cell.text,
    renderIndex: props.cell.index,
  })
</script>

<template><Render /></template>
