<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SELECTION_COLUMN,
  VTable,
  VTableGuildConfigProvider,
  VTableSummary,
} from '@vtable-guild/vtable-guild'
import type { ColumnsType, Key, SortOrder, VTableGuildCssMode } from '@vtable-guild/vtable-guild'
// 预构建 CSS（tokens + presets + transitions + vtg- 前缀工具类）。其中的 vtg- 前缀规则
// 只会被 prebuilt 模式输出的类命中，与 playground 全局 Tailwind 4 的裸工具类互不冲突。
import '@vtable-guild/vtable-guild/css/style'

interface Employee extends Record<string, unknown> {
  key: string
  name: string
  department: string
  city: string
  status: 'active' | 'closed' | 'paused'
  score: number
  age: number
  note: string
  longText: string
}

interface TreeNode extends Record<string, unknown> {
  key: string
  name: string
  count: number
  children?: TreeNode[]
}

interface MergeRow extends Record<string, unknown> {
  key: string
  dept: string
  name: string
  role: string
  score: number
}

const cssMode = ref<VTableGuildCssMode>('prebuilt')

// ---- 共享数据 ----

const employees: Employee[] = [
  {
    key: '1',
    name: 'Alice Johnson',
    department: '研发部',
    city: '上海',
    status: 'active',
    score: 91,
    age: 29,
    note: '负责表格内核渲染层',
    longText:
      '这是一段非常长的备注文本，用于展示列省略与悬停 tooltip 的效果，内容超出列宽时应该被截断。',
  },
  {
    key: '2',
    name: 'Bob Chen',
    department: '研发部',
    city: '杭州',
    status: 'paused',
    score: 87,
    age: 34,
    note: '负责筛选与排序交互',
    longText: '较短的备注。',
  },
  {
    key: '3',
    name: 'Carol Diaz',
    department: '设计部',
    city: '上海',
    status: 'active',
    score: 95,
    age: 27,
    note: '维护主题 token 与预设',
    longText: '另一段很长的文本，同样用于省略与 tooltip 场景，超出列宽时截断并显示完整内容。',
  },
  {
    key: '4',
    name: 'David Lee',
    department: '市场部',
    city: '北京',
    status: 'closed',
    score: 58,
    age: 41,
    note: '负责对外合作',
    longText: '普通备注。',
  },
  {
    key: '5',
    name: 'Eve Wang',
    department: '市场部',
    city: '广州',
    status: 'active',
    score: 76,
    age: 31,
    note: '负责活动运营',
    longText: '普通备注。',
  },
  {
    key: '6',
    name: 'Frank Miller',
    department: '设计部',
    city: '深圳',
    status: 'active',
    score: 88,
    age: 25,
    note: '负责图标体系',
    longText: '普通备注。',
  },
  {
    key: '7',
    name: 'Grace Liu',
    department: '研发部',
    city: '北京',
    status: 'paused',
    score: 69,
    age: 38,
    note: '负责文档与示例',
    longText: '普通备注。',
  },
  {
    key: '8',
    name: 'Henry Zhou',
    department: '市场部',
    city: '杭州',
    status: 'active',
    score: 82,
    age: 45,
    note: '负责渠道拓展',
    longText: '普通备注。',
  },
]

const treeData: TreeNode[] = [
  {
    key: 't1',
    name: '华东大区',
    count: 320,
    children: [
      {
        key: 't1-1',
        name: '上海团队',
        count: 180,
        children: [
          { key: 't1-1-1', name: '浦东小组', count: 96 },
          { key: 't1-1-2', name: '徐汇小组', count: 84 },
        ],
      },
      { key: 't1-2', name: '杭州团队', count: 140 },
    ],
  },
  {
    key: 't2',
    name: '华南大区',
    count: 210,
    children: [
      { key: 't2-1', name: '深圳团队', count: 130 },
      { key: 't2-2', name: '广州团队', count: 80 },
    ],
  },
  { key: 't3', name: '华北大区', count: 150 },
]

