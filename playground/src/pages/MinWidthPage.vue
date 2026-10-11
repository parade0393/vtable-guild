<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { VTable, VTableSummary } from '@vtable-guild/vtable-guild'
import type { ColumnsType, ColumnType } from '@vtable-guild/vtable-guild'

interface WidthRow {
  key: number
  a: string
  b: string
  c: string
}

const layout = ref<'default' | 'auto' | 'fixed'>('auto')
const containerWidth = ref(400)
const widthKind = ref('unset')
const minMode = ref('baseline')
const scrollX = ref('none')
const fixedHeader = ref(false)
const fixedColumns = ref(false)
const virtual = ref(false)
const virtualColumn = ref(false)
const showHeader = ref(true)
const empty = ref(false)
const grouped = ref(false)
const summary = ref(false)
const longContent = ref(false)
const ellipsis = ref(false)
const showB = ref(true)
const reversed = ref(false)
const visible = ref(true)
const tableVersion = ref(0)
const wide = ref(false)
const selection = ref(false)
const expandable = ref(false)
const merged = ref(false)
const customWidth = ref(false)
const rowCount = ref(80)
const resizeEvents = ref<Array<{ key: string; width: number }>>([])

const minimums = computed(() => {
  if (minMode.value === 'none') return [undefined, undefined, undefined]
  if (minMode.value === 'partial') return [160, undefined, 240]
  if (minMode.value === 'zero') return [0, 0, 0]
  if (minMode.value === 'increased') return [240, 140, 320]
  if (minMode.value === 'reduced') return [80, 60, 120]
  return [160, 100, 240]
})
const declaredWidth = computed(() => {
  const widths: Record<string, number | string | undefined> = {
    unset: undefined,
    number: 120,
    px: '120px',
    percent: '20%',
    calc: 'calc(25% - 20px)',
    auto: 'auto',
    content: 'max-content',
  }
  return widths[widthKind.value]
})
const leafColumns = computed<ColumnType<WidthRow>[]>(() => {
  const columns: ColumnType<WidthRow>[] = [
    {
      key: 'a',
      dataIndex: 'a',
      title: 'A',
      minWidth: minimums.value[0],
      width: declaredWidth.value,
      resizable: true,
    },
    { key: 'b', dataIndex: 'b', title: 'B', width: 60, minWidth: minimums.value[1] },
    { key: 'c', dataIndex: 'c', title: 'C', minWidth: minimums.value[2], resizable: true },
  ]
  if (wide.value)
    columns.splice(
      2,
      0,
      ...Array.from(
        { length: 40 },
        (_unused, index): ColumnType<WidthRow> => ({
          key: `wide-${index}`,
          dataIndex: 'b',
          title: `字段 ${index + 1}`,
          minWidth: minMode.value === 'none' ? undefined : 80,
        }),
      ),
    )
  const shown = columns.filter((column) => showB.value || column.key !== 'b')
  if (reversed.value) shown.reverse()
  return shown.map((column, index) => ({
    ...column,
    ellipsis: ellipsis.value,
    customCell: merged.value
      ? (_record, row) => ({
          colSpan: row === 0 && column.key === 'a' ? 2 : row === 0 && column.key === 'b' ? 0 : 1,
        })
      : customWidth.value
        ? () => ({ style: { width: '1px', minWidth: '0px' } })
        : undefined,
    fixed: fixedColumns.value
      ? index === 0
        ? 'left'
        : index === shown.length - 1
          ? 'right'
          : undefined
      : undefined,
  }))
})
const columns = computed<ColumnsType<WidthRow>>(() =>
  grouped.value
    ? [{ title: 'A / B / C', key: 'group', children: leafColumns.value }]
    : leafColumns.value,
)
const data = computed<WidthRow[]>(() =>
  empty.value
    ? []
    : Array.from({ length: virtual.value ? rowCount.value : 4 }, (_, key) => ({
        key,
        a: longContent.value ? `A_${'long_content_'.repeat(12)}${key}` : `A${key + 1}`,
        b: `B${key + 1}`,
        c: longContent.value ? `C_${'unbroken_'.repeat(16)}${key}` : `C${key + 1}`,
      })),
)
const scroll = computed(() => ({
  x:
    scrollX.value === 'number'
      ? 700
      : scrollX.value === 'css'
        ? 'calc(100% + 80px)'
        : scrollX.value === 'max-content'
          ? 'max-content'
          : undefined,
  y: fixedHeader.value || virtual.value ? 240 : undefined,
}))
const utilityColumnCount = computed(() => Number(selection.value) + Number(expandable.value))

function handleResize(column: ColumnType<WidthRow>, width: number) {
  resizeEvents.value.push({ key: String(column.key), width })
}

function resetResize() {
  tableVersion.value += 1
  resizeEvents.value = []
}
</script>

