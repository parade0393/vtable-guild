<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, RowSelection } from '@vtable-guild/table'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

interface TreeRow extends Record<string, unknown> {
  key: string
  name: string
  age: number
  role: string
  address: string
  children?: TreeRow[]
}

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')

const treeData: TreeRow[] = [
  {
    key: '1',
    name: 'Engineering',
    age: 0,
    role: 'Department',
    address: 'Building A',
    children: [
      {
        key: '1-1',
        name: 'Frontend Team',
        age: 0,
        role: 'Team',
        address: 'Building A, Floor 3',
        children: [
          {
            key: '1-1-1',
            name: 'Aya Stone',
            age: 27,
            role: 'Senior Engineer',
            address: 'Desk A-301',
          },
          {
            key: '1-1-2',
            name: 'Milo Hart',
            age: 34,
            role: 'Staff Engineer',
            address: 'Desk A-302',
          },
          { key: '1-1-3', name: 'Lina Cross', age: 29, role: 'Engineer', address: 'Desk A-303' },
        ],
      },
      {
        key: '1-2',
        name: 'Backend Team',
        age: 0,
        role: 'Team',
        address: 'Building A, Floor 4',
        children: [
          { key: '1-2-1', name: 'Theo Grant', age: 45, role: 'Architect', address: 'Desk A-401' },
          {
            key: '1-2-2',
            name: 'Omar Reed',
            age: 36,
            role: 'Senior Engineer',
            address: 'Desk A-402',
          },
        ],
      },
    ],
  },
  {
    key: '2',
    name: 'Design',
    age: 0,
    role: 'Department',
    address: 'Building B',
    children: [
      {
        key: '2-1',
        name: 'UX Team',
        age: 0,
        role: 'Team',
        address: 'Building B, Floor 2',
        children: [
          {
            key: '2-1-1',
            name: 'Inez Vale',
            age: 41,
            role: 'Lead Designer',
            address: 'Desk B-201',
          },
          {
            key: '2-1-2',
            name: 'Sora Blue',
            age: 31,
            role: 'UX Researcher',
            address: 'Desk B-202',
          },
        ],
      },
    ],
  },
  {
    key: '3',
    name: 'Operations',
    age: 0,
    role: 'Department',
    address: 'Building C',
    children: [
      { key: '3-1', name: 'Ren Moss', age: 38, role: 'Operations Lead', address: 'Desk C-101' },
    ],
  },
]

const columns: ColumnsType<TreeRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 250 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
  { title: 'Role', dataIndex: 'role', key: 'role', width: 180 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

const treeProps = {
  children: 'children',
}

const selectedRowKeys = ref<(string | number)[]>([])
const cascadeSelectedRowKeys = ref<(string | number)[]>(['1-1-1'])

const rowSelection = computed<RowSelection<TreeRow>>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))

const antRowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = [...keys]
  },
}))

const cascadeRowSelection = computed<RowSelection<TreeRow>>(() => ({
  selectedRowKeys: cascadeSelectedRowKeys.value,
  checkStrictly: false,
  onChange: (keys) => {
    cascadeSelectedRowKeys.value = [...keys]
  },
}))

const antCascadeRowSelection = computed(() => ({
  selectedRowKeys: cascadeSelectedRowKeys.value,
  checkStrictly: false,
  onChange: (keys: (string | number)[]) => {
    cascadeSelectedRowKeys.value = [...keys]
  },
}))

function handleElementSelectionChange(rows: TreeRow[]) {
  selectedRowKeys.value = rows.map((row) => row.key)
}
</script>

