<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface MemberRow {
  key: string
  name: string
  team: string
  role: string
}

type EditableField = 'name' | 'team' | 'role'

const columns: TableColumnsType<MemberRow> = [
  { title: '成员', dataIndex: 'name', key: 'name', width: 150 },
  { title: '团队', dataIndex: 'team', key: 'team', width: 130 },
  { title: '职责', dataIndex: 'role', key: 'role' },
  { title: '操作', key: 'actions', width: 136 },
]

const dataSource = ref<MemberRow[]>([
  { key: 'member-101', name: '苏晚', team: '设计系统', role: '交互设计' },
  { key: 'member-102', name: '何川', team: '平台', role: '前端开发' },
  { key: 'member-103', name: '顾言', team: '交易', role: '质量保障' },
])

const editingRowKey = ref<string | null>(null)
const rowDraft = ref<MemberRow | null>(null)

function isEditableField(value: unknown): value is EditableField {
  return value === 'name' || value === 'team' || value === 'role'
}

function startEditing(record: MemberRow) {
  editingRowKey.value = record.key
  rowDraft.value = { ...record }
}

function draftValue(dataIndex: unknown) {
  return rowDraft.value && isEditableField(dataIndex) ? rowDraft.value[dataIndex] : ''
}

function updateDraft(event: Event, dataIndex: unknown) {
  if (!rowDraft.value || !isEditableField(dataIndex)) return
  rowDraft.value[dataIndex] = (event.target as HTMLInputElement).value
}

function saveRow(rowKey: string) {
  if (!rowDraft.value || editingRowKey.value !== rowKey) return

  dataSource.value = dataSource.value.map((record) =>
    record.key === rowKey ? { ...rowDraft.value! } : record,
  )
  cancelEditing()
}

function cancelEditing() {
  editingRowKey.value = null
  rowDraft.value = null
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable>
    <template #bodyCell="{ column, record, text }">
      <template v-if="editingRowKey === record.key && isEditableField(column.dataIndex)">
        <select
          v-if="column.dataIndex === 'team'"
          class="row-editing-demo__field"
          :data-row-field="`${record.key}:team`"
          :value="draftValue(column.dataIndex)"
          @change="updateDraft($event, column.dataIndex)"
        >
          <option>平台</option>
          <option>交易</option>
          <option>数据</option>
          <option>设计系统</option>
        </select>
        <input
          v-else
          class="row-editing-demo__field"
          :data-row-field="`${record.key}:${String(column.dataIndex)}`"
          :value="draftValue(column.dataIndex)"
          @input="updateDraft($event, column.dataIndex)"
        />
      </template>

      <template v-else-if="column.key === 'actions'">
        <span v-if="editingRowKey === record.key" class="row-editing-demo__actions">
          <button
            type="button"
            class="row-editing-demo__action row-editing-demo__action--primary"
            :data-row-action="`${record.key}:save`"
            @click="saveRow(record.key)"
          >
            保存
          </button>
          <button
            type="button"
            class="row-editing-demo__action"
            :data-row-action="`${record.key}:cancel`"
            @click="cancelEditing"
          >
            取消
          </button>
        </span>
        <button
          v-else
          type="button"
          class="row-editing-demo__action row-editing-demo__action--primary"
          :data-row-action="`${record.key}:edit`"
          @click="startEditing(record)"
        >
          编辑
        </button>
      </template>

      <template v-else>{{ text }}</template>
    </template>
  </VTable>
</template>

<style scoped>
.row-editing-demo__field {
  box-sizing: border-box;
  width: 100%;
  height: var(--vtg-input-height);
  padding: 0 var(--vtg-input-padding-inline);
  border: 1px solid var(--color-border);
  border-radius: var(--vtg-input-border-radius);
  outline: 0;
  color: var(--color-on-surface);
  font: inherit;
  background: var(--color-surface);
}

.row-editing-demo__field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.row-editing-demo__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.row-editing-demo__action {
  padding: 2px 0;
  border: 0;
  outline: 0;
  color: var(--color-muted);
  font: inherit;
  background: transparent;
  cursor: pointer;
}

.row-editing-demo__action:hover,
.row-editing-demo__action--primary {
  color: var(--color-primary);
}

.row-editing-demo__action:focus-visible {
  border-radius: 2px;
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
