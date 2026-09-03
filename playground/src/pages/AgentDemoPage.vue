<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VTable,
  VTableSummary,
  type Key,
  type RowSelection,
  type TableColumnsType,
} from '@vtable-guild/vtable-guild'

interface AgentRow {
  key: string
  name: string
  department: string
  age: number
  score: number
  status: 'active' | 'paused' | 'review'
  email: string
  city: string
  children?: AgentRow[]
}

const DEPARTMENTS = ['华东大区', '华南大区', '华北大区', '西部大区', '海外事业部'] as const
const CITIES = ['上海', '深圳', '北京', '成都', '新加坡'] as const
const STATUSES: AgentRow['status'][] = ['active', 'paused', 'review']

function pick<T>(list: readonly T[], i: number, fallback: T): T {
  return list[i % list.length] ?? fallback
}

// ---- 树形数据：3 个父节点，各带 2 个子节点 ----
const TREE_DATA: AgentRow[] = ['平台研发部', '数据智能部', '基础架构部'].map((name, i) => ({
  key: `tree-${i + 1}`,
  name,
  department: pick(DEPARTMENTS, i, '华东大区'),
  age: 32 + i * 3,
  score: 88 - i * 2,
  status: 'active',
  email: `dept${i + 1}@vtable.guild`,
  city: pick(CITIES, i, '上海'),
  children: [0, 1].map((j) => ({
    key: `tree-${i + 1}-${j + 1}`,
    name: `${name} · 小组 ${j + 1}`,
    department: pick(DEPARTMENTS, i, '华东大区'),
    age: 26 + j * 2,
    score: 80 - i * 2 - j,
    status: pick(STATUSES, i + j, 'active'),
    email: `dept${i + 1}-team${j + 1}@vtable.guild`,
    city: pick(CITIES, i + j, '上海'),
  })),
}))

// ---- 扁平部分：补足到 5000 行（树形展开后总量） ----
const TOTAL_ROWS = 5000
const TREE_COUNT = 9 // 3 父节点 + 6 子节点

const flatRows: AgentRow[] = Array.from({ length: TOTAL_ROWS - TREE_COUNT }, (_, i) => ({
  key: `row-${i + 1}`,
  name: `成员 ${i + 1}`,
  department: pick(DEPARTMENTS, i, '华东大区'),
  age: 22 + ((i * 7) % 30),
  score: (i * 37 + 13) % 100,
  status: pick(STATUSES, i, 'active'),
  email: `member${i + 1}@vtable.guild`,
  city: pick(CITIES, i, '上海'),
}))

const dataSource: AgentRow[] = [...TREE_DATA, ...flatRows]

// ---- 列配置：首列固定左、末列固定右、部门列可拖拽、状态列可筛选 ----
const columns = ref<TableColumnsType<AgentRow>>([
  { title: '姓名', key: 'name', dataIndex: 'name', width: 160, fixed: 'left' },
  {
    title: '部门',
    key: 'department',
    dataIndex: 'department',
    width: 170,
    resizable: true,
    minWidth: 120,
    maxWidth: 320,
  },
  { title: '年龄', key: 'age', dataIndex: 'age', width: 90, align: 'right' },
  { title: '绩效分', key: 'score', dataIndex: 'score', width: 110, align: 'right' },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 130,
    filters: [
      { text: '在职', value: 'active' },
      { text: '休假', value: 'paused' },
      { text: '评估中', value: 'review' },
    ],
    onFilter: (value, record) => record.status === value,
  },
  { title: '邮箱', key: 'email', dataIndex: 'email', width: 220, ellipsis: true },
  { title: '城市', key: 'city', dataIndex: 'city', width: 140 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
])

function handleResizeColumn(column: TableColumnsType<AgentRow>[number], width: number) {
  // resizeColumn 的 column 参数类型含 ColumnSentinel（非对象类型），需先收窄再回写宽度
  if (typeof column === 'object') {
    column.width = width
  }
}

// ---- 受控行选择：父子联动（checkStrictly: false，注意本库默认值为 true） ----
const selectedRowKeys = ref<Key[]>([])

const rowSelection = computed<RowSelection<AgentRow>>(() => ({
  type: 'checkbox',
  checkStrictly: false,
  fixed: true,
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))

// 树形展开 props 在 VTable 顶层（不在 expandable 里）
const defaultExpandedKeys: Key[] = ['tree-1', 'tree-2', 'tree-3']

// ---- 统计 ----
const totalRows = computed(() =>
  dataSource.reduce((sum, row) => sum + 1 + (row.children?.length ?? 0), 0),
)
const totalScore = computed(() => dataSource.reduce((sum, row) => sum + row.score, 0))
</script>

<template>
  <div class="agent-demo-page">
    <h2>Agent Demo：树形 + 受控选择 + 虚拟滚动 + 固定列 + 摘要 + 列宽拖拽 + 筛选</h2>
    <p class="agent-demo-desc">
      5000 行本地 mock 数据（含 3 棵子树）；勾选父节点联动子节点；scroll.y 为像素值配合 virtual；
      首列固定左侧、操作列固定右侧；底部摘要行展示绩效分总计。
    </p>

    <div class="agent-demo-toolbar">
      <span>总行数（含子节点）：{{ totalRows }}</span>
      <span class="agent-demo-selected">已选行数：{{ selectedRowKeys.length }}</span>
      <button type="button" class="agent-demo-clear" @click="selectedRowKeys = []">清空选择</button>
    </div>

    <VTable
      row-key="key"
      :columns="columns"
      :data-source="dataSource"
      :row-selection="rowSelection"
      :default-expanded-row-keys="defaultExpandedKeys"
      :scroll="{ x: 1200, y: 480 }"
      :virtual="true"
      bordered
      size="middle"
      @resize-column="handleResizeColumn"
    >
      <template #bodyCell="{ column }">
        <template v-if="column.key === 'action'">
          <span class="agent-demo-link">详情</span>
          <span class="agent-demo-link">编辑</span>
        </template>
      </template>

      <template #summary>
        <VTableSummary fixed>
          <VTableSummary.Row>
            <VTableSummary.Cell :index="0" :col-span="2">
              合计（全部 {{ totalRows }} 行）
            </VTableSummary.Cell>
            <VTableSummary.Cell :index="2" :col-span="6">绩效分总计 →</VTableSummary.Cell>
            <VTableSummary.Cell :index="8" align="right">
              {{ totalScore.toLocaleString() }}
            </VTableSummary.Cell>
          </VTableSummary.Row>
        </VTableSummary>
      </template>
    </VTable>
  </div>
</template>

<style scoped>
.agent-demo-page {
  padding: 24px;
}

.agent-demo-page h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.agent-demo-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: #8c8c8c;
}

.agent-demo-toolbar {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.agent-demo-selected {
  font-weight: 600;
}

.agent-demo-clear {
  padding: 2px 10px;
  cursor: pointer;
}

.agent-demo-link {
  margin-left: 12px;
  color: #1677ff;
  cursor: pointer;
}

.agent-demo-link:first-child {
  margin-left: 0;
}
</style>