const mergeRows: MergeRow[] = [
  { key: 'm1', dept: '研发部', name: '张三', role: '前端', score: 91 },
  { key: 'm2', dept: '研发部', name: '李四', role: '前端', score: 88 },
  { key: 'm3', dept: '研发部', name: '王五', role: '测试', score: 79 },
  { key: 'm4', dept: '设计部', name: '赵六', role: '视觉', score: 93 },
]

const virtualRows = Array.from({ length: 500 }, (_, index) => ({
  key: index + 1,
  name: `虚拟行 ${index + 1}`,
  score: (index * 7) % 100,
  note: `第 ${index + 1} 行数据`,
}))

const virtualColumns: ColumnsType<{ key: number; name: string; score: number; note: string }> = [
  { title: '#', dataIndex: 'key', key: 'key', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: '备注', dataIndex: 'note', key: 'note' },
]

// ---- 1. 对齐 ----

const activeCount = computed(() => employees.filter((row) => row.status === 'active').length)
const totalScore = computed(() => employees.reduce((sum, row) => sum + row.score, 0))

const alignColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 200 },
  { title: '状态（居中）', dataIndex: 'status', key: 'status', align: 'center' },
  { title: '分数（右对齐）', dataIndex: 'score', key: 'score', width: 140, align: 'right' },
]

// ---- 2. 固定列 + 无 scroll.x ----

const fixedColumns: ColumnsType<Employee> = [
  { title: '#', dataIndex: 'key', key: 'id', width: 64, fixed: 'left' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '备注', dataIndex: 'note', key: 'note', ellipsis: true },
  { title: '分数', dataIndex: 'score', key: 'count', width: 100, align: 'right' },
  { title: '操作', key: 'action', width: 110, fixed: 'right', align: 'center' },
]

// ---- 3. 外观 ----

const tableSize = ref<'large' | 'middle' | 'small'>('middle')
const bordered = ref(true)
const striped = ref(false)
const hoverable = ref(true)
const showHeader = ref(true)

const appearanceColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 100 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 90, align: 'right' },
]

// ---- 4. 多级表头 ----

const groupedColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 150 },
  {
    title: '成绩',
    key: 'score-group',
    align: 'center',
    children: [
      { title: '分数', dataIndex: 'score', key: 'chinese', width: 110, align: 'right' },
      { title: '年龄', dataIndex: 'age', key: 'math', width: 110, align: 'right' },
    ],
  },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '备注（居中）', dataIndex: 'note', key: 'note', align: 'center' },
]

// ---- 5. 排序 ----

const controlledOrder = ref<SortOrder>('ascend')
const lastSortInfo = ref('（尚未排序）')

const sortColumns = computed<ColumnsType<Employee>>(() => [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 150, sorter: true },
  {
    title: '年龄（多列 1）',
    dataIndex: 'age',
    key: 'age',
    width: 150,
    align: 'right',
    sorter: { compare: (a, b) => a.age - b.age, multiple: 1 },
  },
  {
    title: '分数（多列 2）',
    dataIndex: 'score',
    key: 'score',
    width: 150,
    align: 'right',
    sorter: { compare: (a, b) => a.score - b.score, multiple: 2 },
  },
  {
    title: '状态（默认降序）',
    dataIndex: 'status',
    key: 'status',
    width: 160,
    sorter: true,
    defaultSortOrder: 'descend',
  },
  {
    title: '城市（反向循环）',
    dataIndex: 'city',
    key: 'city',
    width: 150,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: '备注（无 tooltip）',
    dataIndex: 'note',
    key: 'note',
    sorter: true,
    showSorterTooltip: false,
  },
  {
    title: '分数（受控）',
    dataIndex: 'score',
    key: 'controlled',
    width: 140,
    align: 'right',
    sorter: true,
    sortOrder: controlledOrder.value,
  },
])

function handleSortChange(
  _filters: Record<string, (string | number | boolean)[] | null>,
  sorter: { columnKey?: Key; order?: SortOrder } | Array<{ columnKey?: Key; order?: SortOrder }>,
) {
  const first = Array.isArray(sorter) ? sorter[0] : sorter
  lastSortInfo.value = `column: ${String(first?.columnKey)} / order: ${String(first?.order)}`
}

// ---- 6. 筛选 ----

