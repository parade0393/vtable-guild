<script lang="ts" setup>
/**
 * AntdvFull — 全量 API 验证页
 *
 * 目的：逐一对齐 ant-design-vue Table 文档的全部 demo，
 * 验证 @vtable-guild/table 的 API 完整性和 TS 类型友好度。
 *
 * ── 未实现 / 刻意跳过的 antdv API ──
 * | 功能                       | antdv API                        | 状态               |
 * |---------------------------|----------------------------------|-------------------|
 * | 分页                       | pagination prop                  | 设计上跳过          |
 * | 拖拽排序                    | 第三方拖拽库集成                    | 未实现             |
 * | RTL 方向                   | direction prop                   | 未实现             |
 * | 切换页自动滚顶               | scroll.scrollToFirstRowOnChange  | 未实现             |
 * | 展开图标列索引               | expandable.expandIconColumnIndex | 未实现             |
 * | 自定义内部组件               | components prop                  | 不需要(主题系统替代)  |
 */

import { h, ref, reactive, computed } from 'vue'
import { VTable } from '@vtable-guild/table'
import { SmileOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons-vue'
import { Tag as ATag, Space as ASpace } from 'ant-design-vue'
import type {
  ColumnType,
  ColumnsType,
  ColumnGroupType,
  ColumnFilterItem,
  SortOrder,
  Key,
  RowSelection,
  SelectionItem,
  Expandable,
  TableFiltersInfo,
  VTableSorterResult,
  TableChangeExtra,
  CustomFilterDropdownSlotProps,
  Breakpoint,
  VTablePublicProps,
} from '@vtable-guild/table'

// ============================================================
// 共享数据
// ============================================================

interface BasicRecord {
  key: string
  name: string
  age: number
  address: string
  tags?: string[]
}

const data: BasicRecord[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park', tags: ['loser'] },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
]

function isColumnGroup<TRecord extends object>(
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>,
): column is ColumnGroupType<TRecord> {
  return 'children' in column
}

function getLeafColumnDataIndex<TRecord extends object>(
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>,
) {
  return isColumnGroup(column) ? undefined : column.dataIndex
}

function toTextInputValue(value: string | number | boolean | undefined) {
  return typeof value === 'boolean' ? undefined : value
}

// ============================================================
// 1. 基本用法(插槽)和bordered — 已有
// ============================================================

const columns: ColumnsType<BasicRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
  { title: 'Tags', key: 'tags', dataIndex: 'tags' },
  { title: 'Action', key: 'action' },
]

// ============================================================
// 2. customRender 列渲染
// ============================================================

const columnsCustomRender: ColumnsType<BasicRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ text }) => h('a', text as string),
  },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
  {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
    customRender: ({ text }) => {
      const tags = text as string[]
      return tags?.map((tag) =>
        h(
          ATag,
          {
            color: tag === 'loser' ? 'volcano' : tag.length > 5 ? 'geekblue' : 'green',
            key: tag,
          },
          () => tag.toUpperCase(),
        ),
      )
    },
  },
  {
    title: 'Action',
    key: 'action',
    customRender: ({ record }) =>
      h(ASpace, { size: 'middle' }, () => [h('a', `Invite ${record.name}`), h('a', 'Delete')]),
  },
]

// ============================================================
// 3. 单元格自动省略
// ============================================================

const columnsEllipsis: ColumnsType<BasicRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80 },
  { title: 'Address', dataIndex: 'address', key: 'address 1', ellipsis: true },
  {
    title: 'Long Column Long Column Long Column',
    dataIndex: 'address',
    key: 'address 2',
    ellipsis: true,
  },
  { title: 'Long Column Long Column', dataIndex: 'address', key: 'address 3', ellipsis: true },
  { title: 'Long Column', dataIndex: 'address', key: 'address 4', ellipsis: true },
]

const dataEllipsis: BasicRecord[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 2 Lake Park, London No. 2 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park, Sidney No. 1 Lake Park',
  },
]

// ============================================================
// 4. 可选择 (基本)
// ============================================================

interface SelectionRecord {
  key: string
  name: string
  age: number
  address: string
}

const selectionData: SelectionRecord[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
  { key: '4', name: 'Disabled User', age: 99, address: 'Sidney No. 1 Lake Park' },
]

const selectionColumns: ColumnsType<SelectionRecord> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
]

const rowSelection4: RowSelection<SelectionRecord> = {
  onChange: (selectedRowKeys: Key[], selectedRows: SelectionRecord[]) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
  },
  getCheckboxProps: (record: SelectionRecord) => ({
    disabled: record.name === 'Disabled User',
    name: record.name,
  }),
}

// ============================================================
// 5. 选择和操作
// ============================================================

const selectedRowKeys5 = ref<Key[]>([])
const loading5 = ref(false)

const rowSelection5 = computed<RowSelection<SelectionRecord>>(() => ({
  selectedRowKeys: selectedRowKeys5.value,
  onChange: (keys: Key[]) => {
    selectedRowKeys5.value = keys
  },
}))

const hasSelected5 = computed(() => selectedRowKeys5.value.length > 0)

function start5() {
  loading5.value = true
  setTimeout(() => {
    selectedRowKeys5.value = []
    loading5.value = false
  }, 1000)
}

// ============================================================
// 6. 自定义选择项
// ============================================================

const selectedRowKeys6 = ref<Key[]>([])

const customSelections: SelectionItem[] = [
  {
    key: 'odd',
    text: 'Select Odd Row',
    onSelect: (changeableRowKeys: Key[]) => {
      selectedRowKeys6.value = changeableRowKeys.filter((_, index) => index % 2 === 0)
    },
  },
  {
    key: 'even',
    text: 'Select Even Row',
    onSelect: (changeableRowKeys: Key[]) => {
      selectedRowKeys6.value = changeableRowKeys.filter((_, index) => index % 2 !== 0)
    },
  },
]

