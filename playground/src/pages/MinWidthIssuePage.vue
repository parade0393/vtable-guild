<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Table as ATable, version as antdVersion } from 'ant-design-vue'
import { ElTable, ElTableColumn, version as elementVersion } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable, VTableGuildConfigProvider } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style'
import { version as vtgVersion } from '../../../packages/vtable-guild/package.json'
import PlaygroundPresetScope from '../components/PlaygroundPresetScope.vue'
import MinWidthProbe from '../components/MinWidthProbe.vue'

interface ScoreRow {
  key: string
  name: string
  team: string
  score: number
  reviews: number
}

type Scenario = 'min-only' | 'width-and-min' | 'resize'
type Library = 'antdv' | 'element-plus' | 'vtg-antdv' | 'vtg-element-plus'

const rows: ScoreRow[] = [
  { key: '1', name: '陈嘉', team: '平台', score: 92, reviews: 18 },
  { key: '2', name: '林悦', team: '交易', score: 88, reviews: 31 },
  { key: '3', name: '周野', team: '平台', score: 95, reviews: 12 },
  { key: '4', name: '苏晚', team: '设计系统', score: 88, reviews: 24 },
  { key: '5', name: '何川', team: '交易', score: 79, reviews: 27 },
]
const containerWidth = ref(640)
const minWidth = ref(200)
const scenario = ref<Scenario>('min-only')
const layout = ref<'default' | 'auto' | 'fixed'>('default')
const cssMode = ref<'tailwind4' | 'prebuilt'>('tailwind4')
const generation = ref(0)
const draggedWidths = reactive<Partial<Record<Library, number>>>({})
const resizeEvents = reactive<Partial<Record<Library, string>>>({})
const tableLayout = computed(() => (layout.value === 'default' ? undefined : layout.value))
const isResizable = computed(() => scenario.value === 'resize')

function nameWidth(library: Library) {
  return scenario.value === 'min-only' ? undefined : (draggedWidths[library] ?? minWidth.value + 80)
}

function columns(library: Library) {
  const native = library === 'antdv'
  return [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      minWidth: minWidth.value,
      width: nameWidth(library),
      resizable: isResizable.value,
      sorter: native ? (a: ScoreRow, b: ScoreRow) => a.name.localeCompare(b.name) : true,
    },
    {
      title: '团队',
      dataIndex: 'team',
      key: 'team',
      sorter: native
        ? { multiple: 2, compare: (a: ScoreRow, b: ScoreRow) => a.team.localeCompare(b.team) }
        : { multiple: 2 },
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      align: 'right' as const,
      sorter: native
        ? { multiple: 1, compare: (a: ScoreRow, b: ScoreRow) => a.score - b.score }
        : { multiple: 1 },
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '评审数',
      dataIndex: 'reviews',
      key: 'reviews',
      align: 'right' as const,
      sorter: (a: ScoreRow, b: ScoreRow) => a.reviews - b.reviews,
    },
  ]
}

const antColumns = computed(() => columns('antdv'))
const vtgColumns = computed(() => ({
  antdv: columns('vtg-antdv'),
  'element-plus': columns('vtg-element-plus'),
}))

function recordResize(library: Library, width: number) {
  draggedWidths[library] = width
  resizeEvents[library] = `最近一次拖拽事件：${width.toFixed(1)}px（组件回调值，非 DOM 列宽）`
}

function resetTables() {
  for (const key of Object.keys(draggedWidths) as Library[]) delete draggedWidths[key]
  for (const key of Object.keys(resizeEvents) as Library[]) delete resizeEvents[key]
  generation.value++
}

watch([scenario, minWidth, layout, cssMode], resetTables)

function restoreIssue() {
  containerWidth.value = 640
  minWidth.value = 200
  scenario.value = 'min-only'
  layout.value = 'default'
  cssMode.value = 'tailwind4'
  resetTables()
}

const configText = computed(() =>
  JSON.stringify(
    {
      nameColumn: {
        minWidth: minWidth.value,
        ...(scenario.value !== 'min-only' ? { width: minWidth.value + 80 } : {}),
        ...(isResizable.value ? { resizable: true } : {}),
      },
      tableLayout: tableLayout.value ?? '(未传，各库默认)',
      scroll: '(未传)',
      ellipsis: '(未传)',
    },
    null,
    2,
  ),
)
</script>