const filterColumns: ColumnsType<Employee> = [
  {
    title: '部门（搜索框）',
    dataIndex: 'department',
    key: 'department',
    width: 170,
    filters: [
      { text: '研发部', value: '研发部' },
      { text: '设计部', value: '设计部' },
      { text: '市场部', value: '市场部' },
    ],
    onFilter: (value, record) => record.department === value,
    filterSearch: true,
  },
  {
    title: '城市（树形）',
    dataIndex: 'city',
    key: 'city',
    width: 150,
    filterMode: 'tree',
    filters: [
      {
        text: '华东',
        value: 'east',
        children: [
          { text: '上海', value: '上海' },
          { text: '杭州', value: '杭州' },
        ],
      },
      {
        text: '其他',
        value: 'others',
        children: [
          { text: '北京', value: '北京' },
          { text: '广州', value: '广州' },
          { text: '深圳', value: '深圳' },
        ],
      },
    ],
    onFilter: (value, record) => record.city === value,
  },
  {
    title: '状态（单选 + 默认值）',
    dataIndex: 'status',
    key: 'status',
    width: 190,
    filterMultiple: false,
    defaultFilteredValue: ['active'],
    filterResetToDefaultFilteredValue: true,
    filters: [
      { text: '在职', value: 'active' },
      { text: '暂停', value: 'paused' },
      { text: '离职', value: 'closed' },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: '姓名（自定义图标）',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    filterIcon: ({ filtered }) => (filtered ? '★' : '☆'),
    filters: [
      { text: 'A-F 开头', value: 'a' },
      { text: 'G-M 开头', value: 'g' },
    ],
    onFilter: (value, record) =>
      value === 'a' ? /^[a-f]/i.test(record.name) : /^[g-m]/i.test(record.name),
  },
  {
    title: '备注（自定义面板）',
    dataIndex: 'note',
    key: 'note',
    customFilterDropdown: true,
    filters: [
      { text: '含「负责」', value: '负责' },
      { text: '含「维护」', value: '维护' },
    ],
    onFilter: (value, record) => record.note.includes(String(value)),
  },
]

function handleCustomFilterInput(
  event: Event,
  setSelectedKeys: (keys: (string | number | boolean)[]) => void,
) {
  const target = event.target as HTMLInputElement
  setSelectedKeys([target.value])
}

// ---- 7. 行选择 ----

const checkedRowKeys = ref<Key[]>(['1', '3'])
const radioRowKey = ref<Key>('2')
const lastSelectInfo = ref('（尚未选择）')

const checkboxSelection = computed(() => ({
  selectedRowKeys: checkedRowKeys.value,
  onChange: (keys: Key[]) => {
    checkedRowKeys.value = keys
    lastSelectInfo.value = `checkbox: ${keys.length} 行`
  },
  getCheckboxProps: (record: Employee) => ({ disabled: record.status === 'closed' }),
  selections: true as const,
  fixed: 'left' as const,
}))

const radioSelection = computed(() => ({
  type: 'radio' as const,
  selectedRowKeys: radioRowKey.value,
  onChange: (keys: Key[]) => {
    radioRowKey.value = keys[0] ?? ''
    lastSelectInfo.value = `radio: ${String(keys[0])}`
  },
  hideSelectAll: true,
  columnWidth: 60,
  columnTitle: '选',
}))

const radioColumns: ColumnsType<Employee> = [
  SELECTION_COLUMN,
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 90, align: 'right' },
]

// ---- 8. 展开行 ----

const expandableConfig = {
  expandedRowRender: (record: Employee) =>
    `所属：${record.department} / ${record.city}，状态：${record.status}，备注：${record.note}`,
  expandRowByClick: true,
  rowExpandable: (record: Employee) => record.key !== '4',
  columnWidth: 60,
  fixed: 'left' as const,
  defaultExpandedRowKeys: ['1'],
  expandedRowClassName: 'prebuilt-page__expanded-row',
}

const expandColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 100 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 90, align: 'right' },
]

// ---- 9. 树形数据 ----

const treeColumns: ColumnsType<TreeNode> = [
  { title: '组织', dataIndex: 'name', key: 'name', width: 240 },
  { title: '人数', dataIndex: 'count', key: 'count', width: 120, align: 'right' },
]

