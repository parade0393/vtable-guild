<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { VTable, VTableColumnSettings } from '@vtable-guild/vtable-guild'
import type { TableColumnsType, TableColumnSettingsSize } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  city: string
  email: string
  status: string
}

const columns = shallowRef<TableColumnsType<Member>>([
  { key: 'name', dataIndex: 'name', title: '姓名', width: 130 },
  {
    key: 'contact',
    title: '联系信息',
    children: [
      { key: 'city', dataIndex: 'city', title: '城市', width: 110 },
      { key: 'email', dataIndex: 'email', title: '邮箱', width: 200, visible: false },
    ],
  },
  { key: 'status', dataIndex: 'status', title: '状态', width: 110 },
])
const size = ref<TableColumnSettingsSize>('middle')
const rows: Member[] = [
  { key: 1, name: '陈嘉', city: '杭州', email: 'chen@example.com', status: '在职' },
  { key: 2, name: '苏晚', city: '上海', email: 'su@example.com', status: '在职' },
  { key: 3, name: '周野', city: '深圳', email: 'zhou@example.com', status: '休假' },
]
</script>

<template>
  <VTable :columns="columns" :size="size" :data-source="rows" bordered>
    <template #title>
      <div class="settings-demo-heading">
        <span>团队成员</span>
        <VTableColumnSettings v-model:columns="columns" v-model:size="size" />
      </div>
    </template>
  </VTable>
</template>

<style scoped>
.settings-demo-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