const rowSelection6 = computed<RowSelection<SelectionRecord>>(() => ({
  selectedRowKeys: selectedRowKeys6.value,
  onChange: (keys: Key[]) => {
    selectedRowKeys6.value = keys
  },
  selections: customSelections,
}))

// ============================================================
// 7. 排序
// ============================================================

interface SortRecord {
  key: string
  name: string
  age: number
  address: string
}

const sortData: SortRecord[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
  { key: '4', name: 'Jim Red', age: 32, address: 'London No. 2 Lake Park' },
]

const sortColumns: ColumnsType<SortRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: (a: SortRecord, b: SortRecord) => a.name.length - b.name.length,
    sortDirections: ['descend'],
  },
  {
    title: 'Age',
    dataIndex: 'age',
    defaultSortOrder: 'descend',
    sorter: (a: SortRecord, b: SortRecord) => a.age - b.age,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    sorter: (a: SortRecord, b: SortRecord) => a.address.length - b.address.length,
    sortDirections: ['descend', 'ascend'],
  },
]

function onSortChange(
  _filters: TableFiltersInfo,
  sorter: VTableSorterResult<SortRecord>,
  _extra: TableChangeExtra<SortRecord>,
) {
  console.log('sort params', sorter)
}

// ============================================================
// 8. 多列排序
// ============================================================

const multiSortColumns: ColumnsType<SortRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    sorter: { compare: (a: SortRecord, b: SortRecord) => a.age - b.age, multiple: 2 },
  },
  {
    title: 'Address',
    dataIndex: 'address',
    sorter: {
      compare: (a: SortRecord, b: SortRecord) => a.address.length - b.address.length,
      multiple: 1,
    },
  },
]

// ============================================================
// 9. 筛选和排序
// ============================================================

interface FilterRecord {
  key: string
  name: string
  age: number
  address: string
}

const filterData: FilterRecord[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
  { key: '4', name: 'Jim Red', age: 32, address: 'London No. 2 Lake Park' },
]

const filterColumns: ColumnsType<FilterRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    filters: [
      { text: 'Joe', value: 'Joe' },
      { text: 'Jim', value: 'Jim' },
    ],
    onFilter: (value, record) => record.name.indexOf(value as string) === 0,
    sorter: (a, b) => a.name.length - b.name.length,
    sortDirections: ['descend'],
  },
  {
    title: 'Age',
    dataIndex: 'age',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.age - b.age,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    filters: [
      { text: 'London', value: 'London' },
      { text: 'New York', value: 'New York' },
    ],
    onFilter: (value, record) => record.address.indexOf(value as string) === 0,
    sortDirections: ['descend', 'ascend'],
    sorter: (a, b) => a.address.length - b.address.length,
  },
]

function onFilterChange(
  filters: TableFiltersInfo,
  sorter: VTableSorterResult<FilterRecord>,
  extra: TableChangeExtra<FilterRecord>,
) {
  console.log('params', filters, sorter, extra)
}

// ============================================================
// 10. 自定义筛选面板
// ============================================================

const searchText10 = ref('')
const searchedColumn10 = ref('')

const filterCustomColumns: ColumnsType<FilterRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    customFilterDropdown: true,
    onFilter: (value, record) =>
      record.name
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    customFilterDropdown: true,
    onFilter: (value, record) =>
      record.address
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
  },
]

function handleSearch(
  selectedKeys: (string | number | boolean)[],
  confirm: CustomFilterDropdownSlotProps<FilterRecord>['confirm'],
  dataIndex: string,
) {
  confirm()
  searchText10.value = String(selectedKeys[0])
  searchedColumn10.value = dataIndex
}

function handleReset(clearFilters: CustomFilterDropdownSlotProps<FilterRecord>['clearFilters']) {
  clearFilters()
  searchText10.value = ''
}

// ============================================================
// 11. 重置筛选和排序 (受控)
// ============================================================

const filteredInfo11 = ref<TableFiltersInfo>({})
const sortedInfo11 = ref<VTableSorterResult<FilterRecord>>({
  columnKey: undefined,
  column: undefined,
  order: null,
  field: undefined,
})

const controlledColumns = computed<ColumnsType<FilterRecord>>(() => {
  const sorted = sortedInfo11.value
  const filtered = filteredInfo11.value
  const singleSorted = Array.isArray(sorted) ? sorted[0] : sorted
  return [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filters: [
        { text: 'Joe', value: 'Joe' },
        { text: 'Jim', value: 'Jim' },
      ],
      filteredValue: filtered.name || null,
      onFilter: (value: string | number | boolean, record: FilterRecord) =>
        record.name.includes(value as string),
      sorter: (a: FilterRecord, b: FilterRecord) => a.name.length - b.name.length,
      sortOrder: singleSorted?.columnKey === 'name' ? singleSorted.order : null,
      ellipsis: true,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      sorter: (a: FilterRecord, b: FilterRecord) => a.age - b.age,
      sortOrder: singleSorted?.columnKey === 'age' ? singleSorted.order : null,
      ellipsis: true,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      filters: [
        { text: 'London', value: 'London' },
        { text: 'New York', value: 'New York' },
      ],
      filteredValue: filtered.address || null,
      onFilter: (value: string | number | boolean, record: FilterRecord) =>
        record.address.includes(value as string),
      sorter: (a: FilterRecord, b: FilterRecord) => a.address.length - b.address.length,
      sortOrder: singleSorted?.columnKey === 'address' ? singleSorted.order : null,
      ellipsis: true,
    },
  ]
})

function handleControlledChange(
  filters: TableFiltersInfo,
  sorter: VTableSorterResult<FilterRecord>,
) {
  filteredInfo11.value = filters
  sortedInfo11.value = sorter
}

function clearFilters11() {
  filteredInfo11.value = {}
}