<template>
  <div class="play-page">
    <section class="play-hero">
      <div>
        <p class="play-kicker">Column width constraints</p>
        <h1>最小列宽</h1>
        <p class="play-summary">
          A / B / C 的下限为 160 / 100 / 240px。A、C 可拖拽，B 不可拖拽且声明 width: 60。 400px
          容器应横向滚动；拖动 A 时，B 与 C 仍保留下限。顶部可切换两种主题。
        </p>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Live fixture</p>
          <h2>布局、拖拽与动态更新</h2>
        </div>
        <p class="play-case__desc">
          切换配置会保留已有拖拽结果；调小或移除下限后，表格应释放旧约束。
        </p>
      </header>
      <div class="play-toolbar">
        <label>
          布局
          <select v-model="layout" data-testid="layout" class="play-ghost-button">
            <option value="auto">auto</option>
            <option value="fixed">fixed</option>
            <option value="default">默认自动选择</option>
          </select>
        </label>
        <label>
          容器
          <select v-model="containerWidth" data-testid="container-width" class="play-ghost-button">
            <option :value="400">400px</option>
            <option :value="500">500px</option>
            <option :value="900">900px</option>
          </select>
        </label>
        <label>
          A 的 width
          <select v-model="widthKind" data-testid="width-kind" class="play-ghost-button">
            <option value="unset">未声明</option>
            <option value="number">120</option>
            <option value="px">120px</option>
            <option value="percent">20%</option>
            <option value="calc">calc(25% - 20px)</option>
            <option value="auto">auto</option>
            <option value="content">max-content</option>
          </select>
        </label>
        <label>
          minWidth
          <select v-model="minMode" data-testid="min-mode" class="play-ghost-button">
            <option value="baseline">160 / 100 / 240</option>
            <option value="partial">160 / 无 / 240</option>
            <option value="zero">0 / 0 / 0</option>
            <option value="increased">240 / 140 / 320</option>
            <option value="reduced">80 / 60 / 120</option>
            <option value="none">全部移除</option>
          </select>
        </label>
        <label>
          scroll.x
          <select v-model="scrollX" data-testid="scroll-x" class="play-ghost-button">
            <option value="none">未声明</option>
            <option value="number">700</option>
            <option value="css">calc(100% + 80px)</option>
            <option value="max-content">max-content</option>
          </select>
        </label>
      </div>
      <div class="play-toolbar">
        <label>
          虚拟行数
          <select v-model="rowCount" data-testid="row-count" class="play-ghost-button">
            <option :value="80">80</option>
            <option :value="10000">10,000</option>
          </select>
        </label>
        <label
          ><input v-model="fixedHeader" type="checkbox" data-testid="fixed-header" />
          固定表头</label
        >
        <label
          ><input v-model="fixedColumns" type="checkbox" data-testid="fixed-columns" />
          左右固定列</label
        >
        <label><input v-model="virtual" type="checkbox" data-testid="virtual" /> virtual</label>
        <label
          ><input v-model="virtualColumn" type="checkbox" data-testid="virtual-column" />
          virtualColumn</label
        >
        <label
          ><input v-model="showHeader" type="checkbox" data-testid="show-header" /> 显示表头</label
        >
        <label><input v-model="empty" type="checkbox" data-testid="empty" /> 空数据</label>
        <label><input v-model="grouped" type="checkbox" data-testid="grouped" /> 分组表头</label>
        <label><input v-model="summary" type="checkbox" data-testid="summary" /> 固定合计行</label>
        <label
          ><input v-model="longContent" type="checkbox" data-testid="long-content" /> 长内容</label
        >
        <label><input v-model="ellipsis" type="checkbox" data-testid="ellipsis" /> ellipsis</label>
        <label><input v-model="wide" type="checkbox" data-testid="wide" /> 40列窗口</label>
        <label><input v-model="selection" type="checkbox" data-testid="selection" /> 选择列</label>
        <label
          ><input v-model="expandable" type="checkbox" data-testid="expandable" /> 展开列</label
        >
        <label><input v-model="merged" type="checkbox" data-testid="merged" /> 合并单元格</label>
        <label
          ><input v-model="customWidth" type="checkbox" data-testid="custom-width" />
          customCell宽度</label
        >
        <label><input v-model="showB" type="checkbox" data-testid="show-b" /> 显示 B</label>
        <label
          ><input v-model="reversed" type="checkbox" data-testid="reversed" /> 反转列顺序</label
        >
        <label
          ><input v-model="visible" type="checkbox" data-testid="container-visible" />
          显示容器</label
        >
        <button
          class="play-ghost-button"
          type="button"
          data-testid="reset-resize"
          @click="resetResize"
        >
          清除拖拽结果
        </button>
      </div>
      <p class="play-inline-note">
        当前下限：<span data-testid="minimums">{{
          minimums.map((value) => value ?? '无').join(' / ')
        }}</span
        >。 拖拽事件（松手时记录）：<span data-testid="resize-events">{{
          JSON.stringify(resizeEvents)
        }}</span>
      </p>
      <div
        v-show="visible"
        data-testid="min-width-container"
        :style="{ width: `${containerWidth}px` }"
      >
        <VTable
          :key="tableVersion"
          data-testid="min-width-table"
          :columns="columns"
          :data-source="data"
          :table-layout="layout === 'default' ? undefined : layout"
          :scroll="scroll"
          :virtual="virtual"
          :virtual-column="virtualColumn"
          :show-header="showHeader"
          :pagination="false"
          :row-selection="selection ? { columnWidth: 48 } : undefined"
          :expandable="
            expandable
              ? { columnWidth: 48, expandedRowRender: () => h('span', '展开内容') }
              : undefined
          "
          row-key="key"
          bordered
          @resize-column="handleResize"
        >
          <template v-if="summary" #summary>
            <VTableSummary fixed="bottom">
              <VTableSummary.Row>
                <VTableSummary.Cell
                  v-if="utilityColumnCount"
                  :index="0"
                  :col-span="utilityColumnCount"
                  >合计</VTableSummary.Cell
                >
                <VTableSummary.Cell
                  v-for="(column, index) in leafColumns"
                  :key="column.key"
                  :index="index + utilityColumnCount"
                >
                  {{ column.title }} 合计
                </VTableSummary.Cell>
              </VTableSummary.Row>
            </VTableSummary>
          </template>
        </VTable>
      </div>
    </section>
  </div>
</template>
