<!-- playground/src/App.vue -->
<script setup lang="ts">
import { h, ref } from 'vue'
import { Table as ATable } from 'ant-design-vue'
import { VTable, type ColumnType } from '@vtable-guild/table'

const columns: ColumnType<Record<string, unknown>>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    align: 'right' as const,
    width: 120,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
]

const dataSource = ref([
  {
    key: 1,
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, Long Long Long Address That Should Be Ellipsised',
  },
  { key: 2, name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: 3, name: 'Joe Black', age: 29, address: 'Sidney No. 1 Lake Park' },
])

const emptyData = ref<Record<string, unknown>[]>([])
const loading = ref(false)

function toggleLoading() {
  loading.value = !loading.value
}
</script>

<template>
  <main class="p-8 space-y-8">
    <h1 class="text-xl font-semibold text-on-surface">Phase 3 — antdv vs VTable 并排对照</h1>

    <!-- ===== 基础对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">1. 基础渲染对照</h2>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable :columns="columns" :data-source="dataSource" :pagination="false" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="dataSource" />
        </div>
      </div>
    </section>

    <!-- ===== 空状态对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">2. 空状态对照</h2>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable :columns="columns" :data-source="emptyData" :pagination="false" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="emptyData" />
        </div>
      </div>
    </section>

    <!-- ===== Loading 对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">3. Loading 状态</h2>
      <button class="mb-4 px-3 py-1 border border-default rounded text-sm" @click="toggleLoading">
        Toggle Loading: {{ loading }}
      </button>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable
            :columns="columns"
            :data-source="dataSource"
            :loading="loading"
            :pagination="false"
          />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="dataSource" :loading="loading" />
        </div>
      </div>
    </section>

    <!-- ===== bodyCell slot 验证 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">4. bodyCell Slot 验证</h2>
      <VTable :columns="columns" :data-source="dataSource">
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'name'">
            <strong class="text-blue-600">{{ text }}</strong>
          </template>
          <template v-else>{{ text }}</template>
        </template>
      </VTable>
    </section>

    <!-- ===== Size 变体对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">5. Size 变体</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-2" v-for="size in ['lg', 'md', 'sm'] as const" :key="size">
          <h3 class="text-sm text-muted">{{ size }}</h3>
          <VTable :columns="columns" :data-source="dataSource" :size="size" />
        </div>
      </div>
    </section>
  </main>
</template>