function clearAll11() {
  filteredInfo11.value = {}
  sortedInfo11.value = { columnKey: undefined, column: undefined, order: null, field: undefined }
}

function setAgeSort11() {
  sortedInfo11.value = {
    column: undefined,
    columnKey: 'age',
    order: 'descend',
    field: 'age',
  }
}

// ============================================================
// 12. 筛选搜索
// ============================================================

const filterSearchColumns: ColumnsType<FilterRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    filters: [
      { text: 'Joe', value: 'Joe' },
      { text: 'Jim', value: 'Jim' },
      { text: 'John', value: 'John' },
    ],
    onFilter: (value, record) => record.name.indexOf(value as string) === 0,
    filterSearch: true,
  },
  { title: 'Age', dataIndex: 'age' },
  {
    title: 'Address',
    dataIndex: 'address',
    filters: [
      { text: 'London', value: 'London' },
      { text: 'New York', value: 'New York' },
      { text: 'Sidney', value: 'Sidney' },
    ],
    onFilter: (value, record) => record.address.indexOf(value as string) === 0,
    filterSearch: (input: string, filter: ColumnFilterItem) =>
      (filter.text as string).toLowerCase().includes(input.toLowerCase()),
  },
]

// ============================================================
// 13. 树形筛选
// ============================================================

const filterTreeColumns: ColumnsType<FilterRecord> = [
  {
    title: 'Name',
    dataIndex: 'name',
    filters: [
      {
        text: 'Joe',
        value: 'Joe',
        children: [{ text: 'Joe Black', value: 'Joe Black' }],
      },
      {
        text: 'Jim',
        value: 'Jim',
        children: [
          { text: 'Jim Green', value: 'Jim Green' },
          { text: 'Jim Red', value: 'Jim Red' },
        ],
      },
    ],
    filterMode: 'tree',
    onFilter: (value, record) => record.name.indexOf(value as string) === 0,
  },
  { title: 'Age', dataIndex: 'age' },
  {
    title: 'Address',
    dataIndex: 'address',
    filters: [
      { text: 'London', value: 'London' },
      { text: 'New York', value: 'New York' },
    ],
    filterMode: 'tree',
    filterSearch: true,
    onFilter: (value, record) => record.address.startsWith(value as string),
  },
]

// ============================================================
// 14. 表头和表尾
// ============================================================

const headFooterColumns: ColumnsType<BasicRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

// ============================================================
// 15. 固定表头
// ============================================================

interface FixedRecord {
  key: string
  name: string
  age: number
  address: string
}

const fixedHeaderColumns: ColumnsType<FixedRecord> = [
  { title: 'Name', dataIndex: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', width: 100 },
  { title: 'Address', dataIndex: 'address' },
]

const fixedHeaderData: FixedRecord[] = Array.from({ length: 100 }, (_, i) => ({
  key: String(i),
  name: `Edward King ${i}`,
  age: 32,
  address: `London, Park Lane no. ${i}`,
}))

// ============================================================
// 16. 固定列
// ============================================================

interface FixedColRecord {
  key: string
  name: string
  age: number
  address: string
}

const fixedColColumns: ColumnsType<FixedColRecord> = [
  { title: 'Full Name', width: 100, dataIndex: 'name', key: 'name', fixed: 'left' },
  { title: 'Age', width: 100, dataIndex: 'age', key: 'age', fixed: 'left' },
  { title: 'Column 1', dataIndex: 'address', key: '1', width: 150 },
  { title: 'Column 2', dataIndex: 'address', key: '2', width: 150 },
  { title: 'Column 3', dataIndex: 'address', key: '3', width: 150 },
  { title: 'Column 4', dataIndex: 'address', key: '4', width: 150 },
  { title: 'Column 5', dataIndex: 'address', key: '5', width: 150 },
  { title: 'Column 6', dataIndex: 'address', key: '6', width: 150 },
  { title: 'Column 7', dataIndex: 'address', key: '7', width: 150 },
  { title: 'Column 8', dataIndex: 'address', key: '8' },
  {
    title: 'Action',
    key: 'operation',
    fixed: 'right',
    width: 100,
    customRender: () => h('a', 'action'),
  },
]

const fixedColData: FixedColRecord[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York Park' },
  { key: '2', name: 'Jim Green', age: 40, address: 'London Park' },
]

// ============================================================
// 17. 固定头和列
// ============================================================

const fixedBothColumns: ColumnsType<FixedColRecord> = [
  { title: 'Full Name', width: 100, dataIndex: 'name', key: 'name', fixed: 'left' },
  { title: 'Age', width: 100, dataIndex: 'age', key: 'age', fixed: 'left' },
  { title: 'Column 1', dataIndex: 'address', key: '1', width: 150 },
  { title: 'Column 2', dataIndex: 'address', key: '2', width: 150 },
  { title: 'Column 3', dataIndex: 'address', key: '3', width: 150 },
  { title: 'Column 4', dataIndex: 'address', key: '4', width: 150 },
  { title: 'Column 5', dataIndex: 'address', key: '5', width: 150 },
  { title: 'Column 6', dataIndex: 'address', key: '6', width: 150 },
  { title: 'Column 7', dataIndex: 'address', key: '7', width: 150 },
  { title: 'Column 8', dataIndex: 'address', key: '8' },
  {
    title: 'Action',
    key: 'operation',
    fixed: 'right',
    width: 100,
    customRender: () => h('a', 'action'),
  },
]

const fixedBothData: FixedColRecord[] = Array.from({ length: 100 }, (_, i) => ({
  key: String(i),
  name: `Edward ${i}`,
  age: 32,
  address: `London Park no. ${i}`,
}))

// ============================================================
// 18. 表头分组
// ============================================================

interface GroupRecord {
  key: string
  firstName: string
  lastName: string
  age: number
  street: string
  building: string
  number: number
  companyAddress: string
  companyName: string
  gender: string
}

const groupColumns: ColumnsType<GroupRecord> = [
  {
    title: 'Name',
    children: [
      { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 120 },
      { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 120 },
    ],
  } as ColumnGroupType<GroupRecord>,
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 80,
    sorter: (a: GroupRecord, b: GroupRecord) => a.age - b.age,
  },
  {
    title: 'Address',
    children: [
      {
        title: 'Street',
        dataIndex: 'street',
        key: 'street',
        width: 150,
      },
      {
        title: 'Block',
        children: [
          { title: 'Building', dataIndex: 'building', key: 'building', width: 100 },
          { title: 'Door No.', dataIndex: 'number', key: 'number', width: 100 },
        ],
      } as ColumnGroupType<GroupRecord>,
    ],
  } as ColumnGroupType<GroupRecord>,
  {
    title: 'Company',
    children: [
      {
        title: 'Company Address',
        dataIndex: 'companyAddress',
        key: 'companyAddress',
        width: 200,
      },
      { title: 'Company Name', dataIndex: 'companyName', key: 'companyName' },
    ],
  } as ColumnGroupType<GroupRecord>,
  { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 80 },
]

