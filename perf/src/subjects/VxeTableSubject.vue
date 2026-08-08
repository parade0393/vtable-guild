<script setup lang="ts">
/**
 * vxe-table 4.x —— 表格赛道最直接的标杆（8.6k star，企业级全能表格）。
 *
 * 它和 vtable-guild 同为**语义化 `<table>` + 虚拟滚动**，能力面比我们更广，
 * 因此是比 el-table-v2（纯 div 定高）更同类的对手：耗时差异不能再用
 * 「它牺牲了 table 语义」来解释。
 *
 * 注意 vxe-table 4.7+ 拆成了 Table 库 + UI 库，必须同时装 `vxe-pc-ui`
 * 并引入两份样式；样式漏引会表现为布局错乱而不是报错。
 */
import { computed, ref } from 'vue'
import { VxeTable, VxeColumn } from 'vxe-table'
import 'vxe-table/lib/style.css'

import { buildColumns, hostWidth, ROW_HEIGHT, VIEWPORT_HEIGHT } from '../columns'
import { compareScore, type PerfRow } from '../data'
import { findScroller } from '../utils/dom'
import type { SortOrderLike, SubjectProps } from './types'

/** vxe-table 表头 48px + 横向滚动条预留 15px；用于把表体校准到 VIEWPORT_HEIGHT。 */
const VXE_HEADER_OVERHEAD = 63

const props = defineProps<SubjectProps>()

const hostRef = ref<HTMLElement | null>(null)
const tableRef = ref<InstanceType<typeof VxeTable> | null>(null)

const columns = computed(() => buildColumns(props.columnCount))
const width = computed(() => hostWidth(props.columnCount))

/**
 * vxe-table 的排序是命令式的（`sort(field, order)`），不像另外三家那样
 * 由列上的 `sortOrder` 受控。为了让四家吃到同一个动作语义，
 * 这里把命令式 API 包成同样的 `sort(order)` 契约。
 *
 * 比较函数仍是共享的 `compareScore`，通过列的 `sort-method` 传入——
 * 不能用它的默认比较，否则排的不是同一件事。
 */
function sort(order: SortOrderLike) {
  const table = tableRef.value as unknown as {
    sort: (field: string, order: 'asc' | 'desc' | null) => Promise<unknown>
    clearSort: () => Promise<unknown>
  } | null
  if (!table) return
  if (order === null) {
    table.clearSort()
    return
  }
  table.sort('score', order === 'ascend' ? 'asc' : 'desc')
}

defineExpose({
  sort,
  getScroller() {
    return findScroller(hostRef.value)
  },
  rowSelector: '.vxe-table--body tbody > tr',
})
</script>

<template>
  <div ref="hostRef" class="subject-host" :style="{ width: `${width}px` }">
    <!--
      `height` 在 vxe-table 里是含表头的总高（与 el-table-v2 同语义），必须校准，
      否则表体高度不同 → 可视行数与 DOM 节点数都不可比，是最容易被抓的作弊点。

      实测（Chrome 151）：表头 48px + 横向滚动条预留 15px = 63px 表头外开销，
      所以传 460 + 63 才能让表体正好 460px、与另外几家一致。
      这个常数只对当前版本/平台成立——结果表里的「实测行高」与「可视行数」
      两列就是给你复核它有没有漂移的。

      `gt: 0` 表示任意规模都启用虚拟滚动：vxe-table 4.7+ 默认**关闭**虚拟滚动，
      不显式打开就等于让它渲染全部 10 万行，那是把对手拖下水，不是对照。

      `scroll-x` 同理，而且在宽表档上更关键：vxe-table 是这几家里**唯一**内置
      横向虚拟滚动的，不显式打开就等于藏掉它在这个场景下的看家本领，
      测出来的对照会系统性地对它不利。它正是 antdv-next#427 评论区里
      两位用户最终迁移过去的那个库，这一栏就是宽表档的标杆。
    -->
    <VxeTable
      ref="tableRef"
      border
      show-overflow
      :data="props.rows as PerfRow[]"
      :height="VIEWPORT_HEIGHT + VXE_HEADER_OVERHEAD"
      :row-config="{ height: ROW_HEIGHT, isHover: false }"
      :scroll-y="{ enabled: true, gt: 0 }"
      :scroll-x="{ enabled: true, gt: 0 }"
      :column-config="{ resizable: false }"
    >
      <VxeColumn
        v-for="c in columns"
        :key="c.key"
        :field="c.dataKey"
        :title="c.title"
        :width="c.width"
        :align="c.align"
        :sortable="c.sortable"
        :sort-method="c.sortable ? compareScore : undefined"
      />
    </VxeTable>
  </div>
</template>
