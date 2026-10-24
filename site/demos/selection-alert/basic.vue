<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, VTable, VTableSelectionAlert } from '@vtable-guild/vtable-guild'
import type { Key, TableColumnsType } from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  city: string
}

const columns: TableColumnsType<Member> = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'city', title: '城市', dataIndex: 'city' },
]
const allRows: Member[] = [
  { key: 1, name: '陈嘉', city: '杭州' },
  { key: 2, name: '苏晚', city: '上海' },
  { key: 3, name: '周野', city: '深圳' },
  { key: 4, name: '林澄', city: '北京' },
]
const page = ref(1)
const selectedRowKeys = ref<Key[]>([])
const visibleRows = computed(() => allRows.slice((page.value - 1) * 2, page.value * 2))
const availableSelectedRows = computed(() =>
  visibleRows.value.filter((row) => selectedRowKeys.value.includes(row.key)),
)
const selection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: Key[]) => {
    selectedRowKeys.value = keys
  },
}))
const message = ref('')
function approve(keys: readonly Key[]) {
  message.value = keys.length ? `提交审核的 keys：${keys.join('、')}` : '请先选择记录'
}
</script>

<template>
  <div class="selection-alert-demo">
    <VTableSelectionAlert
      v-model:selected-row-keys="selectedRowKeys"
      :selected-rows="availableSelectedRows"
      always-show
      @clear="message = '已清空选择'"
    >
      <template #actions="{ selectedRowKeys: keys, selectedRows, disabled }">
        <span>当页可用记录 {{ selectedRows.length }} 条</span>
        <Button :disabled="disabled || !keys.length" @click="approve(keys)">批量审核</Button>
      </template>
    </VTableSelectionAlert>
    <VTable
      row-key="key"
      :columns="columns"
      :data-source="visibleRows"
      :row-selection="selection"
    />
    <div class="selection-alert-demo-pages">
      <Button :disabled="page === 1" @click="page = 1">第 1 页</Button>
      <Button :disabled="page === 2" @click="page = 2">第 2 页</Button>
      <span>已选 keys：{{ selectedRowKeys.join('、') || '无' }}</span>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.selection-alert-demo {
  display: grid;
  gap: 12px;
}

.selection-alert-demo-pages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