// ---- 10. 合并单元格 ----

const mergeColumns: ColumnsType<MergeRow> = [
  {
    title: '部门',
    dataIndex: 'dept',
    key: 'dept',
    width: 140,
    customCell: (record, index) => {
      const isFirstOfGroup = index === 0 || mergeRows[index - 1]?.dept !== record.dept
      const span = mergeRows.filter((row) => row.dept === record.dept).length
      return { rowSpan: isFirstOfGroup ? span : 0 }
    },
  },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 120 },
  { title: '分数', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
]

// ---- 11. 省略 ----

const ellipsisColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 130 },
  {
    title: '长备注（省略 + tooltip）',
    dataIndex: 'longText',
    key: 'longText',
    width: 220,
    ellipsis: true,
  },
  {
    title: '短备注（省略无 tooltip）',
    dataIndex: 'note',
    key: 'note',
    width: 200,
    ellipsis: { showTitle: false },
  },
  { title: '部门', dataIndex: 'department', key: 'department' },
]

// ---- 12. 可调整列宽 ----

const resizedWidth = ref('（尚未拖拽）')

const resizableColumns: ColumnsType<Employee> = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    resizable: true,
    minWidth: 100,
    maxWidth: 320,
  },
  {
    title: '部门',
    dataIndex: 'department',
    key: 'department',
    width: 160,
    resizable: true,
    minWidth: 80,
  },
  { title: '城市', dataIndex: 'city', key: 'city', width: 120, resizable: true },
  { title: '分数', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
]

// ---- 13. 加载 / 空态 ----

const loadingActive = ref(false)

const loadingColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '部门', dataIndex: 'department' },
]

const emptyColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '部门', dataIndex: 'department' },
]

// ---- 14. 样式覆盖 / 行交互 ----

const clickedRowName = ref('（尚未点击行）')

const styledColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 150 },
  {
    title: '部门',
    dataIndex: 'department',
    key: 'department',
    width: 130,
    className: 'prebuilt-page__col-mark',
    customHeaderCell: () => ({ style: { color: '#d46b08' } }),
  },
  {
    title: '分数',
    dataIndex: 'score',
    key: 'score',
    width: 110,
    align: 'right',
    customCell: (record) => ({
      style: record.score >= 90 ? { color: '#389e0d', fontWeight: 600 } : undefined,
    }),
  },
  { title: '备注', dataIndex: 'note', key: 'note' },
]

function rowClassName(record: Employee) {
  return record.status === 'closed' ? 'prebuilt-page__row-muted' : ''
}

function customRowProps(record: Employee) {
  return { onClick: () => (clickedRowName.value = record.name) }
}

// ---- 15. 固定列 + scroll.x / y + sticky ----

const wideColumns: ColumnsType<Employee> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: '部门', dataIndex: 'department', key: 'department', width: 140 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 140 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 120, align: 'right' },
  { title: '分数', dataIndex: 'score', key: 'score', width: 140, align: 'right' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '备注', dataIndex: 'note', key: 'note', width: 240, ellipsis: true },
  { title: '长文本', dataIndex: 'longText', key: 'longText', width: 260, ellipsis: true },
  { title: '操作', key: 'action', width: 110, fixed: 'right', align: 'center' },
]
</script>

