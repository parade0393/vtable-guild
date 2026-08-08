<script setup lang="ts">
import { computed, ref } from 'vue'
import { Table } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'

import { buildColumns, hostWidth, tableWidth, VIEWPORT_HEIGHT } from '../columns'
import { compareScore } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const sortOrder = ref<SortOrderLike>(null)

// ant-design-vue 4.x 是 cssinjs 运行时注入样式，不需要 import 任何 CSS。
// 这里刻意**不引** `ant-design-vue/dist/reset.css`——它是 unlayered 的，
// 会按 CSS Cascade Layers 规范压过所有 layer 内规则（README 有完整记录）。
const columns = computed<TableColumnsType>(() =>
  buildColumns(props.columnCount).map((c) => ({
    title: c.title,
    dataIndex: c.dataKey,
    key: c.key,
    width: c.width,
    align: c.align,
    // 与 vtable-guild 用同一个比较函数。`sorter: true` 在 antdv 里表示
    // 「交给服务端排」、本地不做任何排序，那样对照就是假的。
    ...(c.sortable
      ? { sorter: compareScore as (a: unknown, b: unknown) => number, sortOrder: sortOrder.value }
      : {}),
  })),
)

const width = computed(() => hostWidth(props.columnCount))
const scrollX = computed(() => tableWidth(props.columnCount))

defineExpose({
  sort(order: SortOrderLike) {
    sortOrder.value = order
  },
  getScroller() {
    return findScroller(hostRef.value)
  },
  // 必须排除 .ant-table-measure-row：antdv 会在 tbody 首位插一个 0 高度的
  // 测量行，用它量行高会得到 0，把公平性校验直接搞废。
  rowSelector: '.ant-table-tbody > tr.ant-table-row',
})
</script>

<template>
  <div ref="hostRef" class="subject-host" :style="{ width: `${width}px` }">
    <!-- antdv 4.x 无虚拟滚动：所有行都会进 DOM，这正是对照要呈现的事实 -->
    <Table
      :columns="columns"
      :data-source="props.rows as unknown as Record<string, unknown>[]"
      :pagination="false"
      :scroll="{ x: scrollX, y: VIEWPORT_HEIGHT }"
      size="middle"
      row-key="key"
      bordered
    />
  </div>
</template>