const groupData: GroupRecord[] = Array.from({ length: 5 }, (_, i) => ({
  key: String(i),
  firstName: 'John',
  lastName: 'Brown',
  age: i + 20,
  street: 'Lake Park',
  building: 'C',
  number: 2035 + i,
  companyAddress: 'Lake Street 42',
  companyName: 'SoftLake Co',
  gender: 'M',
}))

// ============================================================
// 19. 表格行/列合并 — 已有
// ============================================================

interface MergeRecord {
  key: string
  name: string
  age: number
  tel: string
  phone: number
  address: string
}

const sharedOnCell = (_: MergeRecord, index?: number) => {
  if (index === 4) return { colSpan: 0 }
}

const mergeData: MergeRecord[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    tel: '0571-22098909',
    phone: 18889898989,
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    tel: '0571-22098333',
    phone: 18889898888,
    age: 42,
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Sidney No. 1 Lake Park',
  },
  {
    key: '4',
    name: 'Jim Red',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'London No. 2 Lake Park',
  },
  {
    key: '5',
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
  },
]

const mergeColumns: ColumnType<MergeRecord>[] = [
  {
    title: 'Name',
    dataIndex: 'name',
    customCell: (_: MergeRecord, index?: number) => ({
      colSpan: (index ?? 0) < 4 ? 1 : 5,
    }),
  },
  { title: 'Age', dataIndex: 'age', customCell: sharedOnCell },
  {
    title: 'Home phone',
    colSpan: 2,
    dataIndex: 'tel',
    customCell: (_: MergeRecord, index?: number) => {
      if (index === 2) return { rowSpan: 2 }
      if (index === 3) return { rowSpan: 0 }
      if (index === 4) return { colSpan: 0 }
    },
  },
  { title: 'Phone', colSpan: 0, dataIndex: 'phone', customCell: sharedOnCell },
  { title: 'Address', dataIndex: 'address', customCell: sharedOnCell },
]

// ============================================================
// 20. 可展开
// ============================================================

interface ExpandRecord {
  key: number
  name: string
  age: number
  address: string
  description: string
}

const expandData: ExpandRecord[] = Array.from({ length: 3 }, (_, i) => ({
  key: i,
  name: `Edward King ${i}`,
  age: 32,
  address: `London, Park Lane no. ${i}`,
  description: `My name is Edward King ${i}, I am 32 years old, living in London, Park Lane no. ${i}.`,
}))

const expandColumns: ColumnsType<ExpandRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
  {
    title: 'Action',
    key: 'action',
    customRender: ({ record }) => h('a', `Delete ${record.name}`),
  },
]

const expandable20: Expandable<ExpandRecord> = {
  expandedRowRender: (record: ExpandRecord) => h('p', { style: { margin: 0 } }, record.description),
  rowExpandable: (record: ExpandRecord) => record.name !== 'Not Expandable',
}

// ============================================================
// 21. 树形数据
// ============================================================

interface TreeRecord {
  key: string
  name: string
  age: number
  address: string
  children?: TreeRecord[]
}

const treeData: TreeRecord[] = [
  {
    key: '1',
    name: 'John Brown sr.',
    age: 60,
    address: 'New York No. 1 Lake Park',
    children: [
      {
        key: '1-1',
        name: 'John Brown',
        age: 42,
        address: 'New York No. 2 Lake Park',
        children: [
          { key: '1-1-1', name: 'John Brown jr.', age: 30, address: 'New York No. 3 Lake Park' },
          { key: '1-1-2', name: 'Jimmy Brown', age: 18, address: 'New York No. 3 Lake Park' },
        ],
      },
    ],
  },
  {
    key: '2',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    children: [
      {
        key: '2-1',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
        children: [
          { key: '2-1-1', name: 'Jim Green jr.', age: 25, address: 'London No. 2 Lake Park' },
          { key: '2-1-2', name: 'Jimmy Green sr.', age: 18, address: 'London No. 3 Lake Park' },
        ],
      },
    ],
  },
]

const treeColumns: ColumnsType<TreeRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

const treeRowSelection = ref<RowSelection<TreeRecord>>({
  checkStrictly: false,
  onChange: (keys: Key[], rows: TreeRecord[]) => {
    console.log('tree selection', keys, rows)
  },
})

// ============================================================
// 22. 嵌套子表格
// ============================================================

interface NestedParent {
  key: number
  name: string
  platform: string
  version: string
  upgradeNum: number
  creator: string
  createdAt: string
}

interface NestedChild {
  key: number
  date: string
  name: string
  upgradeNum: string
}

