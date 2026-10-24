<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef } from 'vue'
import {
  ColumnHeightOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Button as AntButton } from 'ant-design-vue'
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import { VTable, VTableToolbar } from '@vtable-guild/vtable-guild'
import type {
  ColumnType,
  TableColumnsType,
  TableColumnSettingsSize,
} from '@vtable-guild/vtable-guild'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface Member {
  key: number
  name: string
  city: string
  status: string
}
const context = inject(PLAYGROUND_CONTEXT_KEY)
const businessButton = computed(() =>
  context?.preset.value === 'element-plus' ? ElButton : AntButton,
)
const columns = shallowRef<TableColumnsType<Member>>([
  { key: 'name', title: '姓名', dataIndex: 'name', width: 150 },
  { key: 'city', title: '城市', dataIndex: 'city', width: 120 },
  { key: 'status', title: '状态', dataIndex: 'status', visible: false, width: 120 },
])
const rows = shallowRef<Member[]>([
  { key: 1, name: '陈嘉', city: '杭州', status: '在职' },
  { key: 2, name: '苏晚', city: '上海', status: '在职' },
  { key: 3, name: '周野', city: '深圳', status: '休假' },
])
const visibleColumns = computed(() =>
  columns.value.filter(
    (column): column is ColumnType<Member> =>
      typeof column !== 'symbol' && column.visible !== false,
  ),
)
const configurable = computed(() =>
  columns.value.filter((column): column is ColumnType<Member> => typeof column !== 'symbol'),
)
const size = ref<TableColumnSettingsSize>('middle')
const target = ref<HTMLElement | null>(null)
const nativeTarget = ref<HTMLElement | null>(null)
const loading = ref(false)
const disabled = ref(false)
const hideTools = ref(false)
const customSettings = ref(false)
const refreshes = ref(0)
const exports = ref(0)
const csv = ref('')
const fullscreenError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(timer))
function reload() {
  loading.value = true
  timer = setTimeout(() => {
    refreshes.value++
    loading.value = false
  }, 700)
}
function addMember() {
  rows.value = [
    ...rows.value,
    { key: rows.value.length + 1, name: '新成员', city: '待填写', status: '在职' },
  ]
}
function changeVisibility(key: string | number | undefined, visible: boolean) {
  columns.value = columns.value.map((column) =>
    typeof column !== 'symbol' && column.key === key ? { ...column, visible } : column,
  )
}
function exportCsv(data: Member[], currentColumns: TableColumnsType<Member>) {
  const visible = currentColumns.flatMap<{ key: 'name' | 'city' | 'status'; title: unknown }>(
    (column) =>
      typeof column !== 'symbol' &&
      column.visible !== false &&
      (column.key === 'name' || column.key === 'city' || column.key === 'status')
        ? [{ key: column.key, title: column.title }]
        : [],
  )
  if (!visible.length) return
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  csv.value = [
    visible.map((column) => cell(column.title)).join(','),
    ...data.map((row) => visible.map((column) => cell(row[column.key])).join(',')),
  ].join('\r\n')
  exports.value++
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', csv.value], { type: 'text/csv;charset=utf-8;' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'members.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
</script>

<template>
  <section class="toolbar-page">
    <h2>工具栏 · 内置便利与业务扩展</h2>
    <p>导出按钮通过 actions 插槽加入，与刷新、密度、列设置、全屏共存。导出内容跟随当前可见列。</p>
    <div class="toolbar-page-controls">
      <label><input v-model="disabled" type="checkbox" /> 禁用内置操作</label>
      <label><input v-model="hideTools" type="checkbox" /> 关闭内置工具</label>
      <label><input v-model="customSettings" type="checkbox" /> 自定义工具区</label>
      <span aria-live="polite">刷新 {{ refreshes }} 次 · 导出 {{ exports }} 次</span>
    </div>
    <div class="toolbar-page-grid">
      <article>
        <h3>ant-design-vue · 原生布局组合参照</h3>
        <div ref="nativeTarget" class="toolbar-page-target">
          <a-table
            :columns="visibleColumns"
            :size="size"
            :data-source="rows"
            :loading="loading"
            :pagination="false"
            bordered
          >
            <template #title>
              <div class="toolbar-page-reference">
                <span class="toolbar-page-title">团队成员</span>
                <div class="toolbar-page-right">
                  <a-button :disabled="disabled" @click="exportCsv(rows, columns)"
                    >导出 CSV</a-button
                  >
                  <a-button type="primary" :disabled="disabled" @click="addMember">新增</a-button>
                  <div v-if="!hideTools" class="toolbar-page-tools">
                    <a-tooltip title="刷新"
                      ><button
                        type="button"
                        class="toolbar-page-tool"
                        aria-label="原生刷新"
                        :disabled="disabled || loading"
                        @click="reload"
                      >
                        <ReloadOutlined /></button
                    ></a-tooltip>
                    <a-dropdown :trigger="['click']" :disabled="disabled" placement="bottomRight">
                      <template #overlay
                        ><a-menu
                          :selected-keys="[size]"
                          @click="size = $event.key as TableColumnSettingsSize"
                          ><a-menu-item key="large">宽松</a-menu-item
                          ><a-menu-item key="middle">中等</a-menu-item
                          ><a-menu-item key="small">紧凑</a-menu-item></a-menu
                        ></template
                      >
                      <a-tooltip title="表格密度"
                        ><button
                          type="button"
                          class="toolbar-page-tool"
                          aria-label="原生表格密度"
                          :disabled="disabled"
                        >
                          <ColumnHeightOutlined /></button
                      ></a-tooltip>
                    </a-dropdown>
                    <a-popover
                      trigger="click"
                      placement="bottomRight"
                      :arrow="false"
                      title="列展示"
                    >
                      <template #content
                        ><div
                          v-for="column in configurable"
                          :key="column.key"
                          class="toolbar-page-option"
                        >
                          <a-checkbox
                            :checked="column.visible !== false"
                            @change="changeVisibility(column.key, $event.target.checked)"
                            >{{ column.title }}</a-checkbox
                          >
                        </div></template
                      >
                      <a-tooltip title="列设置"
                        ><button
                          type="button"
                          class="toolbar-page-tool"
                          aria-label="原生列设置"
                          :disabled="disabled"
                        >
                          <SettingOutlined /></button
                      ></a-tooltip>
                    </a-popover>
                    <a-tooltip title="全屏"
                      ><button
                        type="button"
                        class="toolbar-page-tool"
                        aria-label="原生全屏"
                        :disabled="disabled"
                        @click="nativeTarget?.requestFullscreen()"
                      >
                        <FullscreenOutlined /></button
                    ></a-tooltip>
                  </div>
                </div>
              </div>
            </template>
          </a-table>
        </div>
      </article>
      <article>
        <h3>VTableToolbar · 当前预设与自定义按钮</h3>
        <div ref="target" class="toolbar-page-target">
          <VTable :columns="columns" :size="size" :data-source="rows" :loading="loading" bordered>
            <template #title="{ data }">
              <VTableToolbar
                v-model:columns="columns"
                v-model:size="size"
                title="团队成员"
                :loading="loading"
                :disabled="disabled"
                :options="hideTools ? false : { fullScreen: true }"
                :fullscreen-target="() => target"
                @reload="reload"
                @fullscreen-error="fullscreenError = String($event)"
              >
                <template #actions="{ columns: currentColumns, disabled: actionDisabled }">
                  <component
                    :is="businessButton"
                    :disabled="actionDisabled"
                    @click="exportCsv(data, currentColumns)"
                    >导出 CSV</component
                  >
                  <component
                    :is="businessButton"
                    type="primary"
                    :disabled="actionDisabled"
                    @click="addMember"
                    >新增</component
                  >
                </template>
                <template v-if="customSettings" #settings="scope"
                  ><component
                    :is="businessButton"
                    :disabled="scope.disabled || scope.loading"
                    @click="scope.reload"
                    >自定义刷新</component
                  ></template
                >
              </VTableToolbar>
            </template>
          </VTable>
          <p v-if="fullscreenError" role="alert">{{ fullscreenError }}</p>
          <pre v-if="csv" class="toolbar-page-csv" aria-label="导出内容">{{ csv }}</pre>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.toolbar-page {
  padding: 24px;
}

.toolbar-page-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.toolbar-page-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-block: 16px;
}

.toolbar-page-target {
  position: relative;
  background: var(--color-surface);
}

.toolbar-page-target:fullscreen {
  padding: 24px;
  overflow: auto;
}

.toolbar-page-reference {
  display: flex;
  min-height: 32px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
}

.toolbar-page-title {
  min-width: 0;
  font-size: 16px;
  font-weight: 500;
}

.toolbar-page-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.toolbar-page-tools {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  margin-left: 8px;
}

.toolbar-page-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 16px;
  color: rgb(0 0 0 / 88%);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.toolbar-page-tool:hover {
  color: #1677ff;
}

.toolbar-page-tool:disabled {
  color: rgb(0 0 0 / 25%);
  cursor: not-allowed;
}

.toolbar-page-option {
  padding-block: 4px;
}

.toolbar-page-csv {
  max-width: 100%;
  padding: 16px;
  overflow: auto;
  white-space: pre;
}

@media (width <= 800px) {
  .toolbar-page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
