<script setup lang="ts">
import { computed, ref } from 'vue'
import { TableV2 } from 'element-plus'
import 'element-plus/es/components/table-v2/style/css'

import { buildColumns, hostWidth, ROW_HEIGHT, VIEWPORT_HEIGHT } from '../columns'
import { sortRowsByScore, type PerfRow } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const sortOrder = ref<SortOrderLike>(null)

const columns = computed(() =>
  buildColumns(props.columnCount).map((c) => ({
    key: c.key,
    dataKey: c.dataKey,
    title: c.title,
    width: c.width,
    align: c.align ?? 'left',
    sortable: c.sortable,
  })),
)

const width = computed(() => hostWidth(props.columnCount))

/**
 * el-table-v2 **不内置排序**，只 emit `column-sort`，数据要应用侧自己排。
 *
 * 对照里把这段应用侧排序计入它的耗时——因为这是用它时必须写的代码，
 * 不计就等于让它免费跳过一整个环节。
 */
const rows = computed<PerfRow[]>(() => sortRowsByScore(props.rows, sortOrder.value))

const sortState = computed(() =>
  sortOrder.value
    ? { key: 'score', order: sortOrder.value === 'ascend' ? 'asc' : 'desc' }
    : undefined,
)

defineExpose({
  sort(order: SortOrderLike) {
    sortOrder.value = order
  },
  getScroller() {
    // 先按 element-plus 虚拟列表的容器找，找不到再回落到结构无关的探测。
    const wrapper = hostRef.value?.querySelector<HTMLElement>('.el-vl__wrapper')
    if (wrapper && wrapper.scrollHeight > wrapper.clientHeight + 4) return wrapper
    return findScroller(hostRef.value)
  },
  rowSelector: '.el-table-v2__row',
})

/**
 * el-table-v2 的 `height` 是**含表头的总高**，而 vtable-guild / antdv 的
 * `scroll.y` 是**表体高度**。直接把 460 传给它，表体只剩 413px，
 * 可视行数会少一行——对照就不成立了。所以这里补上一个表头高度。
 */
const totalHeight = VIEWPORT_HEIGHT + ROW_HEIGHT
</script>

<template>
  <div ref="hostRef" class="subject-host" :style="{ width: `${width}px` }">
    <!-- 必须显式定高：el-table-v2 只支持定高行，这也是行高对齐的落点 -->
    <TableV2
      :columns="columns as any"
      :data="rows"
      :width="width"
      :height="totalHeight"
      :row-height="ROW_HEIGHT"
      :header-height="ROW_HEIGHT"
      :sort-by="sortState as any"
      row-key="key"
      fixed
    />
  </div>
</template>
