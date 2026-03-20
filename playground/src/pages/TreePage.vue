<script setup lang="ts">
import { ref } from 'vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, RowSelection } from '@vtable-guild/table'

interface TreeRow {
  key: string
  name: string
  age: number
  role: string
  address: string
  children?: TreeRow[]
}

// 3-level nested tree data
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

// Selection with tree
const selectedRowKeys = ref<(string | number)[]>([])

const rowSelection: RowSelection<TreeRow> = {
  selectedRowKeys: [],
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys
  },
}
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Phase 6 Tree Data</p>
        <h1>树形数据验证</h1>
        <p class="play-summary">验证多级嵌套数据展开/折叠、缩进渲染、与行选择的联动。</p>
      </div>
    </section>

    <!-- Case 01: Basic tree -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 01</p>
          <h2>基础树形展开/折叠</h2>
        </div>
        <p class="play-case__desc">3 级嵌套，点击展开图标展开/折叠子行</p>
      </header>
      <VTable :data-source="treeData as any" :columns="columns as any" size="md" row-key="key" />
    </section>

    <!-- Case 02: Default expand all -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 02</p>
          <h2>默认全部展开</h2>
        </div>
        <p class="play-case__desc">通过 defaultExpandAllRows 默认展开所有层级</p>
      </header>
      <div class="play-note-card">
        <p class="play-note-card__eyebrow">Note</p>
        <h3>defaultExpandAllRows</h3>
        <p>
          树形数据的展开/折叠由 useTreeData 管理，与 expandable（展开行）独立。 defaultExpandAllRows
          通过 useTreeData 的 option 传入。
        </p>
      </div>
    </section>

    <!-- Case 03: Tree + selection -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 03</p>
          <h2>树形 + 行选择</h2>
        </div>
        <p class="play-case__desc">树形数据与 Checkbox 行选择的联动</p>
      </header>
      <p class="play-inline-note">
        已选: {{ selectedRowKeys.length > 0 ? selectedRowKeys.join(', ') : '(无)' }}
      </p>
      <VTable
        :data-source="treeData as any"
        :columns="columns as any"
        :row-selection="rowSelection as any"
        size="md"
        row-key="key"
      />
    </section>

    <!-- Case 04: Custom indent size -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 04</p>
          <h2>自定义缩进宽度</h2>
        </div>
        <p class="play-case__desc">indentSize=30，增大层级缩进</p>
      </header>
      <VTable
        :data-source="treeData as any"
        :columns="columns as any"
        :indent-size="30"
        size="md"
        row-key="key"
      />
    </section>
  </main>
</template>
