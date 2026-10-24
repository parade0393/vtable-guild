<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Button, VTable, VTableColumnSettings, useColumnState } from '@vtable-guild/vtable-guild'
import type { TableColumnsType, TableColumnSettingsSize } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  city: string
  email: string
  status: string
}

const definitions = shallowRef<TableColumnsType<Member>>([
  { key: 'name', dataIndex: 'name', title: '姓名', width: 130, fixed: 'left', disable: true },
  { key: 'city', dataIndex: 'city', title: '城市', width: 110 },
  {
    key: 'details',
    title: '联系信息',
    children: [
      { key: 'email', dataIndex: 'email', title: '邮箱', width: 210 },
      { key: 'status', dataIndex: 'status', title: '状态', width: 100, visible: false },
    ],
  },
])
const { columns, reset } = useColumnState(definitions, {
  storageKey: 'vtg-demo:member-column-preferences',
  version: 1,
})
const size = ref<TableColumnSettingsSize>('middle')
const rows: Member[] = [
  { key: 1, name: '陈嘉', city: '杭州', email: 'chen@example.com', status: '在职' },
  { key: 2, name: '苏晚', city: '上海', email: 'su@example.com', status: '在职' },
]
</script>

<template>
  <VTable :columns="columns" :size="size" :data-source="rows" :scroll="{ x: 650 }" bordered>
    <template #title>
      <div class="preferences-heading">
        <span>列偏好会在刷新页面后恢复；姓名列保持锁定。</span>
        <div class="preferences-actions">
          <Button size="sm" @click="reset">恢复全部列偏好</Button>
          <VTableColumnSettings v-model:columns="columns" v-model:size="size" />
        </div>
      </div>
    </template>
  </VTable>
</template>

<style scoped>
.preferences-heading,
.preferences-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