<template>
  <VTableGuildConfigProvider :css-mode="cssMode">
    <div class="prebuilt-page">
      <section class="prebuilt-page__intro">
        <h2>Prebuilt cssMode</h2>
        <p>
          本页通过局部 <code>VTableGuildConfigProvider</code> 覆盖 cssMode，并加载预构建 CSS
          （<code>@vtable-guild/vtable-guild/css/style</code>）。切换 cssMode 可对比同一组件树在
          <code>prebuilt</code>（输出 vtg- 前缀类）与 <code>tailwind4</code>（输出裸工具类）下的
          渲染结果。下方 demo 共用同一组件树，用于回归 prebuilt 管道下的 API 矩阵。
        </p>
        <div class="prebuilt-page__switch" role="group" aria-label="cssMode switch">
          <button
            type="button"
            :class="{ 'is-active': cssMode === 'prebuilt' }"
            @click="cssMode = 'prebuilt'"
          >
            prebuilt
          </button>
          <button
            type="button"
            :class="{ 'is-active': cssMode === 'tailwind4' }"
            @click="cssMode = 'tailwind4'"
          >
            tailwind4
          </button>
        </div>
        <p class="prebuilt-page__hint">当前 cssMode：{{ cssMode }}</p>
      </section>

      <section class="prebuilt-page__case">
        <h3>1. 列对齐（header / body / summary）</h3>
        <p>
          <code>align: 'center' | 'right'</code> 在 prebuilt 模式下应输出
          <code>vtg-text-center</code> / <code>vtg-text-right</code>，表头、表体与汇总行同时生效。
        </p>
        <VTable
          row-key="key"
          :columns="alignColumns"
          :data-source="employees"
          :scroll="{ y: 220 }"
          size="middle"
        >
          <template #summary>
            <VTableSummary fixed="bottom">
              <VTableSummary.Row>
                <VTableSummary.Cell :index="0">合计</VTableSummary.Cell>
                <VTableSummary.Cell :index="1" align="center">
                  {{ activeCount }} 项 active
                </VTableSummary.Cell>
                <VTableSummary.Cell :index="2" align="right">
                  {{ totalScore }}
                </VTableSummary.Cell>
              </VTableSummary.Row>
            </VTableSummary>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>2. 固定列 + 无 scroll.x</h3>
        <p>
          未声明 <code>scroll.x</code> 时表格恒定 100% 宽（与 ant-design-vue 一致）：表格撑满容器、
          左右固定列贴住容器边缘、未声明宽度的列分享剩余空间，而不是按 max-content 收缩。
        </p>
        <VTable
          row-key="key"
          :columns="fixedColumns"
          :data-source="employees"
          bordered
          size="middle"
        >
          <template #bodyCell="{ column }">
            <template v-if="column.key === 'action'">
              <button class="prebuilt-page__action" type="button">编辑</button>
            </template>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>3. 尺寸 / 边框 / 斑马纹 / 隐藏表头</h3>
        <p>
          <code>size</code>、<code>bordered</code>、<code>striped</code>、<code>hoverable</code>、
          <code>showHeader</code> 的组合渲染。
        </p>
        <div class="prebuilt-page__controls">
          <label>
            尺寸
            <select v-model="tableSize">
              <option value="large">large</option>
              <option value="middle">middle</option>
              <option value="small">small</option>
            </select>
          </label>
          <label><input v-model="bordered" type="checkbox" />bordered</label>
          <label><input v-model="striped" type="checkbox" />striped</label>
          <label><input v-model="hoverable" type="checkbox" />hoverable</label>
          <label><input v-model="showHeader" type="checkbox" />showHeader</label>
        </div>
        <VTable
          row-key="key"
          :columns="appearanceColumns"
          :data-source="employees.slice(0, 4)"
          :size="tableSize"
          :bordered="bordered"
          :striped="striped"
          :hoverable="hoverable"
          :show-header="showHeader"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>4. 多级表头（列组）</h3>
        <p>
          列组 <code>children</code> 嵌套，组标题与叶子列分别设置 <code>align</code>，
          固定表头模式下核对分组分割线的绘制。
        </p>
        <VTable
          row-key="key"
          :columns="groupedColumns"
          :data-source="employees.slice(0, 5)"
          :scroll="{ y: 180 }"
          bordered
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>5. 排序</h3>
        <p>
          布尔 / 函数 / <code>{`{ compare, multiple }`}</code> 多列排序、
          <code>defaultSortOrder</code>、<code>sortDirections</code>、
          <code>showSorterTooltip: false</code> 与受控 <code>sortOrder</code>。 最近一次 change：{{
            lastSortInfo
          }}
        </p>
        <div class="prebuilt-page__controls">
          <span>受控列排序：</span>
          <button type="button" @click="controlledOrder = 'ascend'">升序</button>
          <button type="button" @click="controlledOrder = 'descend'">降序</button>
          <button type="button" @click="controlledOrder = null">取消</button>
        </div>
        <VTable
          row-key="key"
          :columns="sortColumns"
          :data-source="employees"
          size="small"
          @change="handleSortChange"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>6. 筛选</h3>
        <p>
          基础筛选 + <code>filterSearch</code>、<code>filterMode: 'tree'</code>、
          <code>filterMultiple: false</code> + <code>defaultFilteredValue</code> +
          <code>filterResetToDefaultFilteredValue</code>、自定义 <code>filterIcon</code> 与
          <code>customFilterDropdown</code> slot（下拉内含 Input / Checkbox / Button 核心组件）。
        </p>
        <VTable row-key="key" :columns="filterColumns" :data-source="employees" size="small">
          <template
            #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
          >
            <div class="prebuilt-page__custom-filter">
              <input
                class="prebuilt-page__custom-filter-input"
                :placeholder="`搜索 ${String(column.dataIndex)}`"
                :value="String(selectedKeys[0] ?? '')"
                @change="(event) => handleCustomFilterInput(event, setSelectedKeys)"
              />
              <div class="prebuilt-page__custom-filter-actions">
                <button type="button" @click="confirm()">搜索</button>
                <button type="button" @click="clearFilters()">重置</button>
              </div>
            </div>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>7. 行选择</h3>
        <p>
          checkbox 多选（<code>selections</code> 下拉、<code>getCheckboxProps</code> 禁用离职行、
          选择列固定左侧）与 radio 单选（<code>hideSelectAll</code>、<code>columnTitle</code>、
          <code>SELECTION_COLUMN</code> 哨兵）。最近一次选择：{{ lastSelectInfo }}
        </p>
        <VTable
          row-key="key"
          :columns="appearanceColumns"
          :data-source="employees"
          :row-selection="checkboxSelection"
          size="small"
        />
        <VTable
          row-key="key"
          :columns="radioColumns"
          :data-source="employees.slice(0, 5)"
          :row-selection="radioSelection"
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>8. 展开行</h3>
        <p>
          <code>expandedRowRender</code>、<code>expandRowByClick</code>、
          <code>rowExpandable</code>（David Lee 不可展开）、固定展开列与
          <code>expandedRowClassName</code>。
        </p>
        <VTable
          row-key="key"
          :columns="expandColumns"
          :data-source="employees"
          :expandable="expandableConfig"
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>9. 树形数据</h3>
        <p>
          <code>children</code> 嵌套 + <code>defaultExpandedRowKeys</code> +
          <code>indentSize</code>。
        </p>
        <VTable
          row-key="key"
          :columns="treeColumns"
          :data-source="treeData"
          :default-expanded-row-keys="['t1']"
          :indent-size="20"
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>10. 合并单元格</h3>
        <p>
          <code>customCell</code> 返回 <code>rowSpan</code>：同部门首行合并、其余行
          <code>rowSpan: 0</code> 隐藏。
        </p>
        <VTable
          row-key="key"
          :columns="mergeColumns"
          :data-source="mergeRows"
          bordered
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>11. 省略与 tooltip</h3>
        <p>
          <code>ellipsis: true</code>（悬停 tooltip）、
          <code>ellipsis: {`{ showTitle: false }`}</code>（仅截断）与
          <code>headerEllipsis</code>（表头单行省略）。
        </p>
        <VTable
          row-key="key"
          :columns="ellipsisColumns"
          :data-source="employees.slice(0, 3)"
          header-ellipsis
          size="small"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>12. 可调整列宽</h3>
        <p>
          <code>resizable</code> + <code>minWidth</code> / <code>maxWidth</code>，拖拽表头分割线，
          最近一次宽度：{{ resizedWidth }}
        </p>
        <VTable
          row-key="key"
          :columns="resizableColumns"
          :data-source="employees.slice(0, 4)"
          size="small"
          @resize-column="(_column, width) => (resizedWidth = `${width}px`)"
        />
      </section>

      <section class="prebuilt-page__case">
        <h3>13. 加载与空态</h3>
        <p>
          <code>loading</code> 对象形式 <code>{`{ spinning, tip }`}</code>；空数据时的
          <code>#empty</code> slot 自定义。
        </p>
        <div class="prebuilt-page__controls">
          <button type="button" @click="loadingActive = !loadingActive">
            {{ loadingActive ? '关闭 loading' : '开启 loading（tip）' }}
          </button>
        </div>
        <VTable
          row-key="key"
          :columns="loadingColumns"
          :data-source="employees.slice(0, 3)"
          :loading="{ spinning: loadingActive, tip: '拼命加载中…' }"
          size="small"
        />
        <VTable row-key="key" :columns="emptyColumns" :data-source="[]" size="small">
          <template #empty>
            <div class="prebuilt-page__empty">自定义空态：这里没有任何数据</div>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>14. 样式覆盖与行交互</h3>
        <p>
          <code>title</code> / <code>footer</code> slot、<code>ui</code> 插槽级覆盖、
          <code>rowClassName</code>、<code>column.className</code>、 <code>customHeaderCell</code> /
          <code>customCell</code> 样式、 <code>customRow</code> 点击行。最近点击：{{
            clickedRowName
          }}
        </p>
        <VTable
          row-key="key"
          :columns="styledColumns"
          :data-source="employees.slice(0, 5)"
          :row-class-name="rowClassName"
          :custom-row="customRowProps"
          :ui="{
            th: 'bg-amber-50',
            td: 'align-top',
          }"
          size="small"
        >
          <template #title> 表格标题（title slot） </template>
          <template #footer> 表格页脚（footer slot） </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>15. 固定列 + scroll.x / scroll.y + sticky</h3>
        <p>
          <code>scroll.x</code> 横向滚动 + <code>scroll.y</code> 固定表头 + 左右固定列 sticky 偏移 +
          <code>sticky</code> 吸顶。
        </p>
        <VTable
          row-key="key"
          :columns="wideColumns"
          :data-source="employees"
          :scroll="{ x: 1240, y: 240 }"
          :sticky="{ offsetHeader: 8 }"
          bordered
          size="small"
        >
          <template #bodyCell="{ column }">
            <template v-if="column.key === 'action'">
              <button class="prebuilt-page__action" type="button">详情</button>
            </template>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>16. 虚拟滚动</h3>
        <p>
          <code>virtual</code> + <code>scroll.y</code> 渲染 500 行（无 customCell），核对 prebuilt
          模式下虚拟行表的列宽与表头一致。
        </p>
        <VTable
          row-key="key"
          :columns="virtualColumns"
          :data-source="virtualRows"
          :scroll="{ y: 260 }"
          virtual
          size="small"
        />
      </section>
    </div>
  </VTableGuildConfigProvider>
