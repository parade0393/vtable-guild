<script setup lang="ts">
import { computed, h, inject, provide, reactive, ref } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, Expandable, Key, RowSelection } from '@vtable-guild/table'
import { VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { dataSource, type DemoRow } from '../filterMatrixShared'

const parentContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
provide(
  VTABLE_GUILD_INJECTION_KEY,
  reactive({
    get themePreset() {
      return 'element-plus' as const
    },
    get theme() {
      return parentContext?.theme ?? {}
    },
    get locale() {
      return parentContext?.locale ?? 'zh-CN'
    },
    get locales() {
      return parentContext?.locales ?? {}
    },
    get localeOverrides() {
      return parentContext?.localeOverrides ?? {}
    },
  }) as VTableGuildContext,
)

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

function elementMergeSpanMethod({
  rowIndex,
  columnIndex,
}: {
  row: MergeRow
  column: unknown
  rowIndex: number
  columnIndex: number
}) {
  if (columnIndex === 0) {
    if (rowIndex === 0 || rowIndex === 2) return { rowspan: 2, colspan: 1 }
    if (rowIndex === 1 || rowIndex === 3) return { rowspan: 0, colspan: 0 }
  }

  if (columnIndex === 1 && rowIndex === 4) {
    return { rowspan: 1, colspan: 2 }
  }

  if (columnIndex === 2 && rowIndex === 4) {
    return { rowspan: 0, colspan: 0 }
  }

  return { rowspan: 1, colspan: 1 }
}

function elementCompositeSpanMethod({
  rowIndex,
  columnIndex,
}: {
  row: MergeRow
  column: unknown
  rowIndex: number
  columnIndex: number
}) {
  if (columnIndex === 1) {
    if (rowIndex === 0 || rowIndex === 2) return { rowspan: 2, colspan: 1 }
    if (rowIndex === 1 || rowIndex === 3) return { rowspan: 0, colspan: 0 }
  }

  return { rowspan: 1, colspan: 1 }
}
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Phase 5 Advanced Features</p>
        <h1>element-plus 高级功能对照</h1>
        <p class="play-summary">
          固定列/固定表头、展开行、标题/页脚、多级表头、单元格合并，以及带行选择的综合场景。
        </p>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Case count</span>
        <strong>10</strong>
        <p>
          固定列、固定表头、受控展开、标题/页脚、列宽拖拽、多级表头、单元格合并、综合例子与 API
          组合回归。
        </p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Parity</span>
        <strong>6 / 8 real native parity</strong>
        <p>
          固定列、固定表头、展开行、多级表头、单元格合并、综合例子有原生对照；
          标题/页脚和列宽拖拽无直接对位。
        </p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Focus</span>
        <strong>Advanced layout + composite behavior</strong>
        <p>验证 element-plus preset 在高级布局和组合型交互场景下的视觉与行为表达。</p>
      </article>
    </section>

    <!-- 01 Fixed Columns (scroll.x) -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 01</p>
          <h2>固定列 + 横向滚动</h2>
        </div>
        <p class="play-case__desc">
          ElTable 通过 ElTableColumn fixed="left/right" 固定列，VTable 不传 scroll.x 自动横向滚动
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>真实原生对照</p>
          </div>
          <ElTable :data="dataSource" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="120" fixed="left" />
            <ElTableColumn prop="age" label="Age" width="80" align="right" />
            <ElTableColumn prop="status" label="Status" width="120" />
            <ElTableColumn prop="city" label="City" width="120" />
            <ElTableColumn prop="region" label="Region" width="150" />
            <ElTableColumn prop="team" label="Team" width="150" />
            <ElTableColumn prop="role" label="Role" width="180" />
            <ElTableColumn prop="score" label="Score" width="100" align="right" />
            <ElTableColumn prop="address" label="Address" width="120" fixed="right" />
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>真实验证目标</p>
          </div>
          <VTable :data-source="dataSource" :columns="fixedColumns" size="md" row-key="key" />
        </article>
      </div>
    </section>

    <!-- 02 Fixed Header (scroll.y / height) -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 02</p>
          <h2>固定表头 + 纵向滚动</h2>
        </div>
        <p class="play-case__desc">
          ElTable 使用 :height 固定表头，VTable 使用 :scroll="{ y: 200 }"，纵向滚动时表头保持固定
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>:height="200" 原生对照</p>
          </div>
          <ElTable :data="dataSource" :height="200" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="150" />
            <ElTableColumn prop="age" label="Age" width="80" align="right" />
            <ElTableColumn prop="status" label="Status" width="120" />
            <ElTableColumn prop="address" label="Address" width="560" />
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>:scroll="{ y: 200 }"</p>
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
          ElTable 使用 type="expand" 列 + template slot；右侧进一步回归
          expandedRowKeys、expandRowByClick 和 rowExpandable。
        </p>
      </header>
      <p class="play-inline-note">
        controlledExpandedKeys = [{{ controlledExpandedKeys.join(', ') || 'none' }}]，Draft
        行不可展开。
      </p>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>type="expand" 原生对照</p>
          </div>
          <ElTable :data="dataSource" style="width: 100%" row-key="key">
            <ElTableColumn type="expand">
              <template #default="{ row }">
                <p style="margin: 0">
                  {{ row.name }} works as {{ row.role }} in {{ row.team }} team, based in
                  {{ row.city }}.
                </p>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" />
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>controlled expandable</p>
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
        <p class="play-case__desc">
          ElTable 没有 title/footer prop，只有 #append slot；VTable 支持 title/footer props
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>
              ElTable 没有 title、footer prop，仅提供 #append slot
              用于在表格末尾追加内容，不等同于表级标题/页脚。
            </p>
            <p>右侧验证 VTable 的 title/footer props 在 element-plus preset 下的表现。</p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>title + footer props</p>
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
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
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
          ElTable 原生支持多级表头，但没有 antd 风格的 column.colSpan API；右侧同时验证 VTable 的
          children + header colSpan
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>原生多级表头</p>
          </div>
          <ElTable :data="dataSource.slice(0, 4)" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="160" />
            <ElTableColumn label="Profile">
              <ElTableColumn prop="age" label="Age" width="90" align="right" />
              <ElTableColumn prop="region" label="Region" width="150" />
            </ElTableColumn>
            <ElTableColumn label="Work">
              <ElTableColumn prop="team" label="Team" width="160" />
              <ElTableColumn prop="role" label="Role" width="180" />
            </ElTableColumn>
            <ElTableColumn prop="address" label="Address" width="220" />
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>children + column.colSpan</p>
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
          ElTable 使用 span-method；VTable 对齐 antd 语义，走 customCell 与
          customRender(RenderedCell)
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>span-method 原生对照</p>
          </div>
          <ElTable
            :data="mergeDataSource"
            :span-method="elementMergeSpanMethod"
            style="width: 100%"
          >
            <ElTableColumn prop="group" label="Group" width="150" />
            <ElTableColumn prop="name" label="Name" width="180" />
            <ElTableColumn prop="score" label="Score" width="100" align="right" />
            <ElTableColumn prop="address" label="Address" width="260" />
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>customCell + customRender</p>
          </div>
          <VTable :data-source="mergeDataSource" :columns="mergedColumns" size="md" row-key="key" />
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
          ElTable 组合 type="selection" + 多级表头 + span-method，VTable 统一走 rowSelection +
          children + customCell(rowSpan)
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>selection + grouped header + span-method</p>
          </div>
          <ElTable
            :data="mergeDataSource"
            :span-method="elementCompositeSpanMethod"
            style="width: 100%"
            row-key="key"
          >
            <ElTableColumn type="selection" width="48" />
            <ElTableColumn label="Member">
              <ElTableColumn prop="group" label="Group" width="150" />
              <ElTableColumn prop="name" label="Name" width="180" />
            </ElTableColumn>
            <ElTableColumn label="Workspace">
              <ElTableColumn prop="score" label="Score" width="100" align="right" />
              <ElTableColumn prop="address" label="Address" width="260" />
            </ElTableColumn>
          </ElTable>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>rowSelection + children + customCell</p>
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
          `showExpandColumn = false` 后不渲染展开列，交互入口完全交给 expandRowByClick。
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
              <h3>element-plus preset</h3>
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
              <h3>element-plus preset</h3>
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
</template>
