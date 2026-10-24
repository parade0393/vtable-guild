<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { ColumnHeightOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { VTable, VTableColumnSettings } from '@vtable-guild/vtable-guild'
import type {
  ColumnType,
  TableColumnsType,
  TableColumnSettingsSize,
} from '@vtable-guild/vtable-guild'

interface Member {
  key: number
  name: string
  city: string
  status: string
}
const initialColumns: ColumnType<Member>[] = [
  { key: 'name', dataIndex: 'name', title: '姓名', width: 150 },
  { key: 'city', dataIndex: 'city', title: '城市', width: 120 },
  { key: 'status', dataIndex: 'status', title: '状态', width: 120, visible: false },
]
const columns = shallowRef<TableColumnsType<Member>>([...initialColumns])
const size = ref<TableColumnSettingsSize>('middle')
const referenceOpen = ref(false)
const disabled = ref(false)
const virtual = ref(false)
const empty = ref(false)
const updates = ref(0)
const resets = ref(0)
const configurableColumns = computed(() =>
  columns.value.filter((column): column is ColumnType<Member> => typeof column !== 'symbol'),
)
const checkedKeys = computed(() =>
  configurableColumns.value
    .filter((column) => column.visible !== false)
    .map((column) => column.key!),
)
const treeData = computed(() =>
  configurableColumns.value.map((column) => ({ key: column.key, title: column.title })),
)
const allChecked = computed(
  () =>
    checkedKeys.value.length > 0 && checkedKeys.value.length === configurableColumns.value.length,
)
const indeterminate = computed(() => checkedKeys.value.length > 0 && !allChecked.value)
const referenceColumns = computed(() =>
  columns.value.filter(
    (column): column is ColumnType<Member> =>
      typeof column !== 'symbol' && column.visible !== false,
  ),
)
const rows = Array.from(
  { length: 50 },
  (_, index): Member => ({
    key: index,
    name: ['陈嘉', '苏晚', '周野'][index % 3]!,
    city: ['杭州', '上海', '深圳'][index % 3]!,
    status: index % 3 ? '在职' : '休假',
  }),
)
function changeColumns(value: TableColumnsType<Member>) {
  columns.value = value
  updates.value++
}
function setChecked(keys: (string | number)[]) {
  changeColumns(
    columns.value.map((column) =>
      typeof column !== 'symbol' ? { ...column, visible: keys.includes(column.key!) } : column,
    ),
  )
}
function reset() {
  columns.value = [...initialColumns]
  resets.value++
}
</script>

<template>
  <section class="settings-page">
    <h2>ProTable 工具栏 · 表格密度与列设置</h2>
    <p>按 React ProTable 的双图标入口对齐。左右共享状态，重置恢复列显隐，密度独立选择。</p>
    <div class="settings-page-controls">
      <label><input v-model="disabled" type="checkbox" /> 禁用面板</label>
      <label><input v-model="virtual" type="checkbox" /> 虚拟滚动</label>
      <label><input v-model="empty" type="checkbox" /> 空数据</label>
      <span>显隐更新 {{ updates }} 次 · 重置 {{ resets }} 次</span>
    </div>
    <div class="settings-page-grid">
      <article>
        <h3>ant-design-vue · 按 ProTable 结构组合原生控件</h3>
        <a-table
          :columns="referenceColumns"
          :data-source="empty ? [] : rows"
          :size="size"
          :pagination="false"
          :scroll="{ y: 320 }"
          bordered
        >
          <template #title>
            <div class="settings-page-heading">
              <span>团队成员</span>
              <div class="settings-page-tools">
                <a-dropdown :trigger="['click']" placement="bottomRight" :disabled="disabled">
                  <template #overlay>
                    <a-menu
                      :selected-keys="[size]"
                      @click="size = $event.key as TableColumnSettingsSize"
                    >
                      <a-menu-item key="large">宽松</a-menu-item>
                      <a-menu-item key="middle">中等</a-menu-item>
                      <a-menu-item key="small">紧凑</a-menu-item>
                    </a-menu>
                  </template>
                  <a-tooltip title="表格密度">
                    <button
                      type="button"
                      class="settings-page-tool"
                      aria-label="原生表格密度"
                      :disabled="disabled"
                    >
                      <ColumnHeightOutlined />
                    </button>
                  </a-tooltip>
                </a-dropdown>
                <a-popover
                  v-model:open="referenceOpen"
                  trigger="click"
                  placement="bottomRight"
                  :arrow="false"
                >
                  <template #title>
                    <div class="settings-page-heading settings-page-reference-heading">
                      <a-checkbox
                        :checked="allChecked"
                        :indeterminate="indeterminate"
                        @change="
                          setChecked(
                            $event.target.checked
                              ? configurableColumns.map((column) => column.key!)
                              : [],
                          )
                        "
                        >列展示</a-checkbox
                      >
                      <a-typography-link @click="reset">重置</a-typography-link>
                    </div>
                  </template>
                  <template #content>
                    <div class="settings-page-reference">
                      <a-tree
                        :tree-data="treeData"
                        :checked-keys="checkedKeys"
                        checkable
                        :selectable="false"
                        block-node
                        @check="setChecked($event as (string | number)[])"
                      />
                    </div>
                  </template>
                  <a-tooltip title="列设置">
                    <button
                      type="button"
                      class="settings-page-tool"
                      aria-label="原生列设置"
                      :disabled="disabled"
                    >
                      <SettingOutlined />
                    </button>
                  </a-tooltip>
                </a-popover>
              </div>
            </div>
          </template>
        </a-table>
      </article>
      <article>
        <h3>VTable Guild · 当前预设</h3>
        <VTable
          :columns="columns"
          :size="size"
          :data-source="empty ? [] : rows"
          :virtual="virtual"
          :scroll="{ y: 320 }"
          bordered
        >
          <template #title>
            <div class="settings-page-heading">
              <span>团队成员</span>
              <VTableColumnSettings
                :columns="columns"
                v-model:size="size"
                :disabled="disabled"
                @update:columns="changeColumns"
                @reset="resets++"
              />
            </div>
          </template>
        </VTable>
      </article>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  padding: 24px;
}

.settings-page-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.settings-page-controls,
.settings-page-heading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.settings-page-controls {
  flex-wrap: wrap;
  margin-block: 16px;
}

.settings-page-heading {
  justify-content: space-between;
}

.settings-page-reference {
  width: 200px;
  padding-block: 8px;
}

.settings-page-reference :deep(.ant-tree-checkbox) {
  margin-inline-end: 4px;
}

.settings-page-reference :deep(.ant-tree-node-content-wrapper:hover) {
  background: transparent;
}

.settings-page-reference-heading {
  height: 32px;
}

.settings-page-tools {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.settings-page-tool {
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

.settings-page-tool:hover {
  color: #1677ff;
}

.settings-page-tool:disabled {
  color: rgb(0 0 0 / 25%);
  cursor: not-allowed;
}

@media (width <= 800px) {
  .settings-page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
