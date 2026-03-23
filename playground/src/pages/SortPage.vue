<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, SortOrder } from '@vtable-guild/table'
import { dataSource, type DemoRow } from '../filterMatrixShared'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
const controlledOrder = ref<SortOrder>('ascend')

const baseSortColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170, sorter: true },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 110, align: 'right', sorter: true },
  { title: 'City', dataIndex: 'city', key: 'city', width: 140 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const customSortColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  {
    title: 'Role length',
    dataIndex: 'role',
    key: 'role',
    width: 180,
    sorter: (a, b) => a.role.length - b.role.length,
  },
  { title: 'Role', dataIndex: 'role', key: 'roleText' },
]

const defaultSortColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 100,
    align: 'right',
    sorter: true,
    defaultSortOrder: 'descend',
  },
  { title: 'Team', dataIndex: 'team', key: 'team' },
]

const controlledSortColumns = computed<ColumnsType<DemoRow>>(() => [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: true,
    sortOrder: controlledOrder.value,
  },
  { title: 'Status', dataIndex: 'status', key: 'status' },
])

const sortDirectionColumns: ColumnsType<DemoRow> = [
  {
    title: ({ sortOrder }) => `Age${sortOrder ? ` · ${sortOrder}` : ''}`,
    dataIndex: 'age',
    key: 'age',
    width: 100,
    align: 'right',
    sorter: true,
  },
  {
    title: ({ sortOrder }) => `Region${sortOrder ? ` · ${sortOrder}` : ''}`,
    dataIndex: 'region',
    key: 'region',
    sorter: true,
  },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const antMultiSortColumns = [
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 100,
    align: 'right',
    sorter: { multiple: 1 },
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: { multiple: 3 },
  },
  {
    title: 'Team',
    dataIndex: 'team',
    key: 'team',
    sorter: { multiple: 2 },
  },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const multiSortColumns: ColumnsType<DemoRow> = [
  {
    title: ({ sortOrder }) => `Age${sortOrder ? ` · ${sortOrder}` : ''}`,
    dataIndex: 'age',
    key: 'age',
    width: 100,
    align: 'right',
    sorter: { multiple: 1 },
  },
  {
    title: ({ sortOrder }) => `Score${sortOrder ? ` · ${sortOrder}` : ''}`,
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    sorter: { multiple: 3 },
  },
  {
    title: ({ sortOrder }) => `Team${sortOrder ? ` · ${sortOrder}` : ''}`,
    dataIndex: 'team',
    key: 'team',
    sorter: { multiple: 2 },
  },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]
</script>

<template>
  <AConfigProvider :locale="playground.antLocale.value as any">
    <main class="play-page">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Sort Playground</p>
          <h1>排序功能单独回归</h1>
          <p class="play-summary">
            排序不再寄生在筛选页里，只在这一页验证 sorter、默认排序、受控排序、方向循环和 tooltip
            开关。
          </p>
        </div>
      </section>

      <section class="play-metrics">
        <article class="play-metric-card">
          <span class="play-metric-card__label">Route focus</span>
          <strong>sorter 全面覆盖</strong>
          <p>交互和视觉都独立观察，避免被 filter icon 干扰。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Controlled</span>
          <strong>sortOrder 外控</strong>
          <p>单独验证外部状态驱动排序箭头和当前数据顺序。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Preset</span>
          <strong>{{
            isAntdv ? 'ant-design-vue parity' : 'element-plus preset verification'
          }}</strong>
          <p>切换 preset 后重点看右侧排序按钮样式和节奏是否稳定。</p>
        </article>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">01</p>
            <h2>基础单列排序</h2>
          </div>
          <p class="play-case__desc">验证点：布尔 sorter、箭头状态和点击循环。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? '基础 sorter' : 'element-plus 左侧保留说明卡' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="baseSortColumns as any"
              :data-source="dataSource"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>排序页在 element-plus 下主要看 VTable 的主题化表达，而不是再拼一套原生对照。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>sorter: true</p>
            </div>
            <VTable :columns="baseSortColumns as any" :data-source="dataSource" row-key="key" />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">02</p>
            <h2>自定义排序函数</h2>
          </div>
          <p class="play-case__desc">验证点：自定义比较器是否生效。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'sorter(fn)' : '右侧统一 API 是验证重点' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="customSortColumns as any"
              :data-source="dataSource"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>这里让 route 保持简洁，右侧统一验证排序逻辑和主题细节。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>sorter = (a, b) =&gt; number</p>
            </div>
            <VTable :columns="customSortColumns as any" :data-source="dataSource" row-key="key" />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">03</p>
            <h2>默认排序</h2>
          </div>
          <p class="play-case__desc">验证点：首次渲染是否自动落在默认排序方向。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'defaultSortOrder' : '默认排序看右侧回归' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="defaultSortColumns as any"
              :data-source="dataSource"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>右侧直接验证 defaultSortOrder 即可，左侧不再重复一套默认排序对照。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>defaultSortOrder</p>
            </div>
            <VTable :columns="defaultSortColumns as any" :data-source="dataSource" row-key="key" />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">04</p>
            <h2>受控排序</h2>
          </div>
          <p class="play-case__desc">验证点：sortOrder 外控更新和图标状态同步。</p>
        </header>
        <div class="play-toolbar">
          <button type="button" class="play-ghost-button" @click="controlledOrder = 'ascend'">
            Ascend
          </button>
          <button type="button" class="play-ghost-button" @click="controlledOrder = 'descend'">
            Descend
          </button>
          <button type="button" class="play-ghost-button" @click="controlledOrder = null">
            Clear
          </button>
        </div>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'sortOrder controlled' : '右侧统一 API 更值得验证' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="controlledSortColumns as any"
              :data-source="dataSource"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>受控排序重点回归外部状态驱动的箭头与数据同步。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>sortOrder = {{ controlledOrder ?? 'null' }}</p>
            </div>
            <VTable
              :columns="controlledSortColumns as any"
              :data-source="dataSource"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">05</p>
            <h2>表级方向循环与标题函数</h2>
          </div>
          <p class="play-case__desc">
            验证点：表级 sortDirections 控制所有列的切换节奏，标题函数读取 sortOrder。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'table sortDirections' : '这一组更偏统一 API 细节' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="sortDirectionColumns as any"
              :data-source="dataSource"
              :pagination="false"
              :sort-directions="['descend', 'ascend', null]"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">API detail</p>
              <h3>Table-level control</h3>
              <p>
                右侧让整张表统一走 `['descend', 'ascend', null]` 循环，再由标题函数回显当前状态。
              </p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>table sortDirections + title(props)</p>
            </div>
            <VTable
              :columns="sortDirectionColumns as any"
              :data-source="dataSource"
              :sort-directions="['descend', 'ascend', null]"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">06</p>
            <h2>多列排序</h2>
          </div>
          <p class="play-case__desc">
            验证点：多个 sorter 同时生效时，change sorter 结果变成数组，标题函数同步显示状态。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'sorter.multiple' : '右侧统一 API 是验证重点' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="antMultiSortColumns as any"
              :data-source="dataSource"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>这一组重点回归 VTable 的 antd 风格多列排序语义，而不是对齐原生 sortable。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>sorter.multiple</p>
            </div>
            <VTable :columns="multiSortColumns as any" :data-source="dataSource" row-key="key" />
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
