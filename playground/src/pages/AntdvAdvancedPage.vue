<script setup lang="ts">
import { h, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, Expandable } from '@vtable-guild/table'
import { dataSource, type DemoRow } from '../filterMatrixShared'

defineProps<{
  locale: Record<string, unknown>
}>()

// ---- Fixed columns ----
const fixedColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 120, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'City', dataIndex: 'city', key: 'city', width: 120 },
  { title: 'Region', dataIndex: 'region', key: 'region', width: 150 },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 150 },
  { title: 'Role', dataIndex: 'role', key: 'role', width: 180 },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 120, fixed: 'right' },
]

// ---- Fixed header (scroll.y) ----
const scrollYColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 560 },
]

// ---- Expandable ----
const expandColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 130 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

const expandedRowKeys = ref<(string | number)[]>([])

const expandable: Expandable<DemoRow> = {
  expandedRowRender: (record) =>
    h(
      'p',
      { style: { margin: 0 } },
      `${record.name} works as ${record.role} in ${record.team} team, based in ${record.city}.`,
    ),
}

const antExpandable = {
  expandedRowRender: (record: DemoRow) =>
    h(
      'p',
      { style: { margin: 0 } },
      `${record.name} works as ${record.role} in ${record.team} team, based in ${record.city}.`,
    ),
}

// ---- Title / Footer / Summary ----
const summaryColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

// ---- Resize ----
const resizeColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170, resizable: true },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right', resizable: true },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 130, resizable: true },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]
</script>

<template>
  <AConfigProvider :locale="locale">
    <main class="play-page">
      <section class="play-hero">
        <div>
          <p class="play-kicker">Phase 5 Advanced Features</p>
          <h1>ant-design-vue 高级功能对照</h1>
          <p class="play-summary">固定列/固定表头、展开行、标题/页脚/摘要行、列宽拖拽</p>
        </div>
      </section>

      <!-- 01 Fixed Columns (scroll.x) -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 01</p>
            <h2>固定列 + 自动横向滚动</h2>
          </div>
          <p class="play-case__desc">VTable 不传 scroll.x，列宽超出容器时自动横向滚动</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="dataSource"
              :columns="fixedColumns as any"
              :scroll="{ x: 1300 }"
              :pagination="false"
              size="middle"
              row-key="key"
            />
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <h3>VTable <span class="play-badge play-badge--accent">guild</span></h3>
            </div>
            <VTable :data-source="dataSource" :columns="fixedColumns" size="md" row-key="key" />
          </article>
        </div>
      </section>

      <!-- 02 Fixed Header (scroll.y) -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 02</p>
            <h2>固定表头 scroll.y + 横向同步</h2>
          </div>
          <p class="play-case__desc">纵向滚动同时支持横向滚动，表头与表体保持同步</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="dataSource"
              :columns="scrollYColumns as any"
              :scroll="{ y: 200 }"
              :pagination="false"
              size="middle"
              row-key="key"
            />
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <h3>VTable <span class="play-badge play-badge--accent">guild</span></h3>
            </div>
            <VTable
              :data-source="dataSource"
              :columns="scrollYColumns"
              :scroll="{ y: 200 }"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <!-- 03 Expandable Rows -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 03</p>
            <h2>展开行</h2>
          </div>
          <p class="play-case__desc">点击图标展开行，显示详情</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="dataSource"
              :columns="expandColumns as any"
              :expandable="antExpandable"
              :pagination="false"
              size="middle"
              row-key="key"
            />
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <h3>VTable <span class="play-badge play-badge--accent">guild</span></h3>
            </div>
            <VTable
              :data-source="dataSource"
              :columns="expandColumns"
              :expandable="expandable"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <!-- 04 Title / Footer / Summary -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 04</p>
            <h2>标题 / 页脚 / 摘要行</h2>
          </div>
          <p class="play-case__desc">title、footer props + summary slot</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="dataSource.slice(0, 4)"
              :columns="summaryColumns as any"
              :title="() => 'Table Title'"
              :footer="() => 'Table Footer'"
              :pagination="false"
              size="middle"
              row-key="key"
            />
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <h3>VTable <span class="play-badge play-badge--accent">guild</span></h3>
            </div>
            <VTable
              :data-source="dataSource.slice(0, 4)"
              :columns="summaryColumns"
              :title="() => 'Table Title'"
              :footer="() => 'Table Footer'"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <!-- 05 Column Resize -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 05</p>
            <h2>列宽拖拽调整</h2>
          </div>
          <p class="play-case__desc">拖拽表头右侧手柄调整列宽</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel play-panel--accent" style="grid-column: span 2">
            <div class="play-panel__head">
              <h3>VTable <span class="play-badge play-badge--accent">guild</span></h3>
              <p>拖拽 Name / Age / Status 列的右侧边缘</p>
            </div>
            <VTable
              :data-source="dataSource.slice(0, 4)"
              :columns="resizeColumns"
              size="md"
              row-key="key"
              @resize-column="(col: any, w: number) => console.log('resize', col.title, w)"
            />
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
