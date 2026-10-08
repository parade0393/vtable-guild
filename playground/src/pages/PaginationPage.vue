<script setup lang="ts">
import { computed, h, inject, onBeforeUnmount, ref, watch } from 'vue'
import { ConfigProvider, Table as AntTable } from 'ant-design-vue'
import type {
  TablePaginationConfig as AntPaginationConfig,
  TableRowSelection as AntRowSelection,
} from 'ant-design-vue/es/table/interface'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import {
  VTable,
  type RowSelection,
  type TablePaginationConfig,
  type TableChangeExtra,
} from '@vtable-guild/vtable-guild'
import RemoteDemo from '../../../site/demos/pagination/remote.vue'
import ControlledDemo from '../../../site/demos/pagination/controlled.vue'
import AdvancedDemo from '../../../site/demos/pagination/advanced.vue'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'
import ElementPaginationReference from '../components/ElementPaginationReference.vue'
const playground = inject(PLAYGROUND_CONTEXT_KEY)!
const antLocale = computed(() => (playground.locale.value === 'en-US' ? enUS : zhCN))
const presetLabel = computed(() =>
  playground.preset.value === 'antdv' ? 'antdv preset' : 'element-plus preset',
)
const nativeLabel = computed(() =>
  playground.preset.value === 'antdv' ? 'ant-design-vue' : 'Element Plus',
)
const simple = ref(false)
const virtual = ref(false)
const showLessItems = ref(true)
const pagerCount = ref<number>()
const pagerCountOptions = Array.from({ length: 9 }, (_, i) => 5 + i * 2)
const current = ref(1)
const pageSize = ref(10)
const data = Array.from({ length: 230 }, (_, i) => ({
  key: i + 1,
  name: `Record ${i + 1}`,
  group: i % 2 ? 'A' : 'B',
}))
const antSelectedCount = ref(0)
const selectedCount = ref(0)
const antRowSelection: AntRowSelection<(typeof data)[number]> = {
  selections: true,
  onChange: (keys) => {
    antSelectedCount.value = keys.length
  },
}
const rowSelection: RowSelection<(typeof data)[number]> = {
  selections: true,
  onChange: (keys) => {
    selectedCount.value = keys.length
  },
}
const columns = [
  {
    key: 'key',
    dataIndex: 'key',
    title: 'ID',
    width: 80,
    sorter: (a: (typeof data)[number], b: (typeof data)[number]) => a.key - b.key,
  },
  { key: 'name', dataIndex: 'name', title: 'Name', width: 200 },
  { key: 'group', dataIndex: 'group', title: 'Group', width: 100 },
]
const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  simple: simple.value,
  showSizeChanger: true,
  showQuickJumper: true,
  responsive: true,
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  onChange: (page, size) => {
    current.value = page
    pageSize.value = size
  },
  showLessItems: showLessItems.value,
  pagerCount: pagerCount.value,
}))
const lastAction = ref('—')
const antPagination = computed<AntPaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  simple: simple.value,
  showSizeChanger: true,
  showQuickJumper: true,
  responsive: true,
  showLessItems: showLessItems.value,
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  onChange: pagination.value.onChange,
}))
function handleChange(_filters: unknown, _sorter: unknown, extra: TableChangeExtra) {
  lastAction.value = extra.action
}

const compactColumns = [{ key: 'name', dataIndex: 'name', title: 'Name' }]
const controlledData = data.slice(0, 47)
const controlledCurrent = ref(1)
const controlledPageSize = ref(5)
const controlledPagination = computed<AntPaginationConfig>(() => ({
  current: controlledCurrent.value,
  pageSize: controlledPageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  position: ['topRight', 'bottomRight'],
  onChange: (page, size) => {
    controlledCurrent.value = page
    controlledPageSize.value = size
  },
}))

