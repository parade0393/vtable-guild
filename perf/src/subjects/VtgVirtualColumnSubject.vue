<script setup lang="ts">
/**
 * vtable-guild 的**横向虚拟化**（`virtualColumn`）。
 *
 * 与 VtgSubject 的唯一差别就是多传一个 `:virtual-column`——照 VtgFixedSubject
 * 的先例做成独立文件而不是给 VtgSubject 加开关：被测组件里任何多余的条件与
 * 响应式依赖都会进入测量窗口。
 *
 * 这一对同样构成「自身对照」：同一个库、同一份数据与列配置，只有列是否窗口化
 * 不同，因此两者的差值可以直接归因到横向虚拟化，不需要跨库解释。
 *
 * 关键读数是**可视列数**：它应该从列总数掉到十几，否则说明前提没满足、
 * 特性被 devWarn 静默降级了（见 Table.tsx 的 vtable-virtual-column-disabled）。
 */
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnsType, SortOrder } from '@vtable-guild/vtable-guild'

import { buildColumns, hostWidth, tableWidth, VIEWPORT_HEIGHT } from '../columns'
import { compareScore, type PerfRow } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const sortOrder = ref<SortOrder>(null)

const columns = computed<ColumnsType<PerfRow>>(() =>
  buildColumns(props.columnCount).map((c) => ({
    title: c.title,
    dataIndex: c.dataKey,
    key: c.key,
    width: c.width,
    align: c.align,
    // 显式比较函数：不用 `sorter: true`，见 data.ts 的 compareScore 注释。
    ...(c.sortable ? { sorter: compareScore, sortOrder: sortOrder.value } : {}),
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
  rowSelector: 'tbody tr',
})
</script>

<template>
  <div ref="hostRef" class="subject-host" :style="{ width: `${width}px` }">
    <VTable
      :columns="columns"
      :data-source="props.rows"
      :scroll="{ x: scrollX, y: VIEWPORT_HEIGHT }"
      :virtual="true"
      :virtual-column="true"
      size="middle"
      row-key="key"
      bordered
    />
  </div>
</template>
