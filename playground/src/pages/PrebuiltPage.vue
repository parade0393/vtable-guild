<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable, VTableGuildConfigProvider, VTableSummary } from '@vtable-guild/vtable-guild'
import type { ColumnsType, VTableGuildCssMode } from '@vtable-guild/vtable-guild'
// 预构建 CSS（tokens + presets + transitions + vtg- 前缀工具类）。其中的 vtg- 前缀规则
// 只会被 prebuilt 模式输出的类命中，与 playground 全局 Tailwind 4 的裸工具类互不冲突。
import '@vtable-guild/vtable-guild/css/style'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  tag: 'active' | 'closed' | 'paused'
  count: number
  desc: string
}

const cssMode = ref<VTableGuildCssMode>('prebuilt')

const dataSource: DemoRow[] = [
  {
    key: '1',
    name: 'Alice Johnson',
    tag: 'active',
    count: 120,
    desc: '未声明宽度的列分享剩余空间',
  },
  {
    key: '2',
    name: 'Bob Chen',
    tag: 'paused',
    count: 87,
    desc: 'fixed 布局下列宽由 colgroup 分配',
  },
  { key: '3', name: 'Carol Diaz', tag: 'active', count: 233, desc: '固定列贴住容器边缘' },
  { key: '4', name: 'David Lee', tag: 'closed', count: 58, desc: '无 scroll.x 时表格恒定 100% 宽' },
  { key: '5', name: 'Eve Wang', tag: 'active', count: 341, desc: '表头表与表体表宽度口径一致' },
  { key: '6', name: 'Frank Miller', tag: 'active', count: 19, desc: '与 ant-design-vue 行为对齐' },
]

const alignColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 200 },
  { title: 'Tag', dataIndex: 'tag', key: 'tag', align: 'center' },
  { title: 'Count', dataIndex: 'count', key: 'count', width: 120, align: 'right' },
]

const fixedColumns: ColumnsType<DemoRow> = [
  { title: '#', dataIndex: 'key', key: 'id', width: 64, fixed: 'left' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Desc', dataIndex: 'desc', key: 'desc', ellipsis: true },
  { title: 'Count', dataIndex: 'count', key: 'count', width: 100, align: 'right' },
  { title: 'Action', key: 'action', width: 110, fixed: 'right', align: 'center' },
]

const totalCount = computed(() => dataSource.reduce((sum, row) => sum + row.count, 0))
const activeCount = computed(() => dataSource.filter((row) => row.tag === 'active').length)
</script>

<template>
  <VTableGuildConfigProvider :css-mode="cssMode">
    <div class="prebuilt-page">
      <section class="prebuilt-page__intro">
        <h2>Prebuilt cssMode</h2>
        <p>
          本页通过局部 <code>VTableGuildConfigProvider</code> 覆盖 cssMode，并加载预构建 CSS
          （<code>@vtable-guild/vtable-guild/css/style</code>）。切换 cssMode 可对比同一组件树在
          <code>prebuilt</code>（输出 vtg- 前缀类）与
          <code>tailwind4</code>（输出裸工具类）下的渲染结果。
        </p>
        <div class="prebuilt-page__switch" role="group" aria-label="cssMode switch">
          <button
            type="button"
            :class="{ 'is-active': cssMode === 'prebuilt' }"
            @click="cssMode = 'prebuilt'"
          >
            prebuilt
          </button>
          <button
            type="button"
            :class="{ 'is-active': cssMode === 'tailwind4' }"
            @click="cssMode = 'tailwind4'"
          >
            tailwind4
          </button>
        </div>
        <p class="prebuilt-page__hint">当前 cssMode：{{ cssMode }}</p>
      </section>

      <section class="prebuilt-page__case">
        <h3>列对齐（header / body / summary）</h3>
        <p>
          <code>align: 'center' | 'right'</code> 在 prebuilt 模式下应输出
          <code>vtg-text-center</code> / <code>vtg-text-right</code>，表头、表体与汇总行同时生效。
        </p>
        <VTable
          row-key="key"
          :columns="alignColumns"
          :data-source="dataSource"
          :scroll="{ y: 220 }"
          size="middle"
        >
          <template #summary>
            <VTableSummary fixed="bottom">
              <VTableSummary.Row>
                <VTableSummary.Cell :index="0">合计</VTableSummary.Cell>
                <VTableSummary.Cell :index="1" align="center">
                  {{ activeCount }} 项 active
                </VTableSummary.Cell>
                <VTableSummary.Cell :index="2" align="right">
                  {{ totalCount }}
                </VTableSummary.Cell>
              </VTableSummary.Row>
            </VTableSummary>
          </template>
        </VTable>
      </section>

      <section class="prebuilt-page__case">
        <h3>固定列 + 无 scroll.x</h3>
        <p>
          未声明 <code>scroll.x</code> 时表格恒定 100% 宽（与 ant-design-vue 一致）：表格撑满容器、
          左右固定列贴住容器边缘、未声明宽度的列分享剩余空间，而不是按 max-content 收缩。
        </p>
        <VTable
          row-key="key"
          :columns="fixedColumns"
          :data-source="dataSource"
          bordered
          size="middle"
        >
          <template #bodyCell="{ column }">
            <template v-if="column.key === 'action'">
              <button class="prebuilt-page__action" type="button">编辑</button>
            </template>
          </template>
        </VTable>
      </section>
    </div>
  </VTableGuildConfigProvider>
</template>

<style scoped>
.prebuilt-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 8px 4px 40px;
}

.prebuilt-page__intro {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prebuilt-page__intro h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.prebuilt-page__intro p {
  max-width: 720px;
  margin: 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--vtg-table-text-color, #4b5563);
}

.prebuilt-page__hint {
  font-weight: 500;
}

.prebuilt-page__switch {
  display: inline-flex;
  gap: 8px;
  width: fit-content;
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.prebuilt-page__switch button {
  padding: 4px 14px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
}

.prebuilt-page__switch button.is-active {
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
}

.prebuilt-page__case {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prebuilt-page__case h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.prebuilt-page__case p {
  max-width: 720px;
  margin: 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--vtg-table-text-color, #4b5563);
}

.prebuilt-page__action {
  padding: 2px 10px;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
  background: transparent;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.prebuilt-page__action:hover {
  color: #0958d9;
  border-color: #1677ff;
}
</style>
