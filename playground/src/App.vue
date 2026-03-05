<!-- playground/src/App.vue -->
<script setup lang="ts">
import { ref, provide } from 'vue'
import { Table as ATable } from 'ant-design-vue'
import { ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable, type ColumnType } from '@vtable-guild/table'
import { VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'

const columns: ColumnType<Record<string, unknown>>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180, sorter: true },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    align: 'right' as const,
    width: 120,
    sorter: (a, b) => (a.age as number) - (b.age as number),
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
]

// 排序专属列——含不同 align
const sortColumns: ColumnType<Record<string, unknown>>[] = [
  { title: 'Name (left)', dataIndex: 'name', key: 'name', width: 180, sorter: true },
  {
    title: 'Age (right)',
    dataIndex: 'age',
    key: 'age',
    align: 'right',
    width: 120,
    sorter: (a, b) => (a.age as number) - (b.age as number),
  },
  {
    title: 'Score (center)',
    dataIndex: 'score',
    key: 'score',
    align: 'center',
    width: 120,
    sorter: (a, b) => (a.score as number) - (b.score as number),
  },
  {
    title: 'No Tooltip',
    dataIndex: 'address',
    key: 'address',
    sorter: true,
    showSorterTooltip: false,
  },
]

// 筛选专属列
const filterColumns: ColumnType<Record<string, unknown>>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180, sorter: true },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    align: 'right',
    width: 120,
    sorter: (a, b) => (a.age as number) - (b.age as number),
    filters: [
      { text: '< 30', value: 'young' },
      { text: '30 ~ 40', value: 'mid' },
      { text: '> 40', value: 'senior' },
    ],
    onFilter: (value, record) => {
      const age = record.age as number
      if (value === 'young') return age < 30
      if (value === 'mid') return age >= 30 && age <= 40
      return age > 40
    },
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
    filters: [
      { text: 'New York', value: 'New York' },
      { text: 'London', value: 'London' },
      { text: 'Sidney', value: 'Sidney' },
    ],
    onFilter: (value, record) => (record.address as string).includes(value as string),
  },
]

const dataSource = ref([
  {
    key: 1,
    name: 'John Brown',
    age: 32,
    score: 88,
    address: 'New York No. 1 Lake Park, Long Long Long Address That Should Be Ellipsised',
  },
  { key: 2, name: 'Jim Green', age: 42, score: 72, address: 'London No. 1 Lake Park' },
  { key: 3, name: 'Joe Black', age: 29, score: 95, address: 'Sidney No. 1 Lake Park' },
])

const emptyData = ref<Record<string, unknown>[]>([])
const loading = ref(false)

function toggleLoading() {
  loading.value = !loading.value
}

function onTableChange(...args: unknown[]) {
  console.log('[VTable change]', ...args)
}

// ---- 当前对照模式 ----
const comparisonMode = ref<'antdv' | 'element-plus'>('antdv')
</script>