const remoteCurrent = ref(1)
const remotePageSize = ref(5)
const remoteData = ref<{ key: number; name: string }[]>([])
const remoteLoading = ref(false)
const antRemoteSelectedCount = ref(0)
const antRemoteSelection: AntRowSelection<(typeof remoteData.value)[number]> = {
  preserveSelectedRowKeys: true,
  selections: true,
  onChange: (keys) => {
    antRemoteSelectedCount.value = keys.length
  },
}
let remoteTimer: ReturnType<typeof setTimeout> | undefined
const remotePagination = computed<AntPaginationConfig>(() => ({
  current: remoteCurrent.value,
  pageSize: remotePageSize.value,
  total: 123,
  showQuickJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  onChange: (page, size) => {
    remoteCurrent.value = page
    remotePageSize.value = size
  },
}))
watch(
  [remoteCurrent, remotePageSize],
  ([page, size]) => {
    clearTimeout(remoteTimer)
    remoteLoading.value = true
    remoteTimer = setTimeout(() => {
      remoteData.value = Array.from(
        { length: Math.min(size, 123 - (page - 1) * size) },
        (_, i) => ({
          key: (page - 1) * size + i + 1,
          name: `Remote record ${(page - 1) * size + i + 1}`,
        }),
      )
      remoteLoading.value = false
    }, 300)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(remoteTimer))

const advancedSimple = ref(false)
const advancedDisabled = ref(false)
const advancedPagination = computed<AntPaginationConfig>(() => ({
  simple: advancedSimple.value,
  disabled: advancedDisabled.value,
  responsive: true,
  showLessItems: true,
  showQuickJumper: { goButton: 'Go' },
  showSizeChanger: true,
  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total}`,
  itemRender: ({ type, originalElement }) =>
    type === 'prev' ? h('span', '‹') : type === 'next' ? h('span', '›') : originalElement,
}))
</script>

<template>
  <ConfigProvider :locale="antLocale">
    <main class="play-page pagination-demo">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Pagination Playground</p>
          <h1>分页功能对照</h1>
          <p class="play-summary">
            左侧随预设切换对应 UI 库的原生表格与分页，右侧为 VTable
            Guild。对照基础分页、受控状态、远程数据与高级配置。
          </p>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">01</p>
            <h2>基础分页 / 自动高度</h2>
          </div>
          <p class="play-case__desc">共 230 条数据。VTable Guild last action: {{ lastAction }}</p>
        </header>
        <div class="play-toolbar">
          <label><input v-model="simple" type="checkbox" /> Simple</label>
          <label><input v-model="virtual" type="checkbox" /> Virtual（VTable Guild）</label>
          <label><input v-model="showLessItems" type="checkbox" /> showLessItems</label>
          <label>
            pagerCount
            <select v-model="pagerCount">
              <option :value="undefined">未指定 / 跟随预设</option>
              <option v-for="count in pagerCountOptions" :key="count" :value="count">
                {{ count }}
              </option>
            </select>
          </label>
        </div>
        <p v-if="pagerCount !== undefined" class="play-inline-note">
          pagerCount 优先于 showLessItems，数字页码数量包含首尾页。Simple 模式不显示页码列表。
        </p>
        <p class="play-inline-note">
          表头复选框仅选择当页；选择菜单支持全选所有、反选当页和清空所有。翻页后保留已选记录。
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ nativeLabel }}</h3>
              </div>
              <p>原生分页 / 固定滚动高度</p>
            </div>
            <AntTable
              v-if="playground.preset.value === 'antdv'"
              :columns="columns"
              :data-source="data"
              row-key="key"
              :pagination="antPagination"
              :scroll="{ y: 240 }"
              :row-selection="antRowSelection"
            />
            <ElementPaginationReference
              v-else
              :columns="columns"
              :data="data"
              :pagination="pagination"
              :height="296"
              selection
              @selection-change="antSelectedCount = $event"
            />
            <p
              v-if="playground.preset.value === 'antdv' && pagerCount !== undefined"
              class="play-inline-note"
            >
              Ant Design Vue 原生分页不支持 pagerCount，左侧仍使用原生 showLessItems 配置。
            </p>
            <p role="status" aria-live="polite">已选 {{ antSelectedCount }} 条</p>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">VTable Guild</span>
                <h3>{{ presetLabel }}</h3>
              </div>
              <p>分页 / 自动高度 / 虚拟滚动</p>
            </div>
            <div class="pagination-demo__viewport">
              <VTable
                :columns="columns"
                :data-source="data"
                row-key="key"
                :pagination="pagination"
                :virtual="virtual"
                :scroll="{ y: 'auto' }"
                :row-selection="rowSelection"
                @change="handleChange"
              />
            </div>
            <p role="status" aria-live="polite">已选 {{ selectedCount }} 条</p>
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">02</p>
            <h2>受控 / 上下分页器</h2>
          </div>
          <p class="play-case__desc">验证页码、每页条数与上下分页器同步。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ nativeLabel }}</h3>
              </div>
              <p>受控分页 / 上下分页器</p>
            </div>
            <AntTable
              v-if="playground.preset.value === 'antdv'"
              row-key="key"
              :columns="compactColumns"
              :data-source="controlledData"
              :pagination="controlledPagination"
            />
            <ElementPaginationReference
              v-else
              :columns="compactColumns"
              :data="controlledData"
              :pagination="controlledPagination"
            />
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">VTable Guild</span>
                <h3>{{ presetLabel }}</h3>
              </div>
              <p>受控分页 / 上下分页器</p>
            </div>
            <ControlledDemo />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">03</p>
            <h2>远程分页 / 跨页选择</h2>
          </div>
          <p class="play-case__desc">模拟远程加载，切页时保留总数与已选记录。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ nativeLabel }}</h3>
              </div>
              <p>远程数据 / 跨页选择</p>
            </div>
            <AntTable
              v-if="playground.preset.value === 'antdv'"
              row-key="key"
              :columns="compactColumns"
              :data-source="remoteData"
              :pagination="remotePagination"
              :loading="remoteLoading"
              :row-selection="antRemoteSelection"
            />
            <ElementPaginationReference
              v-else
              :columns="compactColumns"
              :data="remoteData"
              :pagination="remotePagination"
              selection
              @selection-change="antRemoteSelectedCount = $event"
            />
            <p role="status" aria-live="polite">已选 {{ antRemoteSelectedCount }} 条（跨页保留）</p>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">VTable Guild</span>
                <h3>{{ presetLabel }}</h3>
              </div>
              <p>远程数据 / 跨页选择</p>
            </div>
            <RemoteDemo />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">04</p>
            <h2>自定义 / 高级配置</h2>
          </div>
          <p class="play-case__desc">验证简洁模式、禁用状态、自定义翻页按钮与快捷跳转。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ nativeLabel }}</h3>
              </div>
              <p>自定义分页器</p>
            </div>
            <div>
              <label><input v-model="advancedSimple" type="checkbox" /> Simple</label>
              <label><input v-model="advancedDisabled" type="checkbox" /> Disabled</label>
              <AntTable
                v-if="playground.preset.value === 'antdv'"
                row-key="key"
                :columns="compactColumns"
                :data-source="data"
                :pagination="advancedPagination"
              />
              <ElementPaginationReference
                v-else
                :columns="compactColumns"
                :data="data"
                :pagination="advancedPagination"
              />
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">VTable Guild</span>
                <h3>{{ presetLabel }}</h3>
              </div>
              <p>自定义分页器</p>
            </div>
            <AdvancedDemo />
          </article>
        </div>
      </section>
    </main>
  </ConfigProvider>
</template>

<style scoped>
.pagination-demo .play-panel {
  min-width: 0;
}

.pagination-demo__viewport {
  height: 360px;
}

.pagination-demo label {
  margin-inline-end: 16px;
}
</style>
