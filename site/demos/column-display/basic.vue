<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnType, Key } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  city: string
  status: string
}

const dataSource: UserRow[] = [
  { key: '1', name: '陈嘉', age: 28, city: '杭州', status: '在职' },
  { key: '2', name: '苏晚', age: 24, city: '上海', status: '在职' },
  { key: '3', name: '周野', age: 31, city: '深圳', status: '休假' },
  { key: '4', name: '林悦', age: 26, city: '北京', status: '在职' },
]

// visible 与 columnOrder 都是受控属性：切换/重排后把新配置传回来。
// shallowRef + 整体替换：避免把函数字段包成深层响应式（与列宽拖拽示例同一理由）。
const columns = shallowRef<ColumnType<UserRow>[]>([
  { title: '姓名', dataIndex: 'name', key: 'name', width: 140 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
])

// 列顺序用 key 数组表达；未出现在数组里的列会按原相对顺序补在后面
const columnOrder = ref<Key[]>(['name', 'age', 'city', 'status'])

function toggleVisible(key: Key, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  columns.value = columns.value.map((column) =>
    column.key === key ? { ...column, visible: checked } : column,
  )
}

function move(key: Key, offset: -1 | 1) {
  const order = [...columnOrder.value]
  const from = order.indexOf(key)
  const to = from + offset
  if (from < 0 || to < 0 || to >= order.length) return
  ;[order[from], order[to]] = [order[to], order[from]]
  columnOrder.value = order
}
</script>

<template>
  <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px">
    <span
      v-for="column in columns"
      :key="column.key"
      style="display: inline-flex; gap: 4px; align-items: center"
    >
      <input
        type="checkbox"
        :checked="column.visible !== false"
        @change="toggleVisible(column.key!, $event)"
      />
      <span>{{ column.title }}</span>
      <button type="button" aria-label="左移" @click="move(column.key!, -1)">‹</button>
      <button type="button" aria-label="右移" @click="move(column.key!, 1)">›</button>
    </span>
  </div>
  <VTable
    row-key="key"
    bordered
    :columns="columns"
    :data-source="dataSource"
    :column-order="columnOrder"
  />
</template>
