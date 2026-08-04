<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnsType, SortOrder } from '@vtable-guild/vtable-guild'

import { PERF_COLUMNS, TABLE_WIDTH, VIEWPORT_HEIGHT } from '../columns'
import { compareScore, type PerfRow } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const sortOrder = ref<SortOrder>(null)

const columns = computed<ColumnsType<PerfRow>>(() =>
  PERF_COLUMNS.map((c) => ({
    title: c.title,
    dataIndex: c.key,
    key: c.key,
    width: c.width,
    align: c.align,
    // 显式比较函数：不用 `sorter: true`，见 data.ts 的 compareScore 注释。
    ...(c.sortable ? { sorter: compareScore, sortOrder: sortOrder.value } : {}),
  })),
)

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
  <div ref="hostRef" class="subject-host" :style="{ width: `${TABLE_WIDTH}px` }">
    <VTable
      :columns="columns"
      :data-source="props.rows"
      :scroll="{ y: VIEWPORT_HEIGHT }"
      :virtual="true"
      size="middle"
      row-key="key"
      bordered
    />
  </div>
</template>
