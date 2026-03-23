<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, Expandable, Key, RowSelection } from '@vtable-guild/table'
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

const expandableContent = (record: DemoRow) =>
  h(
    'p',
    { style: { margin: 0 } },
    `${record.name} works as ${record.role} in ${record.team} team, based in ${record.city}.`,
  )

const controlledExpandedKeys = ref<Key[]>([1])
const hiddenExpandKeys = ref<Key[]>([])

const controlledExpandable = computed<Expandable<DemoRow>>(() => ({
  expandedRowRender: (record) => expandableContent(record),
  expandedRowKeys: controlledExpandedKeys.value,
  expandRowByClick: true,
  rowExpandable: (record) => record.status !== 'Draft',
  onExpandedRowsChange: (keys) => {
    controlledExpandedKeys.value = [...keys]
  },
  expandIcon: ({ expanded, expandable, onExpand, record }) =>
    h(
      'button',
      {
        type: 'button',
        class: [
          'rounded-full border px-2 py-0.5 text-xs transition-colors',
          expandable
            ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
            : 'cursor-not-allowed border-[color:var(--color-border)] text-[color:var(--color-text-secondary)]',
        ],
        disabled: !expandable,
        onClick: (e: MouseEvent) => onExpand(record, e),
      },
      expandable ? (expanded ? '收起' : '展开') : '锁定',
    ),
}))

const antExpandable = computed(() => ({
  expandedRowRender: (record: DemoRow) => expandableContent(record),
  expandedRowKeys: controlledExpandedKeys.value,
  expandRowByClick: true,
  rowExpandable: (record: DemoRow) => record.status !== 'Draft',
  onExpandedRowsChange: (keys: Key[]) => {
    controlledExpandedKeys.value = [...keys]
  },
}))

const hiddenExpandExpandable = computed<Expandable<DemoRow>>(() => ({
  expandedRowRender: (record) => expandableContent(record),
  expandedRowKeys: hiddenExpandKeys.value,
  expandRowByClick: true,
  showExpandColumn: false,
  rowExpandable: (record) => record.status !== 'Draft',
  onExpandedRowsChange: (keys) => {
    hiddenExpandKeys.value = [...keys]
  },
}))

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

// ---- Grouped Header + Header colSpan ----
const groupedColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: 'Profile',
    key: 'profile',
    children: [
      { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
      { title: 'Region', dataIndex: 'region', key: 'region', width: 150 },
    ],
  },
  {
    title: 'Work',
    key: 'work',
    children: [
      { title: 'Team', dataIndex: 'team', key: 'team', width: 160, colSpan: 2 },
      { title: 'Role', dataIndex: 'role', key: 'role', width: 180, colSpan: 0 },
    ],
  },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 220 },
]

const antGroupedColumns = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: 'Profile',
    key: 'profile',
    children: [
      { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
      { title: 'Region', dataIndex: 'region', key: 'region', width: 150 },
    ],
  },
  {
    title: 'Work',
    key: 'work',
    children: [
      { title: 'Team', dataIndex: 'team', key: 'team', width: 160, colSpan: 2 },
      { title: 'Role', dataIndex: 'role', key: 'role', width: 180, colSpan: 0 },
    ],
  },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 220 },
]

// ---- Body rowSpan / colSpan ----
interface MergeRow extends DemoRow {
  group: string
}

const mergeDataSource: MergeRow[] = [
  { ...dataSource[0]!, key: 101, group: 'North America' },
  { ...dataSource[1]!, key: 102, group: 'North America' },
  { ...dataSource[2]!, key: 103, group: 'Europe' },
  { ...dataSource[3]!, key: 104, group: 'Europe' },
  { ...dataSource[4]!, key: 105, group: 'Solo' },
]

function getGroupCellProps(index?: number) {
  if (index === 0 || index === 2) return { rowSpan: 2 }
  if (index === 1 || index === 3) return { rowSpan: 0 }
  return {}
}

const mergedColumns: ColumnsType<MergeRow> = [
  {
    title: 'Group',
    dataIndex: 'group',
    key: 'group',
    width: 150,
    customCell: (_record, index) => getGroupCellProps(index),
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    customRender: ({ text, record, index }) =>
      index === 4
        ? {
            children: `${String(text)} / ${record.score}`,
            props: { colSpan: 2 },
          }
        : String(text),
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 100,
    align: 'right',
    customRender: ({ text, index }) =>
      index === 4 ? { children: Number(text), props: { colSpan: 0 } } : Number(text),
  },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 260 },
]