const nestedOuterColumns: ColumnsType<NestedParent> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Platform', dataIndex: 'platform', key: 'platform' },
  { title: 'Version', dataIndex: 'version', key: 'version' },
  { title: 'Upgraded', dataIndex: 'upgradeNum', key: 'upgradeNum' },
  { title: 'Creator', dataIndex: 'creator', key: 'creator' },
  { title: 'Date', dataIndex: 'createdAt', key: 'createdAt' },
  { title: 'Action', key: 'operation', customRender: () => h('a', 'Publish') },
]

const nestedInnerColumns: ColumnsType<NestedChild> = [
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Upgrade Status', dataIndex: 'upgradeNum', key: 'upgradeNum' },
]

const nestedOuterData: NestedParent[] = Array.from({ length: 3 }, (_, i) => ({
  key: i,
  name: 'Screen',
  platform: 'iOS',
  version: '10.3.4.5654',
  upgradeNum: 500,
  creator: 'Jack',
  createdAt: '2014-12-24 23:12:00',
}))

const nestedInnerData: NestedChild[] = [
  {
    key: 0,
    date: '2014-12-24 23:12:00',
    name: 'This is production name',
    upgradeNum: 'Upgraded: 56',
  },
]

const NestedChildTable = VTable as unknown as new () => { $props: VTablePublicProps<NestedChild> }

const nestedExpandable: Expandable<NestedParent> = {
  expandedRowRender: () =>
    h(NestedChildTable, {
      columns: nestedInnerColumns,
      dataSource: nestedInnerData,
      bordered: true,
    }),
}

// ============================================================
// 23. 紧凑型 / 大小
// ============================================================

const sizeRef = ref<'sm' | 'md' | 'lg'>('lg')

const sizeColumns: ColumnsType<BasicRecord> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
]

const sizeData: BasicRecord[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
]

// ============================================================
// 24. 斑马纹
// ============================================================

// reuses sizeColumns / sizeData

// ============================================================
// 25. 粘性表头 (Sticky)
// ============================================================

const stickyColumns: ColumnsType<FixedRecord> = [
  { title: 'Name', dataIndex: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', width: 100 },
  { title: 'Address', dataIndex: 'address' },
]

const stickyData: FixedRecord[] = Array.from({ length: 20 }, (_, i) => ({
  key: String(i),
  name: `Edward King ${i}`,
  age: 32 + i,
  address: `London, Park Lane no. ${i}`,
}))

// ============================================================
// 26. 可伸缩列
// ============================================================

interface ResizeRecord {
  key: string
  date: string
  amount: number
  type: string
  note: string
}

interface ResizeLeafColumn {
  title: string
  dataIndex: 'date' | 'amount' | 'type' | 'note'
  width?: number
  resizable?: boolean
  minWidth?: number
}

function isResizeColumnDataIndex(
  dataIndex: ColumnType<ResizeRecord>['dataIndex'],
): dataIndex is ResizeLeafColumn['dataIndex'] {
  return (
    dataIndex === 'date' || dataIndex === 'amount' || dataIndex === 'type' || dataIndex === 'note'
  )
}

const resizeData: ResizeRecord[] = [
  { key: '0', date: '2018-02-11', amount: 120, type: 'income', note: 'transfer' },
  { key: '1', date: '2018-03-11', amount: 243, type: 'income', note: 'transfer' },
  { key: '2', date: '2018-04-11', amount: 98, type: 'income', note: 'transfer' },
]

const resizeColumns = ref<ResizeLeafColumn[]>([
  { title: 'Date', dataIndex: 'date', width: 200, resizable: true, minWidth: 100 },
  { title: 'Amount', dataIndex: 'amount', width: 100, resizable: true },
  { title: 'Type', dataIndex: 'type', width: 100, resizable: true },
  { title: 'Note', dataIndex: 'note' },
])

function onResizeColumn(col: ColumnType<ResizeRecord>, width: number) {
  if (!isResizeColumnDataIndex(col.dataIndex)) {
    return
  }

  const index = resizeColumns.value.findIndex(
    (currentColumn) => currentColumn.dataIndex === col.dataIndex,
  )
  if (index !== -1) {
    const currentColumn = resizeColumns.value[index]
    if (currentColumn) {
      resizeColumns.value[index] = { ...currentColumn, width }
    }
  }
}

// ============================================================
// 27. 概要栏 (Summary)
// ============================================================

interface SummaryRecord {
  key: string
  name: string
  borrow: number
  repayment: number
}

const summaryColumns: ColumnsType<SummaryRecord> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Borrow', dataIndex: 'borrow' },
  { title: 'Repayment', dataIndex: 'repayment' },
]

const summaryData: SummaryRecord[] = [
  { key: '1', name: 'John Brown', borrow: 10, repayment: 33 },
  { key: '2', name: 'Jim Green', borrow: 100, repayment: 0 },
  { key: '3', name: 'Joe Black', borrow: 10, repayment: 10 },
  { key: '4', name: 'Jim Red', borrow: 75, repayment: 45 },
]

const totalBorrow = computed(() => summaryData.reduce((sum, r) => sum + r.borrow, 0))
const totalRepayment = computed(() => summaryData.reduce((sum, r) => sum + r.repayment, 0))

// ============================================================
// 28. 响应式
// ============================================================

const responsiveColumns: ColumnsType<BasicRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', responsive: ['lg' as Breakpoint] },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

// ============================================================
// 29. 加载中
// ============================================================

const loading29 = ref(true)

// ============================================================
// 30. 可编辑单元格
// ============================================================

interface EditableCellRecord {
  key: string
  name: string
  age: number
  address: string
  [key: string]: unknown
}

const editCellData = ref<EditableCellRecord[]>([
  { key: '0', name: 'Edward King 0', age: 32, address: 'London, Park Lane no. 0' },
  { key: '1', name: 'Edward King 1', age: 32, address: 'London, Park Lane no. 1' },
])

const editCellCount = ref(2)

