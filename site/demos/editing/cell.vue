<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface MemberRow {
  key: string
  name: string
  team: string
  role: string
}

type EditableField = 'name' | 'team' | 'role'

interface CellDraft {
  rowKey: string
  field: EditableField
  value: string
}

const columns: TableColumnsType<MemberRow> = [
  { title: '成员', dataIndex: 'name', key: 'name', width: 160 },
  { title: '团队', dataIndex: 'team', key: 'team', width: 140 },
  { title: '职责', dataIndex: 'role', key: 'role' },
]

const dataSource = ref<MemberRow[]>([
  { key: 'member-001', name: '陈嘉', team: '平台', role: '前端开发' },
  { key: 'member-002', name: '林悦', team: '交易', role: '产品设计' },
  { key: 'member-003', name: '周野', team: '数据', role: '数据分析' },
])

const draft = ref<CellDraft | null>(null)
const editor = ref<HTMLInputElement | null>(null)
const composing = ref(false)

function isEditableField(value: unknown): value is EditableField {
  return value === 'name' || value === 'team' || value === 'role'
}

function isEditing(rowKey: string, dataIndex: unknown) {
  return (
    isEditableField(dataIndex) && draft.value?.rowKey === rowKey && draft.value.field === dataIndex
  )
}

async function startEditing(record: MemberRow, dataIndex: unknown) {
  if (!isEditableField(dataIndex)) return

  draft.value = {
    rowKey: record.key,
    field: dataIndex,
    value: record[dataIndex],
  }
  await nextTick()
  editor.value?.focus()
  editor.value?.select()
}

function updateDraft(event: Event) {
  if (draft.value) draft.value.value = (event.target as HTMLInputElement).value
}

function commitEditing(rowKey: string, dataIndex: unknown) {
  const current = draft.value
  if (!current || !isEditableField(dataIndex)) return
  if (current.rowKey !== rowKey || current.field !== dataIndex) return

  dataSource.value = dataSource.value.map((record) =>
    record.key === rowKey ? { ...record, [dataIndex]: current.value } : record,
  )
  draft.value = null
  composing.value = false
}

function cancelEditing() {
  draft.value = null
  composing.value = false
}

function handleEditorKeydown(event: KeyboardEvent, rowKey: string, dataIndex: unknown) {
  if (event.key === 'Enter') {
    if (event.isComposing || composing.value) return
    event.preventDefault()
    commitEditing(rowKey, dataIndex)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEditing()
  }
}

function replaceAndReverseRows() {
  dataSource.value = dataSource.value
    .slice()
    .reverse()
    .map((record) => ({ ...record }))
}
</script>

<template>
  <div class="editing-demo">
    <div class="editing-demo__toolbar">
      <span>数据版本 {{ dataSource.map((record) => record.key).join(' / ') }}</span>
      <button
        type="button"
        class="editing-demo__toolbar-action"
        data-testid="replace-rows"
        @mousedown.prevent
        @click="replaceAndReverseRows"
      >
        倒序并替换数据
      </button>
    </div>

    <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable>
      <template #bodyCell="{ column, record, text }">
        <template v-if="isEditableField(column.dataIndex)">
          <input
            v-if="isEditing(record.key, column.dataIndex)"
            ref="editor"
            class="editing-demo__field"
            :data-editor="`${record.key}:${String(column.dataIndex)}`"
            :value="draft?.value ?? ''"
            @input="updateDraft"
            @blur="commitEditing(record.key, column.dataIndex)"
            @compositionstart="composing = true"
            @compositionend="composing = false"
            @keydown="handleEditorKeydown($event, record.key, column.dataIndex)"
          />
          <button
            v-else
            type="button"
            class="editing-demo__value"
            :data-cell="`${record.key}:${String(column.dataIndex)}`"
            @click="startEditing(record, column.dataIndex)"
          >
            {{ text }}
          </button>
        </template>
        <template v-else>{{ text }}</template>
      </template>
    </VTable>
  </div>
</template>

<style scoped>
.editing-demo {
  min-width: 0;
}

.editing-demo__toolbar {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-muted);
  font-size: 12px;
}

.editing-demo__toolbar-action,
.editing-demo__value {
  border: 0;
  color: inherit;
  font: inherit;
  background: transparent;
  cursor: pointer;
}

.editing-demo__toolbar-action {
  flex: none;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--vtg-btn-border-radius-sm);
  color: var(--color-primary);
}

.editing-demo__toolbar-action:hover {
  border-color: var(--color-primary);
}

.editing-demo__value {
  display: block;
  width: 100%;
  min-height: 24px;
  padding: 2px 4px;
  border-radius: var(--vtg-input-border-radius);
  overflow: hidden;
  color: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editing-demo__value:hover {
  background: var(--color-control-item-hover-bg);
}

.editing-demo__value:focus-visible,
.editing-demo__toolbar-action:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.editing-demo__field {
  box-sizing: border-box;
  width: 100%;
  height: var(--vtg-input-height);
  padding: 0 var(--vtg-input-padding-inline);
  border: 1px solid var(--color-primary);
  border-radius: var(--vtg-input-border-radius);
  outline: 0;
  color: var(--color-on-surface);
  font: inherit;
  background: var(--color-surface);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

@media (width <= 640px) {
  .editing-demo__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
