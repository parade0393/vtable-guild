<script setup lang="ts">
/**
 * antdv-next（ant-design-vue 的 antd v5 形态重写版）。
 *
 * 加它进对照的理由和别的库不同：antdv-next 依赖 `@v-c/table` + `@v-c/virtual-list`，
 * 而 vtable-guild 的 VirtualList 正是从 `@v-c/virtual-list` vendored 过来的。
 * 也就是说这一栏和我们**共用同一套虚拟化内核**，差异只来自各自的表格层——
 * 这是整个对照里唯一能把「内核」与「我们自己写的部分」分离开的一栏。
 *
 * 它同时也是我们那三条 O(n) 优化的外部参照：上游内核仍是每次可视区计算
 * 重建整表前缀和，所以 10 万行下它应当表现出随行数增长的滚动成本。
 */
import { computed, ref } from 'vue'
import { Table } from 'antdv-next'
import type { TableProps } from 'antdv-next'

import { PERF_COLUMNS, TABLE_WIDTH, VIEWPORT_HEIGHT } from '../columns'
import { compareScore, type PerfRow } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const sortOrder = ref<SortOrderLike>(null)

// 与 AntdvSubject 同理：cssinjs 运行时注入样式，刻意不引 unlayered 的 reset.css。
const columns = computed<TableProps['columns']>(() =>
  PERF_COLUMNS.map((c) => ({
    title: c.title,
    dataIndex: c.key,
    key: c.key,
    width: c.width,
    align: c.align,
    // 同一个比较函数。`sorter: true` 在 antd 心智里是「服务端排」，本地不干活，
    // 写 true 会让它因为没排数据而白赢。
    ...(c.sortable
      ? { sorter: compareScore as (a: unknown, b: unknown) => number, sortOrder: sortOrder.value }
      : {}),
  })),
)

defineExpose({
  sort(order: SortOrderLike) {
    sortOrder.value = order
  },
  getScroller() {
    return findScroller(hostRef.value)
  },
  /**
   * 注意：开启 `virtual` 后 antdv-next 的**表体不是 `<table>`**——
   * 它渲染成 `div.ant-table-tbody-virtual` + `div.ant-table-row`，
   * 只有表头still是真表格。所以这里不能用 `tr` 选择器（会选到 0 行，
   * 让实测行高与可视行数两列变成空值，公平性校验直接失效）。
   * 这一点同时是能力边界表里的事实：它和 el-table-v2 一样牺牲了表体语义。
   */
  rowSelector: '.ant-table-tbody-virtual .ant-table-row',
})
</script>

<template>
  <div ref="hostRef" class="subject-host" :style="{ width: `${TABLE_WIDTH}px` }">
    <!--
      虚拟滚动需要同时给 scroll.x 与 scroll.y：x 用于让它按定宽列布局，
      与另外三家的 860px 总宽一致。
    -->
    <Table
      :columns="columns"
      :data-source="props.rows as unknown as PerfRow[]"
      :pagination="false"
      :scroll="{ x: TABLE_WIDTH, y: VIEWPORT_HEIGHT }"
      :virtual="true"
      size="middle"
      row-key="key"
      bordered
    />
  </div>
</template>
