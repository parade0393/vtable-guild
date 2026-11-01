<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { VTable, VTableGuildConfigProvider } from '@vtable-guild/vtable-guild'
import type {
  ColumnsType,
  ColumnType,
  TableChangeExtra,
  TableFiltersInfo,
  VTableGuildCssMode,
  VTableSorterResult,
} from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style'

interface AlignmentRow {
  key: number
  score: number
}

interface AlignmentCase {
  id: string
  title: string
  sorter?: boolean
  filter?: boolean
  columnIcon?: boolean
  slotIcon?: boolean
  grouped?: boolean
  virtual?: boolean
}

const cases: AlignmentCase[] = [
  { id: 'plain', title: '普通表头' },
  { id: 'sort', title: '仅排序', sorter: true },
  { id: 'filter', title: '仅筛选', filter: true },
  { id: 'sort-filter', title: '排序＋筛选', sorter: true, filter: true },
  {
    id: 'column-filter-icon',
    title: '列级自定义筛选图标＋排序',
    sorter: true,
    filter: true,
    columnIcon: true,
  },
  {
    id: 'slot-filter-icon',
    title: '筛选图标插槽＋排序',
    sorter: true,
    filter: true,
    slotIcon: true,
  },
  { id: 'grouped', title: '分组表头', sorter: true, filter: true, grouped: true },
  { id: 'virtual', title: '虚拟表体', sorter: true, filter: true, virtual: true },
]

const cssMode = ref<VTableGuildCssMode>('prebuilt')
const showSorterTooltip = ref(true)
const longTitle = ref(false)
const headerEllipsis = ref(true)
const resetVersion = ref(0)
const events = ref<Record<string, unknown>>({})
const dataSource: AlignmentRow[] = [
  { key: 1, score: 80 },
  { key: 2, score: 20 },
  { key: 3, score: 50 },
]
const virtualRows = Array.from({ length: 30 }, (_, index) => ({
  key: index + 1,
  score: dataSource[index % dataSource.length]!.score,
}))
const alignments = ['left', 'center', 'right'] as const

// 所有场景共享配置生成器，但每张 VTable 独立保存排序与筛选状态。
// 不使用 ui 或 CSS 修补表头，让预设本身承担标题和按钮的对齐。
const fixtures = computed(() =>
  cases.map((fixture) => {
    const children: ColumnType<AlignmentRow>[] = alignments.map((align) => ({
      key: align,
      dataIndex: 'score',
      title: longTitle.value ? `${align}：需要省略的很长很长的表头标题与排序筛选按钮` : align,
      width: 240,
      align,
      sorter: fixture.sorter,
      ellipsis: true,
      filters: fixture.filter
        ? [
            { text: '大于等于 50', value: 'high' },
            { text: '小于 50', value: 'low' },
          ]
        : undefined,
      onFilter: fixture.filter
        ? (value, record) => (value === 'high' ? record.score >= 50 : record.score < 50)
        : undefined,
      customHeaderCell: () => ({ 'data-test-align': align }),
      filterIcon: fixture.columnIcon
        ? ({ filtered }) =>
            h(
              'svg',
              {
                'data-custom-filter-icon': 'column',
                width: '1em',
                height: '1em',
                viewBox: '0 0 16 16',
                fill: filtered ? 'currentColor' : 'none',
                stroke: 'currentColor',
                'aria-hidden': 'true',
              },
              [h('path', { d: 'M2 3h12L9.5 8v4l-3 1V8Z' })],
            )
        : undefined,
    }))
    const columns: ColumnsType<AlignmentRow> = fixture.grouped
      ? [{ title: 'group center', key: 'group', align: 'center', children }]
      : children
    return { ...fixture, columns }
  }),
)

function recordChange(
  id: string,
  filters: TableFiltersInfo,
  sorter: VTableSorterResult<AlignmentRow>,
  extra: TableChangeExtra<AlignmentRow>,
) {
  const sorters = Array.isArray(sorter) ? sorter : [sorter]
  events.value[id] = {
    action: extra.action,
    filters,
    sorter: sorters.map(({ columnKey, order }) => ({ columnKey, order })),
    scores: extra.currentDataSource.map((record) => record.score),
  }
}

function reset() {
  resetVersion.value += 1
  events.value = {}
}
</script>

<template>
  <VTableGuildConfigProvider :css-mode="cssMode">
    <div class="play-page">
      <section class="play-hero">
        <div>
          <p class="play-kicker">Header alignment · Issue #59</p>
          <h1>表头内容整体对齐</h1>
          <p class="play-summary">
            每列宽 240px，依次设置 left、center、right。顶部切换预设；center
            应让标题、排序图标和筛选按钮紧邻并整体居中，正文仍按列独立对齐。
          </p>
        </div>
      </section>

      <section class="play-case">
        <div class="play-toolbar">
          <label>
            CSS 模式
            <select v-model="cssMode" data-testid="alignment-css-mode" class="play-ghost-button">
              <option value="prebuilt">prebuilt</option>
              <option value="tailwind4">Tailwind 4</option>
            </select>
          </label>
          <label>
            <input v-model="showSorterTooltip" type="checkbox" data-testid="alignment-tooltip" />
            排序提示
          </label>
          <label>
            <input v-model="longTitle" type="checkbox" data-testid="alignment-long-title" />
            长标题
          </label>
          <label>
            <input v-model="headerEllipsis" type="checkbox" data-testid="alignment-ellipsis" />
            表头省略
          </label>
          <button type="button" class="play-ghost-button" @click="reset">重置所有排序和筛选</button>
        </div>
        <p class="play-case__desc">
          点击排序列应按 20、50、80 升序，再按 80、50、20
          降序。点击筛选按钮只打开筛选面板，不能触发排序。
          开启长标题后，省略号应出现且排序、筛选按钮始终可见；关闭省略允许标题换行。 Element Plus 的
          left / right 应将整组内容靠左 / 靠右；Antdv 的 left / right 保留原有按钮布局。
        </p>
      </section>

      <section
        v-for="fixture in fixtures"
        :key="fixture.id"
        class="play-case"
        :data-case="fixture.id"
      >
        <header class="play-case__header">
          <h2>{{ fixture.title }}</h2>
        </header>
        <!-- 限定容器宽度，避免宽屏拉伸列宽后掩盖对齐偏差。 -->
        <div class="header-alignment-table">
          <VTable
            :key="`${fixture.id}-${resetVersion}`"
            :columns="fixture.columns"
            :data-source="fixture.virtual ? virtualRows : dataSource"
            :pagination="false"
            row-key="key"
            :show-sorter-tooltip="showSorterTooltip"
            :header-ellipsis="headerEllipsis"
            :virtual="fixture.virtual"
            :scroll="fixture.virtual ? { y: 160 } : undefined"
            @change="(filters, sorter, extra) => recordChange(fixture.id, filters, sorter, extra)"
          >
            <template v-if="fixture.slotIcon" #customFilterIcon="{ filtered }">
              <svg
                data-custom-filter-icon="slot"
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
                :fill="filtered ? 'currentColor' : 'none'"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M2 3h12L9.5 8v4l-3 1V8Z" />
              </svg>
            </template>
          </VTable>
        </div>
        <details v-if="events[fixture.id]">
          <summary>本表最近一次 change 事件</summary>
          <pre>{{ JSON.stringify(events[fixture.id], null, 2) }}</pre>
        </details>
      </section>
    </div>
  </VTableGuildConfigProvider>
</template>

<style scoped>
.header-alignment-table {
  width: 720px;
  max-width: 100%;
}
</style>
