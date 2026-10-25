<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, useTableEdit, VTable } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  team: string
}

const rows = ref<Member[]>([
  { key: 1, name: '苏晚', team: '设计系统' },
  { key: 2, name: '何川', team: '平台' },
])
const columns: TableColumnsType<Member> = [
  { key: 'name', title: '成员', dataIndex: 'name' },
  { key: 'team', title: '团队', dataIndex: 'team' },
  { key: 'actions', title: '操作', width: 200 },
]
let nextKey = -1
const edit = useTableEdit<Member>({
  rowKey: 'key',
  mode: 'multiple',
  validate: (draft) => (draft.name.trim() ? undefined : { fields: { name: '请输入成员姓名' } }),
  onSave: async (draft, { isNew, signal }) => {
    // Replace this boundary with a server request and pass signal to the HTTP client.
    await Promise.resolve()
    if (signal.aborted) return
    const saved = { ...draft, name: draft.name.trim() }
    rows.value = isNew
      ? [...rows.value, saved]
      : rows.value.map((row) => (row.key === saved.key ? saved : row))
    return saved
  },
})
const { savingKeys, cancellingKeys, errors, newRecords } = edit
const dataSource = computed(() => [...rows.value, ...newRecords.value])

function addMember() {
  edit.add({ key: nextKey--, name: '', team: '平台' })
}

function update(record: Member, field: 'name' | 'team', event: Event) {
  edit.setDraft(record.key, { [field]: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="edit-protocol-demo">
    <Button @click="addMember">新增成员</Button>
    <VTable :columns="columns" :data-source="dataSource" row-key="key" bordered>
      <template #bodyCell="{ column, record, text }">
        <template
          v-if="edit.isEditing(record.key) && (column.key === 'name' || column.key === 'team')"
        >
          <input
            class="edit-protocol-demo__input"
            :aria-label="column.key === 'name' ? '成员姓名' : '团队'"
            :aria-invalid="!!errors.get(record.key)?.fields?.[column.key]"
            :value="edit.getDraft(record.key)?.[column.key]"
            :disabled="savingKeys.has(record.key) || cancellingKeys.has(record.key)"
            @input="update(record, column.key, $event)"
          />
          <span v-if="errors.get(record.key)?.fields?.[column.key]" role="alert">
            {{ errors.get(record.key)?.fields?.[column.key] }}
          </span>
        </template>
        <template v-else-if="column.key === 'actions'">
          <template v-if="edit.isEditing(record.key)">
            <Button
              :disabled="savingKeys.has(record.key) || cancellingKeys.has(record.key)"
              @click="edit.save(record.key)"
            >
              {{ savingKeys.has(record.key) ? '保存中…' : '保存' }}
            </Button>
            <Button @click="edit.cancel(record.key)">取消</Button>
            <span v-if="errors.get(record.key) && !errors.get(record.key)?.fields" role="alert">
              {{ errors.get(record.key)?.message }}
            </span>
          </template>
          <Button v-else @click="edit.start(record)">编辑</Button>
        </template>
        <template v-else>{{ text }}</template>
      </template>
    </VTable>
  </div>
</template>

<style scoped>
.edit-protocol-demo {
  display: grid;
  gap: 12px;
}

.edit-protocol-demo__input {
  box-sizing: border-box;
  width: 100%;
  height: var(--vtg-input-height);
  padding: 0 var(--vtg-input-padding-inline);
  border: 1px solid var(--color-border);
  border-radius: var(--vtg-input-border-radius);
  color: var(--color-on-surface);
  font: inherit;
  background: var(--color-surface);
}

.edit-protocol-demo__input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