<template>
  <main class="p-8 space-y-8">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-semibold text-on-surface">vtable-guild Playground</h1>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 border rounded text-sm"
          :class="
            comparisonMode === 'antdv'
              ? 'bg-[#1677ff] text-white border-[#1677ff]'
              : 'border-default text-on-surface'
          "
          @click="comparisonMode = 'antdv'"
        >
          antdv Preset
        </button>
        <button
          class="px-3 py-1 border rounded text-sm"
          :class="
            comparisonMode === 'element-plus'
              ? 'bg-[#409eff] text-white border-[#409eff]'
              : 'border-default text-on-surface'
          "
          @click="comparisonMode = 'element-plus'"
        >
          Element Plus Preset
        </button>
      </div>
    </div>

    <!-- ===== antdv 对照 ===== -->
    <template v-if="comparisonMode === 'antdv'">
      <h2 class="text-lg font-medium text-on-surface">antdv vs VTable (antdv preset)</h2>

      <!-- 筛选功能对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">
          0. 筛选功能对照（Age 分段 + Address 关键字）
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">ant-design-vue</h4>
            <ATable
              :columns="filterColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="(...args: unknown[]) => console.log('[ATable change]', ...args)"
            />
          </div>
          <div class="space-y-2">
            <h4 class="text-sm text-muted">vtable-guild</h4>
            <VTable :columns="filterColumns" :data-source="dataSource" @change="onTableChange" />
          </div>
        </div>
      </section>

      <!-- 排序专属对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">
          1. 排序功能对照（不同 align + tooltip）
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">ant-design-vue</h4>
            <ATable :columns="sortColumns" :data-source="dataSource" :pagination="false" />
          </div>
          <div class="space-y-2">
            <h4 class="text-sm text-muted">vtable-guild</h4>
            <VTable :columns="sortColumns" :data-source="dataSource" />
          </div>
        </div>
      </section>

      <!-- 基础对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">2. 基础渲染对照</h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">ant-design-vue</h4>
            <ATable :columns="columns" :data-source="dataSource" :pagination="false" />
          </div>
          <div class="space-y-2">
            <h4 class="text-sm text-muted">vtable-guild</h4>
            <VTable :columns="columns" :data-source="dataSource" />
          </div>
        </div>
      </section>

      <!-- 空状态对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">3. 空状态对照</h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">ant-design-vue</h4>
            <ATable :columns="columns" :data-source="emptyData" :pagination="false" />
          </div>
          <div class="space-y-2">
            <h4 class="text-sm text-muted">vtable-guild</h4>
            <VTable :columns="columns" :data-source="emptyData" />
          </div>
        </div>
      </section>

      <!-- Loading 对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">4. Loading 状态</h3>
        <button class="mb-4 px-3 py-1 border border-default rounded text-sm" @click="toggleLoading">
          Toggle Loading: {{ loading }}
        </button>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">ant-design-vue</h4>
            <ATable
              :columns="columns"
              :data-source="dataSource"
              :loading="loading"
              :pagination="false"
            />
          </div>
          <div class="space-y-2">
            <h4 class="text-sm text-muted">vtable-guild</h4>
            <VTable :columns="columns" :data-source="dataSource" :loading="loading" />
          </div>
        </div>
      </section>

      <!-- bodyCell slot 验证 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">5. bodyCell Slot 验证</h3>
        <VTable :columns="columns" :data-source="dataSource">
          <template #bodyCell="{ column, text }">
            <template v-if="column.dataIndex === 'name'">
              <strong class="text-blue-600">{{ text }}</strong>
            </template>
            <template v-else>{{ text }}</template>
          </template>
        </VTable>
      </section>

      <!-- Size 变体对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">6. Size 变体</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2" v-for="size in ['lg', 'md', 'sm'] as const" :key="size">
            <h4 class="text-sm text-muted">{{ size }}</h4>
            <VTable :columns="columns" :data-source="dataSource" :size="size" />
          </div>
        </div>
      </section>
    </template>

    <!-- ===== Element Plus 对照 ===== -->
    <template v-if="comparisonMode === 'element-plus'">
      <h2 class="text-lg font-medium text-on-surface">
        Element Plus vs VTable (element-plus preset)
      </h2>

      <!-- 筛选功能对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">
          0. 筛选功能对照（Age 分段 + Address 关键字）
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">element-plus</h4>
            <ElTable :data="dataSource" style="width: 100%">
              <ElTableColumn prop="name" label="Name" width="180" sortable />
              <ElTableColumn
                prop="age"
                label="Age"
                width="120"
                align="right"
                sortable
                :filters="[
                  { text: '< 30', value: 'young' },
                  { text: '30 ~ 40', value: 'mid' },
                  { text: '> 40', value: 'senior' },
                ]"
                :filter-method="
                  (value: string, row: Record<string, unknown>) => {
                    const age = row.age as number
                    if (value === 'young') return age < 30
                    if (value === 'mid') return age >= 30 && age <= 40
                    return age > 40
                  }
                "
              />
              <ElTableColumn
                prop="address"
                label="Address"
                show-overflow-tooltip
                :filters="[
                  { text: 'New York', value: 'New York' },
                  { text: 'London', value: 'London' },
                  { text: 'Sidney', value: 'Sidney' },
                ]"
                :filter-method="
                  (value: string, row: Record<string, unknown>) =>
                    (row.address as string).includes(value)
                "
              />
            </ElTable>
          </div>
          <div class="space-y-2 preset-element-plus">
            <h4 class="text-sm" style="color: #909399">vtable-guild (element-plus preset)</h4>
            <VTable
              :columns="filterColumns"
              :data-source="dataSource"
              theme-preset="element-plus"
              @change="onTableChange"
            />
          </div>
        </div>
      </section>

      <!-- 排序对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">
          1. 排序功能对照（不同 align + tooltip）
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">element-plus</h4>
            <ElTable :data="dataSource" style="width: 100%">
              <ElTableColumn prop="name" label="Name (left)" width="180" sortable />
              <ElTableColumn prop="age" label="Age (right)" width="120" align="right" sortable />
              <ElTableColumn
                prop="score"
                label="Score (center)"
                width="120"
                align="center"
                sortable
              />
              <ElTableColumn prop="address" label="No Tooltip" sortable />
            </ElTable>
          </div>
          <div class="space-y-2 preset-element-plus">
            <h4 class="text-sm" style="color: #909399">vtable-guild (element-plus preset)</h4>
            <VTable :columns="sortColumns" :data-source="dataSource" theme-preset="element-plus" />
          </div>
        </div>
      </section>

      <!-- 基础渲染对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">2. 基础渲染对照</h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <h4 class="text-sm text-muted">element-plus</h4>
            <ElTable :data="dataSource" style="width: 100%">
              <ElTableColumn prop="name" label="Name" width="180" sortable />
              <ElTableColumn prop="age" label="Age" width="120" align="right" sortable />
              <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
            </ElTable>
          </div>
          <div class="space-y-2 preset-element-plus">
            <h4 class="text-sm" style="color: #909399">vtable-guild (element-plus preset)</h4>
            <VTable :columns="columns" :data-source="dataSource" theme-preset="element-plus" />
          </div>
        </div>
      </section>

      <!-- Size 变体对照 -->
      <section>
        <h3 class="text-base font-medium text-on-surface mb-4">3. Size 变体</h3>
        <div class="grid grid-cols-3 gap-4">
          <div
            class="space-y-2 preset-element-plus"
            v-for="size in ['lg', 'md', 'sm'] as const"
            :key="size"
          >
            <h4 class="text-sm" style="color: #909399">{{ size }}</h4>
            <VTable
              :columns="columns"
              :data-source="dataSource"
              :size="size"
              theme-preset="element-plus"
            />
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
