<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, VTable, VTableToolbar } from '@vtable-guild/vtable-guild'
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Order {
  key: number
  name: string
  status: 'pending' | 'done'
  city: string
}

const columns: TableColumnsType<Order> = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'city', title: '城市', dataIndex: 'city' },
  { key: 'status', title: '状态', dataIndex: 'status' },
]
const rows: Order[] = [
  { key: 1, name: '陈嘉', city: '杭州', status: 'pending' },
  { key: 2, name: '苏晚', city: '上海', status: 'done' },
  { key: 3, name: '周野', city: '杭州', status: 'pending' },
]
const searchValue = ref('')
const submittedKeyword = ref('')
const view = ref<'all' | Order['status']>('all')
const city = ref('')
const refreshes = ref(0)
const filteredRows = computed(() =>
  rows.filter(
    (row) =>
      (!submittedKeyword.value || row.name.includes(submittedKeyword.value)) &&
      (view.value === 'all' || row.status === view.value) &&
      (!city.value || row.city === city.value),
  ),
)
const views = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'done', label: '已完成' },
] as const
</script>

<template>
  <VTable :columns="columns" :data-source="filteredRows">
    <template #title>
      <VTableToolbar
        v-model:search-value="searchValue"
        title="订单列表"
        :search="{ placeholder: '按姓名查询' }"
        :options="{ density: false, setting: false }"
        multiple-line
        @search="submittedKeyword = $event"
        @clear-search="submittedKeyword = ''"
        @reload="refreshes++"
      >
        <template #filter>
          <label
            >城市
            <select v-model="city" aria-label="城市">
              <option value="">全部城市</option>
              <option value="杭州">杭州</option>
              <option value="上海">上海</option>
            </select></label
          >
          <span>刷新 {{ refreshes }} 次</span>
        </template>
        <template #extra>
          <nav aria-label="订单视图" class="toolbar-search-views">
            <Button
              v-for="item in views"
              :key="item.key"
              :type="view === item.key ? 'primary' : 'default'"
              :aria-pressed="view === item.key"
              @click="view = item.key"
              >{{ item.label }}</Button
            >
          </nav>
        </template>
      </VTableToolbar>
    </template>
  </VTable>
</template>

<style scoped>
.toolbar-search-views {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