<template>
  <AConfigProvider :locale="playground.antLocale.value as any">
    <main class="play-page">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Tree Playground</p>
          <h1>树形数据左右对照</h1>
          <p class="play-summary">
            展开/折叠图标、默认展开、层级缩进和树形选择统一放在这一页回归。左侧渲染当前 preset
            的真实原生表格，右侧验证 VTable 同步场景。
          </p>
        </div>
      </section>

      <section class="play-metrics">
        <article class="play-metric-card">
          <span class="play-metric-card__label">Route focus</span>
          <strong>tree expand parity</strong>
          <p>优先检查展开/折叠图标在展开行和树节点场景里的尺寸、占位和节奏。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Coverage</span>
          <strong>5 / 5 paired cases</strong>
          <p>基础树形、默认展开、树形选择、自定义缩进，以及级联选择都恢复为可回归页面。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Preset</span>
          <strong>{{ isAntdv ? 'ant-design-vue parity' : 'element-plus parity' }}</strong>
          <p>切换 preset 后，左侧跟随原生实现，右侧持续验证当前主题化表达。</p>
        </article>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">01</p>
            <h2>基础树形展开 / 折叠</h2>
          </div>
          <p class="play-case__desc">3 级嵌套结构，直接比较默认折叠态下的图标和文本对齐。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'element-plus' }}</h3>
              </div>
              <p>{{ isAntdv ? '原生 tree data' : '原生 tree table' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :data-source="treeData"
              :columns="columns as any"
              :pagination="false"
              row-key="key"
              size="middle"
            />
            <ElTable
              v-else
              :data="treeData"
              row-key="key"
              :tree-props="treeProps"
              style="width: 100%"
            >
              <ElTableColumn prop="name" label="Name" min-width="250" />
              <ElTableColumn prop="age" label="Age" width="80" align="right" />
              <ElTableColumn prop="role" label="Role" width="180" />
              <ElTableColumn prop="address" label="Address" />
            </ElTable>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>children + default collapsed</p>
            </div>
            <VTable
              :data-source="treeData as any"
              :columns="columns as any"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">02</p>
            <h2>默认全部展开</h2>
          </div>
          <p class="play-case__desc">
            原生侧使用默认展开能力，右侧通过 VTable 的树形展开 props 对齐相同行为。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'element-plus' }}</h3>
              </div>
              <p>{{ isAntdv ? 'defaultExpandAllRows' : 'default-expand-all' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :data-source="treeData"
              :columns="columns as any"
              :pagination="false"
              :default-expand-all-rows="true"
              row-key="key"
              size="middle"
            />
            <ElTable
              v-else
              :data="treeData"
              row-key="key"
              :tree-props="treeProps"
              default-expand-all
              style="width: 100%"
            >
              <ElTableColumn prop="name" label="Name" min-width="250" />
              <ElTableColumn prop="age" label="Age" width="80" align="right" />
              <ElTableColumn prop="role" label="Role" width="180" />
              <ElTableColumn prop="address" label="Address" />
            </ElTable>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>defaultExpandAllRows</p>
            </div>
            <VTable
              :data-source="treeData as any"
              :columns="columns as any"
              default-expand-all-rows
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">03</p>
            <h2>树形 + 行选择</h2>
          </div>
          <p class="play-case__desc">比较树形结构与 selection 列共存时的占位、缩进和交互节奏。</p>
        </header>
        <p class="play-inline-note">
          已选 keys: {{ selectedRowKeys.length > 0 ? selectedRowKeys.join(', ') : '(无)' }}
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'element-plus' }}</h3>
              </div>
              <p>{{ isAntdv ? 'tree + rowSelection' : 'tree + selection column' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :data-source="treeData"
              :columns="columns as any"
              :pagination="false"
              :row-selection="antRowSelection"
              row-key="key"
              size="middle"
            />
            <ElTable
              v-else
              :data="treeData"
              row-key="key"
              :tree-props="treeProps"
              style="width: 100%"
              @selection-change="handleElementSelectionChange"
            >
              <ElTableColumn type="selection" width="48" />
              <ElTableColumn prop="name" label="Name" min-width="250" />
              <ElTableColumn prop="age" label="Age" width="80" align="right" />
              <ElTableColumn prop="role" label="Role" width="180" />
              <ElTableColumn prop="address" label="Address" />
            </ElTable>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>rowSelection + tree data</p>
            </div>
            <VTable
              :data-source="treeData as any"
              :columns="columns as any"
              :row-selection="rowSelection as any"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">04</p>
            <h2>自定义缩进宽度</h2>
          </div>
          <p class="play-case__desc">把树层级缩进统一拉大到 30px，确认图标和文本仍然稳。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'element-plus' }}</h3>
              </div>
              <p>{{ isAntdv ? 'indentSize = 30' : 'indent = 30' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :data-source="treeData"
              :columns="columns as any"
              :pagination="false"
              :indent-size="30"
              row-key="key"
              size="middle"
            />
            <ElTable
              v-else
              :data="treeData"
              row-key="key"
              :tree-props="treeProps"
              :indent="30"
              style="width: 100%"
            >
              <ElTableColumn prop="name" label="Name" min-width="250" />
              <ElTableColumn prop="age" label="Age" width="80" align="right" />
              <ElTableColumn prop="role" label="Role" width="180" />
              <ElTableColumn prop="address" label="Address" />
            </ElTable>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>indentSize = 30</p>
            </div>
            <VTable
              :data-source="treeData as any"
              :columns="columns as any"
              :indent-size="30"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">05</p>
            <h2>树形级联选择</h2>
          </div>
          <p class="play-case__desc">
            验证点：`checkStrictly = false` 后，父子节点联动，父节点支持半选态。
          </p>
        </header>
        <p class="play-inline-note">
          cascade keys:
          {{ cascadeSelectedRowKeys.length > 0 ? cascadeSelectedRowKeys.join(', ') : '(无)' }}
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'tree + checkStrictly=false' : '右侧统一 API 更值得验证' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :data-source="treeData"
              :columns="columns as any"
              :pagination="false"
              :row-selection="antCascadeRowSelection"
              row-key="key"
              size="middle"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">No native parity</p>
              <h3>element-plus</h3>
              <p>
                这一组回归的是 antd 风格的 `checkStrictly` 语义，父节点半选态和联动由右侧统一提供。
              </p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>rowSelection.checkStrictly = false</p>
            </div>
            <VTable
              :data-source="treeData as any"
              :columns="columns as any"
              :row-selection="cascadeRowSelection as any"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
