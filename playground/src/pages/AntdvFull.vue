<script lang="ts" setup>
import { VTable } from '@vtable-guild/table'
import { SmileOutlined } from '@ant-design/icons-vue'
import { Tag as ATag } from 'ant-design-vue'
import type { ColumnType } from '@vtable-guild/table'
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
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
  },
  {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
  },
  {
    title: 'Action',
    key: 'action',
  },
]

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
]

const columns1 = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 80,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address 1',
    ellipsis: true,
  },
  {
    title: 'Long Column Long Column Long Column',
    dataIndex: 'address',
    key: 'address 2',
    ellipsis: true,
  },
  {
    title: 'Long Column Long Column',
    dataIndex: 'address',
    key: 'address 3',
    ellipsis: true,
  },
  {
    title: 'Long Column',
    dataIndex: 'address',
    key: 'address 4',
    ellipsis: true,
  },
]

const data1 = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 2 Lake Park, London No. 2 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park, Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
]

const sharedOnCell = (_: Record<string, unknown>, index?: number) => {
  if (index === 4) {
    return { colSpan: 0 }
  }
}

const data2 = [
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

const columns2: ColumnType[] = [
  {
    title: 'Name',
    dataIndex: 'name',
    customCell: (_, index) => ({
      colSpan: (index ?? 0) < 4 ? 1 : 5,
    }),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    customCell: sharedOnCell,
  },
  {
    title: 'Home phone',
    colSpan: 2,
    dataIndex: 'tel',
    customCell: (_, index) => {
      if (index === 2) {
        return { rowSpan: 2 }
      }
      // These two are merged into above cell
      if (index === 3) {
        return { rowSpan: 0 }
      }
      if (index === 4) {
        return { colSpan: 0 }
      }
    },
  },
  {
    title: 'Phone',
    colSpan: 0,
    dataIndex: 'phone',
    customCell: sharedOnCell,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    customCell: sharedOnCell,
  },
]
</script>

<template>
  <div>
    <section class="play-case">
      <header class="play-case__header">基本用法(插槽)和bordered</header>
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
    <section class="play-case">
      <header class="play-case__header">单元格自动省略</header>
      <div class="play-panel">
        <VTable :columns="columns1" :data-source="data1" />
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">表格行/列合并</header>
      <div class="play-panel">
        <VTable :columns="columns2" bordered :data-source="data2" />
      </div>
    </section>
  </div>
</template>