const editCellColumns: ColumnsType<EditableCellRecord> = [
  { title: 'Name', dataIndex: 'name', width: '25%' },
  { title: 'Age', dataIndex: 'age', width: '15%' },
  { title: 'Address', dataIndex: 'address', width: '40%' },
  { title: 'Operation', key: 'operation' },
]

const editCellState = reactive<Record<string, Record<string, boolean>>>({})

function isEditingCell(key: string, dataIndex: string) {
  return editCellState[key]?.[dataIndex] ?? false
}

function startEditCell(key: string, dataIndex: string) {
  if (!editCellState[key]) editCellState[key] = {}
  editCellState[key][dataIndex] = true
}

function saveEditCell(key: string, dataIndex: string, value: string) {
  const row = editCellData.value.find((r) => r.key === key)
  if (row) {
    ;(row as Record<string, unknown>)[dataIndex] = value
  }
  if (editCellState[key]) editCellState[key][dataIndex] = false
}

function handleAddRow() {
  const newKey = String(editCellCount.value++)
  editCellData.value.push({
    key: newKey,
    name: `Edward King ${newKey}`,
    age: 32,
    address: `London, Park Lane no. ${newKey}`,
  })
}

function handleDeleteRow(key: string) {
  editCellData.value = editCellData.value.filter((item) => item.key !== key)
}

// ============================================================
// 31. 可编辑行
// ============================================================

interface EditableRowRecord {
  key: string
  name: string
  age: number
  address: string
}

const editRowData = ref<EditableRowRecord[]>([
  { key: '0', name: 'Edward King 0', age: 32, address: 'London, Park Lane no. 0' },
  { key: '1', name: 'Edward King 1', age: 32, address: 'London, Park Lane no. 1' },
  { key: '2', name: 'Edward King 2', age: 32, address: 'London, Park Lane no. 2' },
])

const editRowColumns: ColumnsType<EditableRowRecord> = [
  { title: 'Name', dataIndex: 'name', width: '25%' },
  { title: 'Age', dataIndex: 'age', width: '15%' },
  { title: 'Address', dataIndex: 'address', width: '40%' },
  { title: 'Operation', key: 'operation' },
]

const editingRowKey = ref<string>('')
const editingRowCache = ref<EditableRowRecord | null>(null)

function editRow(record: EditableRowRecord) {
  editingRowKey.value = record.key
  editingRowCache.value = { ...record }
}

function saveRow(key: string) {
  const idx = editRowData.value.findIndex((r) => r.key === key)
  if (idx !== -1 && editingRowCache.value) {
    editRowData.value[idx] = { ...editingRowCache.value }
  }
  editingRowKey.value = ''
  editingRowCache.value = null
}

function cancelRow() {
  editingRowKey.value = ''
  editingRowCache.value = null
}
</script>