</template>

<style scoped>
.prebuilt-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 8px 4px 40px;
}

.prebuilt-page__intro {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prebuilt-page__intro h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.prebuilt-page__intro p,
.prebuilt-page__case p {
  max-width: 760px;
  margin: 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--vtg-table-text-color, #4b5563);
}

.prebuilt-page__hint {
  font-weight: 500;
}

.prebuilt-page__switch {
  display: inline-flex;
  gap: 8px;
  width: fit-content;
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.prebuilt-page__switch button {
  padding: 4px 14px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
}

.prebuilt-page__switch button.is-active {
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
}

.prebuilt-page__case {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prebuilt-page__case h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.prebuilt-page__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
}

.prebuilt-page__controls button {
  padding: 2px 12px;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
  background: #f0f7ff;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.prebuilt-page__action {
  padding: 2px 10px;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
  background: transparent;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.prebuilt-page__action:hover {
  color: #0958d9;
  border-color: #1677ff;
}

.prebuilt-page__custom-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.prebuilt-page__custom-filter-input {
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.prebuilt-page__custom-filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.prebuilt-page__custom-filter-actions button {
  padding: 2px 10px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.prebuilt-page__empty {
  padding: 24px 0;
  font-size: 13px;
  color: #8c8c8c;
}

.prebuilt-page :deep(.prebuilt-page__col-mark) {
  background: #fff7e6;
}

.prebuilt-page :deep(.prebuilt-page__row-muted) td {
  color: #bfbfbf;
}

.prebuilt-page :deep(.prebuilt-page__expanded-row) td {
  background: #f0f7ff;
}
</style>