const antMergedColumns = [
  {
    title: 'Group',
    dataIndex: 'group',
    key: 'group',
    width: 150,
    customCell: (_record: MergeRow, index?: number) => getGroupCellProps(index),
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    customRender: ({ text, record, index }: { text: string; record: MergeRow; index: number }) =>
      index === 4
        ? {
            children: `${text} / ${record.score}`,
            props: { colSpan: 2 },
          }
        : text,
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 100,
    align: 'right',
    customRender: ({ text, index }: { text: number; index: number }) =>
      index === 4 ? { children: text, props: { colSpan: 0 } } : text,
  },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 260 },
]

// ---- Grouped Header + Row Merge + Row Selection ----
const compositeColumns: ColumnsType<MergeRow> = [
  {
    title: 'Member',
    key: 'member',
    children: [
      {
        title: 'Group',
        dataIndex: 'group',
        key: 'group',
        width: 150,
        customCell: (_record, index) => getGroupCellProps(index),
      },
      { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
    ],
  },
  {
    title: 'Workspace',
    key: 'workspace',
    children: [
      { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
      { title: 'Address', dataIndex: 'address', key: 'address', width: 260 },
    ],
  },
]

const antCompositeColumns = [
  {
    title: 'Member',
    key: 'member',
    children: [
      {
        title: 'Group',
        dataIndex: 'group',
        key: 'group',
        width: 150,
        customCell: (_record: MergeRow, index?: number) => getGroupCellProps(index),
      },
      { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
    ],
  },
  {
    title: 'Workspace',
    key: 'workspace',
    children: [
      { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
      { title: 'Address', dataIndex: 'address', key: 'address', width: 260 },
    ],
  },
]

const antCompositeRowSelection = {
  type: 'checkbox' as const,
}

const compositeRowSelection: RowSelection<MergeRow> = {
  type: 'checkbox',
}

const apiWiringData = dataSource.slice(0, 4)
const apiSummaryScore = apiWiringData.reduce((sum, row) => sum + row.score, 0)
const apiWiringColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    customHeaderCell: () => ({
      class: 'uppercase tracking-[0.08em]',
    }),
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    customHeaderCell: () => ({
      class: 'text-[color:var(--color-primary)]',
    }),
  },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

function apiRowClassName(record: DemoRow, index: number) {
  return [index % 2 === 1 ? 'bg-black/[0.02]' : '', record.status === 'Draft' ? 'opacity-75' : '']
    .filter(Boolean)
    .join(' ')
}

function apiCustomRow(record: DemoRow, index?: number) {
  return {
    'data-status': record.status,
    style:
      index === 0
        ? {
            boxShadow: 'inset 3px 0 0 var(--color-primary)',
          }
        : undefined,
  }
}

function apiCustomHeaderRow(_columns: ColumnsType<DemoRow>, index?: number) {
  return index === 0
    ? {
        style: {
          background: 'rgba(15, 23, 42, 0.03)',
        },
      }
    : {}
}
</script>

<template>
  <AConfigProvider :locale="locale">
    <main class="play-page">
      <section class="play-hero">
        <div>
          <p class="play-kicker">Phase 5 Advanced Features</p>
          <h1>ant-design-vue 高级功能对照</h1>
          <p class="play-summary">
            固定列/固定表头、展开行、标题/页脚、多级表头、单元格合并，以及行选择综合例子
          </p>
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
            <h2>受控展开行 + 自定义展开图标</h2>
          </div>
          <p class="play-case__desc">
            验证点：expandedRowKeys 外控、expandRowByClick、rowExpandable 和自定义 expandIcon。
          </p>
        </header>
        <p class="play-inline-note">
          controlledExpandedKeys = [{{ controlledExpandedKeys.join(', ') || 'none' }}]，Draft
          行不可展开。
        </p>
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
              :expandable="controlledExpandable as any"
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

      <!-- 06 Grouped Header + Header colSpan -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 06</p>
            <h2>多级表头 + 表头 colSpan</h2>
          </div>
          <p class="play-case__desc">
            使用 children 构建多级表头，表头合并只走 column.colSpan，不扩展 header rowSpan API
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="dataSource.slice(0, 4)"
              :columns="antGroupedColumns as any"
              :scroll="{ x: 960 }"
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
              :columns="groupedColumns"
              :scroll="{ x: 960 }"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <!-- 07 Body rowSpan / colSpan -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 07</p>
            <h2>单元格合并 rowSpan / colSpan</h2>
          </div>
          <p class="play-case__desc">
            body 支持 customCell 与 customRender(RenderedCell) 合并；virtual=true 不支持该能力
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="mergeDataSource"
              :columns="antMergedColumns as any"
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
              :data-source="mergeDataSource"
              :columns="mergedColumns"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <!-- 08 Grouped Header + Row Merge + Row Selection -->
      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 08</p>
            <h2>多级表头 + 行合并 + 行选择</h2>
          </div>
          <p class="play-case__desc">
            综合验证 rowSelection checkbox + children + customCell(rowSpan)，表头仍只支持
            column.colSpan
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <h3>ant-design-vue <span class="play-badge">reference</span></h3>
            </div>
            <ATable
              :data-source="mergeDataSource"
              :columns="antCompositeColumns as any"
              :row-selection="antCompositeRowSelection"
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
              :data-source="mergeDataSource"
              :columns="compositeColumns"
              :row-selection="compositeRowSelection as any"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 09</p>
            <h2>隐藏展开列 + 点击整行展开</h2>
          </div>
          <p class="play-case__desc">
            `showExpandColumn = false` 时不渲染展开列，交互入口完全交给 expandRowByClick。
          </p>
        </header>
        <p class="play-inline-note">
          hiddenExpandKeys = [{{ hiddenExpandKeys.join(', ') || 'none' }}]
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>native note</h3>
              </div>
              <p>更偏 VTable 的 API 组合能力</p>
            </div>
            <div class="play-note-card">
              <p class="play-note-card__eyebrow">Interaction detail</p>
              <h3>showExpandColumn = false</h3>
              <p>隐藏图标列后，点击任意可展开行都会切换详情内容；Draft 行仍然不可展开。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>showExpandColumn = false</p>
            </div>
            <VTable
              :data-source="dataSource"
              :columns="expandColumns"
              :expandable="hiddenExpandExpandable as any"
              size="md"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">Case 10</p>
            <h2>row/header 自定义与 summary slot</h2>
          </div>
          <p class="play-case__desc">
            验证点：rowClassName、customRow、customHeaderRow、headerCell、bodyCell、customHeaderCell
            和 summary。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>native note</h3>
              </div>
              <p>这是统一 API 的组合回归，不强行拼原生一一对照。</p>
            </div>
            <div class="play-note-card">
              <p class="play-note-card__eyebrow">API wiring</p>
              <h3>Custom row / header / summary</h3>
              <p>
                右侧把表头插槽、行属性注入和 summary slot 放在一张表里回归，方便快速观察组合效果。
              </p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>customRow + customHeaderRow + slots + summary</p>
            </div>
            <VTable
              :data-source="apiWiringData"
              :columns="apiWiringColumns"
              :row-class-name="apiRowClassName"
              :custom-row="apiCustomRow"
              :custom-header-row="apiCustomHeaderRow"
              size="md"
              row-key="key"
            >
              <template #headerCell="{ title, column }">
                <span class="inline-flex items-center gap-2">
                  <span>{{ title }}</span>
                  <span
                    v-if="column.key === 'score'"
                    class="text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-secondary)]"
                  >
                    metric
                  </span>
                </span>
              </template>
              <template #bodyCell="{ text, column }">
                <span
                  v-if="column.key === 'status'"
                  class="inline-flex rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-xs"
                >
                  {{ text }}
                </span>
                <span
                  v-else-if="column.key === 'score'"
                  class="font-semibold text-[color:var(--color-primary)]"
                >
                  {{ text }}
                </span>
                <template v-else>{{ text }}</template>
              </template>
              <template #summary>
                <tr>
                  <td colspan="2" class="text-right font-medium">Visible score total</td>
                  <td class="text-right font-semibold text-[color:var(--color-primary)]">
                    {{ apiSummaryScore }}
                  </td>
                  <td class="text-[11px] text-[color:var(--color-text-secondary)]">summary slot</td>
                </tr>
              </template>
            </VTable>
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