<template>
  <div>
    <!-- ================= 1. 基本用法(插槽)和bordered ================= -->
    <section class="play-case">
      <header class="play-case__header">1. 基本用法(插槽)和bordered</header>
      <div class="play-panel">
        <VTable :columns="columns" :data-source="data" bordered>
          <template #headerCell="{ column }">
            <template v-if="column.key === 'name'">
              <span>
                <smile-outlined />
                Name
              </span>
            </template>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a>{{ record.name }}</a>
            </template>
            <template v-else-if="column.key === 'tags'">
              <span>
                <a-tag
                  v-for="tag in record.tags"
                  :key="tag"
                  :color="tag === 'loser' ? 'volcano' : tag.length > 5 ? 'geekblue' : 'green'"
                >
                  {{ tag.toUpperCase() }}
                </a-tag>
              </span>
            </template>
          </template>
        </VTable>
      </div>
    </section>

    <!-- ================= 2. customRender 列渲染 ================= -->
    <section class="play-case">
      <header class="play-case__header">2. customRender 列渲染（JSX风格）</header>
      <div class="play-panel">
        <VTable :columns="columnsCustomRender" :data-source="data" />
      </div>
    </section>

    <!-- ================= 3. 单元格自动省略 ================= -->
    <section class="play-case">
      <header class="play-case__header">3. 单元格自动省略</header>
      <div class="play-panel">
        <VTable :columns="columnsEllipsis" :data-source="dataEllipsis" />
      </div>
    </section>

    <!-- ================= 4. 可选择 ================= -->
    <section class="play-case">
      <header class="play-case__header">4. 可选择</header>
      <div class="play-panel">
        <VTable
          :columns="selectionColumns"
          :data-source="selectionData"
          :row-selection="rowSelection4"
        />
      </div>
    </section>

    <!-- ================= 5. 选择和操作 ================= -->
    <section class="play-case">
      <header class="play-case__header">5. 选择和操作</header>
      <div class="play-panel">
        <div style="margin-bottom: 16px">
          <a-button type="primary" :disabled="!hasSelected5" :loading="loading5" @click="start5">
            Reload
          </a-button>
          <span style="margin-left: 8px">
            <template v-if="hasSelected5"> Selected {{ selectedRowKeys5.length }} items </template>
          </span>
        </div>
        <VTable
          :columns="selectionColumns"
          :data-source="selectionData"
          :row-selection="rowSelection5"
        />
      </div>
    </section>

    <!-- ================= 6. 自定义选择项 ================= -->
    <section class="play-case">
      <header class="play-case__header">6. 自定义选择项</header>
      <div class="play-panel">
        <VTable
          :columns="selectionColumns"
          :data-source="selectionData"
          :row-selection="rowSelection6"
        />
      </div>
    </section>

    <!-- ================= 7. 排序 ================= -->
    <section class="play-case">
      <header class="play-case__header">7. 排序</header>
      <div class="play-panel">
        <VTable :columns="sortColumns" :data-source="sortData" @change="onSortChange" />
      </div>
    </section>

    <!-- ================= 8. 多列排序 ================= -->
    <section class="play-case">
      <header class="play-case__header">8. 多列排序</header>
      <div class="play-panel">
        <VTable :columns="multiSortColumns" :data-source="sortData" />
      </div>
    </section>

    <!-- ================= 9. 筛选和排序 ================= -->
    <section class="play-case">
      <header class="play-case__header">9. 筛选和排序</header>
      <div class="play-panel">
        <VTable :columns="filterColumns" :data-source="filterData" @change="onFilterChange" />
      </div>
    </section>

    <!-- ================= 10. 自定义筛选面板 ================= -->
    <section class="play-case">
      <header class="play-case__header">10. 自定义筛选面板</header>
      <div class="play-panel">
        <VTable :columns="filterCustomColumns" :data-source="filterData">
          <template
            #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
          >
            <div style="padding: 8px">
              <a-input
                :placeholder="`Search ${String(getLeafColumnDataIndex(column) ?? '')}`"
                :value="toTextInputValue(selectedKeys[0])"
                style="width: 188px; margin-bottom: 8px; display: block"
                @change="(e: Event) => setSelectedKeys([(e.target as HTMLInputElement).value])"
                @press-enter="
                  handleSearch(selectedKeys, confirm, String(getLeafColumnDataIndex(column) ?? ''))
                "
              />
              <a-button
                type="primary"
                size="small"
                style="width: 90px; margin-right: 8px"
                @click="
                  handleSearch(selectedKeys, confirm, String(getLeafColumnDataIndex(column) ?? ''))
                "
              >
                <template #icon><search-outlined /></template>
                Search
              </a-button>
              <a-button size="small" style="width: 90px" @click="handleReset(clearFilters)">
                Reset
              </a-button>
            </div>
          </template>
          <template #customFilterIcon="{ filtered }">
            <search-outlined :style="{ color: filtered ? '#1677ff' : undefined }" />
          </template>
          <template #bodyCell="{ text, column }">
            <template v-if="searchedColumn10 === column.dataIndex">
              <span>{{ text }}</span>
            </template>
          </template>
        </VTable>
      </div>
    </section>

    <!-- ================= 11. 重置筛选和排序 ================= -->
    <section class="play-case">
      <header class="play-case__header">11. 重置筛选和排序（受控）</header>
      <div class="play-panel">
        <a-space style="margin-bottom: 16px">
          <a-button @click="setAgeSort11">Sort age</a-button>
          <a-button @click="clearFilters11">Clear filters</a-button>
          <a-button @click="clearAll11">Clear filters and sorters</a-button>
        </a-space>
        <VTable
          :columns="controlledColumns"
          :data-source="filterData"
          @change="handleControlledChange"
        />
      </div>
    </section>

    <!-- ================= 12. 筛选搜索 ================= -->
    <section class="play-case">
      <header class="play-case__header">12. 筛选搜索</header>
      <div class="play-panel">
        <VTable :columns="filterSearchColumns" :data-source="filterData" />
      </div>
    </section>

    <!-- ================= 13. 树形筛选 ================= -->
    <section class="play-case">
      <header class="play-case__header">13. 树形筛选</header>
      <div class="play-panel">
        <VTable :columns="filterTreeColumns" :data-source="filterData" />
      </div>
    </section>

    <!-- ================= 14. 表头和表尾 ================= -->
    <section class="play-case">
      <header class="play-case__header">14. 表头和表尾</header>
      <div class="play-panel">
        <VTable :columns="headFooterColumns" :data-source="data" bordered>
          <template #title>Header</template>
          <template #footer>Footer</template>
        </VTable>
      </div>
    </section>

    <!-- ================= 15. 固定表头 ================= -->
    <section class="play-case">
      <header class="play-case__header">15. 固定表头</header>
      <div class="play-panel">
        <VTable :columns="fixedHeaderColumns" :data-source="fixedHeaderData" :scroll="{ y: 240 }" />
      </div>
    </section>

    <!-- ================= 16. 固定列 ================= -->
    <section class="play-case">
      <header class="play-case__header">16. 固定列</header>
      <div class="play-panel">
        <VTable :columns="fixedColColumns" :data-source="fixedColData" :scroll="{ x: 1500 }" />
      </div>
    </section>

    <!-- ================= 17. 固定头和列 ================= -->
    <section class="play-case">
      <header class="play-case__header">17. 固定头和列</header>
      <div class="play-panel">
        <VTable
          :columns="fixedBothColumns"
          :data-source="fixedBothData"
          :scroll="{ x: 1500, y: 300 }"
        />
      </div>
    </section>

    <!-- ================= 18. 表头分组 ================= -->
    <section class="play-case">
      <header class="play-case__header">18. 表头分组</header>
      <div class="play-panel">
        <VTable :columns="groupColumns" :data-source="groupData" bordered />
      </div>
    </section>

    <!-- ================= 19. 表格行/列合并 ================= -->
    <section class="play-case">
      <header class="play-case__header">19. 表格行/列合并</header>
      <div class="play-panel">
        <VTable :columns="mergeColumns" bordered :data-source="mergeData" />
      </div>
    </section>

    <!-- ================= 20. 可展开 ================= -->
    <section class="play-case">
      <header class="play-case__header">20. 可展开</header>
      <div class="play-panel">
        <VTable :columns="expandColumns" :data-source="expandData" :expandable="expandable20" />
      </div>
    </section>

    <!-- ================= 21. 树形数据 ================= -->
    <section class="play-case">
      <header class="play-case__header">21. 树形数据展示</header>
      <div class="play-panel">
        <VTable
          :columns="treeColumns"
          :data-source="treeData"
          :row-selection="treeRowSelection"
          :default-expand-all-rows="true"
        />
      </div>
    </section>

    <!-- ================= 22. 嵌套子表格 ================= -->
    <section class="play-case">
      <header class="play-case__header">22. 嵌套子表格</header>
      <div class="play-panel">
        <VTable
          :columns="nestedOuterColumns"
          :data-source="nestedOuterData"
          :expandable="nestedExpandable"
        />
      </div>
    </section>

    <!-- ================= 23. 紧凑型 / 大小 ================= -->
    <section class="play-case">
      <header class="play-case__header">23. 紧凑型 / 大小</header>
      <div class="play-panel">
        <a-radio-group v-model:value="sizeRef" style="margin-bottom: 16px">
          <a-radio value="lg">Large</a-radio>
          <a-radio value="md">Middle</a-radio>
          <a-radio value="sm">Small</a-radio>
        </a-radio-group>
        <VTable :columns="sizeColumns" :data-source="sizeData" :size="sizeRef" bordered>
          <template #title>Header</template>
          <template #footer>Footer</template>
        </VTable>
      </div>
    </section>

    <!-- ================= 24. 斑马纹 ================= -->
    <section class="play-case">
      <header class="play-case__header">24. 斑马纹</header>
      <div class="play-panel">
        <VTable :columns="sizeColumns" :data-source="sizeData" striped />
      </div>
    </section>

    <!-- ================= 25. 粘性表头 ================= -->
    <section class="play-case">
      <header class="play-case__header">25. Sticky 粘性表头</header>
      <div class="play-panel">
        <VTable :columns="stickyColumns" :data-source="stickyData" sticky />
      </div>
    </section>

    <!-- ================= 26. 可伸缩列 ================= -->
    <section class="play-case">
      <header class="play-case__header">26. 可伸缩列</header>
      <div class="play-panel">
        <VTable
          :columns="resizeColumns"
          :data-source="resizeData"
          bordered
          @resize-column="onResizeColumn"
        />
      </div>
    </section>

    <!-- ================= 27. 概要栏 ================= -->
    <section class="play-case">
      <header class="play-case__header">27. 概要栏 (Summary)</header>
      <div class="play-panel">
        <VTable :columns="summaryColumns" :data-source="summaryData" bordered>
          <template #summary>
            <tr>
              <td>Total</td>
              <td>
                <span style="color: red">{{ totalBorrow }}</span>
              </td>
              <td>
                <span>{{ totalRepayment }}</span>
              </td>
            </tr>
          </template>
        </VTable>
      </div>
    </section>

    <!-- ================= 28. 响应式 ================= -->
    <section class="play-case">
      <header class="play-case__header">28. 响应式（缩小窗口查看 Age 列隐藏）</header>
      <div class="play-panel">
        <VTable :columns="responsiveColumns" :data-source="data" />
      </div>
    </section>

    <!-- ================= 29. 加载中 ================= -->
    <section class="play-case">
      <header class="play-case__header">29. 加载中</header>
      <div class="play-panel">
        <a-space style="margin-bottom: 16px">
          <a-button @click="loading29 = !loading29"> Toggle loading: {{ loading29 }} </a-button>
        </a-space>
        <VTable :columns="sizeColumns" :data-source="sizeData" :loading="loading29" />
      </div>
    </section>

    <!-- ================= 30. 可编辑单元格 ================= -->
    <section class="play-case">
      <header class="play-case__header">30. 可编辑单元格</header>
      <div class="play-panel">
        <a-button style="margin-bottom: 16px" type="primary" @click="handleAddRow">
          Add a row
        </a-button>
        <VTable :columns="editCellColumns" :data-source="editCellData" bordered>
          <template #bodyCell="{ column, record, text }">
            <template v-if="['name', 'age', 'address'].includes(String(column.dataIndex))">
              <div>
                <a-input
                  v-if="isEditingCell(record.key, String(column.dataIndex))"
                  :value="String(text)"
                  style="margin: -5px 0"
                  @press-enter="
                    saveEditCell(
                      record.key,
                      String(column.dataIndex),
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                  @blur="
                    saveEditCell(
                      record.key,
                      String(column.dataIndex),
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
                <div
                  v-else
                  class="editable-cell-text-wrapper"
                  style="padding: 5px; cursor: pointer"
                  @click="startEditCell(record.key, String(column.dataIndex))"
                >
                  {{ text }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-popconfirm
                v-if="editCellData.length"
                title="Sure to delete?"
                @confirm="handleDeleteRow(record.key)"
              >
                <a>Delete</a>
              </a-popconfirm>
            </template>
          </template>
        </VTable>
      </div>
    </section>

    <!-- ================= 31. 可编辑行 ================= -->
    <section class="play-case">
      <header class="play-case__header">31. 可编辑行</header>
      <div class="play-panel">
        <VTable :columns="editRowColumns" :data-source="editRowData" bordered>
          <template #bodyCell="{ column, record, text }">
            <template
              v-if="
                ['name', 'age', 'address'].includes(String(column.dataIndex)) &&
                editingRowKey === record.key
              "
            >
              <a-input
                :value="
                  String(
                    (editingRowCache as Record<string, unknown>)?.[String(column.dataIndex)] ??
                      text,
                  )
                "
                @change="
                  (e: Event) => {
                    if (editingRowCache) {
                      ;(editingRowCache as Record<string, unknown>)[String(column.dataIndex)] = (
                        e.target as HTMLInputElement
                      ).value
                    }
                  }
                "
              />
            </template>
            <template v-else-if="column.key === 'operation'">
              <span v-if="editingRowKey === record.key">
                <a @click="saveRow(record.key)" style="margin-right: 8px">Save</a>
                <a-popconfirm title="Sure to cancel?" @confirm="cancelRow">
                  <a>Cancel</a>
                </a-popconfirm>
              </span>
              <a v-else @click="editRow(record)">Edit</a>
            </template>
            <template v-else>{{ text }}</template>
          </template>
        </VTable>
      </div>
    </section>
  </div>
</template>