<template>
  <main class="min-width-issue">
    <header>
      <RouterLink to="/basic">← 返回 playground</RouterLink>
      <h1>Issue #49 · minWidth 语义对照</h1>
      <p>
        <a
          href="https://github.com/parade0393/vtable-guild/issues/49"
          target="_blank"
          rel="noreferrer"
          >原始 issue</a
        >
        正文写 120，复现代码实际设置
        200。下方复用原始四列、五条数据与排序配置；不注入任何列宽修复样式。
      </p>
      <p>
        antdv {{ antdVersion }} · Element Plus {{ elementVersion }} · vtable-guild
        {{ vtgVersion }}（本地 workspace 构建）。两种 VTG 主题同时展示，彼此独立。
      </p>
    </header>

    <section class="min-width-controls" aria-label="复现参数">
      <label>
        案例
        <select v-model="scenario" aria-label="案例">
          <option value="min-only">原始复现：只设 minWidth</option>
          <option value="width-and-min">width + minWidth（不启用拖拽）</option>
          <option value="resize">width + minWidth + 拖拽</option>
        </select>
      </label>
      <label>
        姓名列 minWidth
        <select v-model.number="minWidth" aria-label="姓名列 minWidth">
          <option :value="120">120px（issue 正文）</option>
          <option :value="200">200px（复现代码）</option>
          <option :value="300">300px</option>
        </select>
      </label>
      <label>
        tableLayout
        <select v-model="layout" aria-label="tableLayout">
          <option value="default">各库默认（不传）</option>
          <option value="auto">auto</option>
          <option value="fixed">fixed</option>
        </select>
      </label>
      <label>
        VTG 样式模式
        <select v-model="cssMode" aria-label="VTG 样式模式">
          <option value="tailwind4">Tailwind 4（playground 默认）</option>
          <option value="prebuilt">Prebuilt（对照）</option>
        </select>
      </label>
      <label class="min-width-controls__range">
        每张表的目标容器宽度：{{ containerWidth }}px
        <input
          v-model.number="containerWidth"
          aria-label="容器宽度"
          type="range"
          min="160"
          max="900"
          step="10"
        />
      </label>
      <div class="min-width-controls__buttons">
        <button
          v-for="width in [640, 400, 280, 200]"
          :key="width"
          type="button"
          @click="containerWidth = width"
        >
          {{ width }}px
        </button>
        <button type="button" @click="resetTables">重置排序 / 拖拽</button>
        <button type="button" @click="restoreIssue">恢复原始案例</button>
      </div>
    </section>

    <details class="min-width-notes">
      <summary>如何读这个实验 / 当前传参</summary>
      <ul>
        <li>
          先选 200px
          容器，再对比姓名列的实测宽度；也可直接缩小浏览器窗口。空间不够时容器取可用宽度，读数以“实际容器”为准。
        </li>
        <li>
          虚线是实验容器边界，外层只提供溢出滚动。读数来自
          getBoundingClientRect，包含单元格内边距和边框；“低于”不是自动判定 bug。
        </li>
        <li>
          各库默认布局不一定相同；选择 auto / fixed 可固定同一布局再比。没有配置 scroll.x 或
          ellipsis。
        </li>
        <li>
          width 案例初始值 = minWidth + 80。拖拽案例请拖动“姓名”表头右边缘；antd 和 VTG
          各自回写各自的 width，互不同步。Element Plus 开启 border
          以使用原生拖拽，不添加自定义下限。
        </li>
        <li>
          排序为保持原始表头结构而保留。原生 antdv 补充本地 comparator；Element Plus
          使用原生单列排序，不模拟 VTG 多列排序。
        </li>
        <li>
          本页宿主是 Tailwind 4；Prebuilt 只是样式模式对照，不是隔离的 Tailwind 3
          环境。不能仅凭本页声称完整复现了 issue 的 Tailwind 3 构建环境。
        </li>
      </ul>
      <pre>{{ configText }}</pre>
    </details>

    <div class="min-width-grid">
      <MinWidthProbe
        title="原生 ant-design-vue"
        :container-width="containerWidth"
        :min-width="minWidth"
        data-probe="antdv"
      >
        <template #note>minWidth 文档定义为拖动列最小宽度；没有设置 scroll.x。</template>
        <ATable
          :key="generation"
          :columns="antColumns"
          :data-source="rows"
          row-key="key"
          :pagination="false"
          :table-layout="tableLayout"
          :bordered="isResizable"
          @resize-column="(width: number) => recordResize('antdv', width)"
        />
        <template #event
          ><p>{{ resizeEvents.antdv ?? '尚无拖拽事件' }}</p></template
        >
      </MinWidthProbe>

      <MinWidthProbe
        title="vtable-guild · antdv 主题"
        :container-width="containerWidth"
        :min-width="minWidth"
        data-probe="vtg-antdv"
      >
        <template #note>与左侧使用相同的 minWidth / width 参数，保持库现有行为。</template>
        <VTableGuildConfigProvider :css-mode="cssMode">
          <PlaygroundPresetScope preset="antdv">
            <VTable
              :key="generation"
              :columns="vtgColumns.antdv"
              :data-source="rows"
              row-key="key"
              :table-layout="tableLayout"
              :bordered="isResizable"
              @resize-column="(_column, width) => recordResize('vtg-antdv', width)"
            />
          </PlaygroundPresetScope>
        </VTableGuildConfigProvider>
        <template #event
          ><p>{{ resizeEvents['vtg-antdv'] ?? '尚无拖拽事件' }}</p></template
        >
      </MinWidthProbe>

      <MinWidthProbe
        title="原生 Element Plus"
        :container-width="containerWidth"
        :min-width="minWidth"
        data-probe="element-plus"
      >
        <template #note
          >使用原生 min-width；其余列不设宽度，保留 Element Plus 默认分配规则。</template
        >
        <ElTable
          :key="generation"
          :data="rows"
          row-key="key"
          :table-layout="tableLayout"
          :border="isResizable"
          :default-sort="{ prop: 'score', order: 'descending' }"
          style="width: 100%"
          @header-dragend="(width: number) => recordResize('element-plus', width)"
        >
          <ElTableColumn
            prop="name"
            label="姓名"
            sortable
            :min-width="minWidth"
            :width="nameWidth('element-plus')"
            :resizable="isResizable"
          />
          <ElTableColumn prop="team" label="团队" sortable :resizable="false" />
          <ElTableColumn prop="score" label="评分" sortable align="right" :resizable="false" />
          <ElTableColumn prop="reviews" label="评审数" sortable align="right" :resizable="false" />
        </ElTable>
        <template #event
          ><p>{{ resizeEvents['element-plus'] ?? '尚无拖拽事件' }}</p></template
        >
      </MinWidthProbe>

      <MinWidthProbe
        title="vtable-guild · element-plus 主题"
        :container-width="containerWidth"
        :min-width="minWidth"
        data-probe="vtg-element-plus"
      >
        <template #note>issue 指定的主题。主题切换只改变外观，不替换列宽布局算法。</template>
        <VTableGuildConfigProvider :css-mode="cssMode">
          <PlaygroundPresetScope preset="element-plus">
            <VTable
              :key="generation"
              :columns="vtgColumns['element-plus']"
              :data-source="rows"
              row-key="key"
              :table-layout="tableLayout"
              :bordered="isResizable"
              @resize-column="(_column, width) => recordResize('vtg-element-plus', width)"
            />
          </PlaygroundPresetScope>
        </VTableGuildConfigProvider>
        <template #event
          ><p>{{ resizeEvents['vtg-element-plus'] ?? '尚无拖拽事件' }}</p></template
        >
      </MinWidthProbe>
    </div>

    <section class="min-width-notes">
      <h2>用于决策的 API 边界（不是修复方案）</h2>
      <p>
        antdv / VTG 把 minWidth 定义为拖拽边界；Element Plus 把 min-width
        用于弹性列的宽度分配。样式主题相似，不代表同名参数的行为完全等价。
      </p>
      <p>
        可据此判断：只澄清现有 API，还是另外设计“布局最小列宽”能力。这个 demo
        没有替你修改语义，也没有加入候选补丁。
      </p>
      <p>
        参考：
        <a
          href="https://github.com/vueComponent/ant-design-vue/blob/4.2.6/components/table/index.zh-CN.md#column"
          target="_blank"
          rel="noreferrer"
          >antdv 4.2.6 Column 文档</a
        >
        ·
        <a
          href="https://element-plus.org/zh-CN/component/table.html#table-column-api"
          target="_blank"
          rel="noreferrer"
          >Element Plus TableColumn 文档</a
        >
        · VTG <code>packages/table/src/types/column.ts</code> / <code>useResize.ts</code>
      </p>
    </section>
  </main>
</template>

<style scoped>
.min-width-issue {
  display: grid;
  gap: 18px;
}

.min-width-issue h1 {
  margin: 0 0 10px;
  font-size: 26px;
}

.min-width-issue p {
  margin: 6px 0;
}

.min-width-issue a {
  color: #0969b5;
  text-decoration: underline;
}

.min-width-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--play-line);
  border-radius: 16px;
  background: var(--play-panel);
}

.min-width-controls label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.min-width-controls select,
.min-width-controls button {
  padding: 6px 10px;
  border: 1px solid var(--play-line);
  border-radius: 6px;
  background: white;
}

.min-width-controls__range {
  flex: 1 1 240px;
}

.min-width-controls__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: end;
}

.min-width-controls button,
.min-width-notes summary {
  cursor: pointer;
}

.min-width-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.min-width-notes {
  padding: 14px 18px;
  border: 1px solid var(--play-line);
  border-radius: 12px;
  background: var(--play-panel);
  font-size: 14px;
  line-height: 1.7;
}

.min-width-notes ul {
  padding-left: 20px;
  list-style: disc;
}

.min-width-notes pre {
  overflow: auto;
  margin-top: 12px;
}

@media (width <= 760px) {
  .min-width-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
