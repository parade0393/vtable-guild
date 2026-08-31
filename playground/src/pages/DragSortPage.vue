<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { VTable } from '@vtable-guild/vtable-guild'
import type { ColumnType, Key, RowDragSortInfo } from '@vtable-guild/vtable-guild'
import { dataSource, type DemoRow } from '../filterMatrixShared'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')

const manageColumns: ColumnType<DemoRow>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 110, align: 'right' },
  { title: 'City', dataIndex: 'city', key: 'city', width: 130 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 110 },
]

// ---- 01 列显示（visible 受控）----
const hiddenKeys = ref<string[]>([])

const visibilityColumns = computed<ColumnType<DemoRow>[]>(() =>
  manageColumns.map((column) => ({
    ...column,
    visible: !hiddenKeys.value.includes(String(column.key)),
  })),
)

function toggleColumn(key: string) {
  hiddenKeys.value = hiddenKeys.value.includes(key)
    ? hiddenKeys.value.filter((item) => item !== key)
    : [...hiddenKeys.value, key]
}

// ---- 02 列顺序（columnOrder 受控）----
const columnOrder = ref<Key[]>(['name', 'score', 'city', 'status'])

function moveColumn(key: Key, offset: -1 | 1) {
  const order = [...columnOrder.value]
  const from = order.indexOf(key)
  const to = from + offset
  if (from < 0 || to < 0 || to >= order.length) return
  ;[order[from], order[to]] = [order[to], order[from]]
  columnOrder.value = order
}

// ---- 03 行拖拽排序（rowDraggable + rowDragEnd 受控）----
const dragColumns: ColumnType<DemoRow>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  { title: 'City', dataIndex: 'city', key: 'city', width: 130 },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 130 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const dragData = ref<DemoRow[]>(dataSource.map((row) => ({ ...row })))
const lastDrag = ref('（按住任意一行上下拖动）')

function handleRowDragEnd(newData: DemoRow[], info: RowDragSortInfo) {
  dragData.value = newData
  const dragged = newData.find((row) => String(row.key) === String(info.draggedKey))
  const target = newData.find((row) => String(row.key) === String(info.targetKey))
  if (dragged && target) {
    lastDrag.value = `${dragged.name} → ${target.name} ${info.orderedKeys.length} rows`
  }
}

// ---- 04 树形拖拽（跨父移动）----
interface TreeRow extends Record<string, unknown> {
  key: string
  name: string
  children?: TreeRow[]
}

const treeDragColumns: ColumnType<TreeRow>[] = [{ title: '组织', dataIndex: 'name', key: 'name' }]

const treeDragData = ref<TreeRow[]>([
  {
    key: 'p1',
    name: '平台组',
    children: [
      { key: 'c1', name: '前端组' },
      { key: 'c2', name: '后端组' },
    ],
  },
  {
    key: 'p2',
    name: '中台组',
    children: [{ key: 'd1', name: '数据组' }],
  },
  { key: 'p3', name: '职能组' },
])
const lastTreeDrag = ref('（把子行拖到其他父的子行旁边 = 跨父移动）')

function handleTreeDragEnd(newData: TreeRow[], info: RowDragSortInfo) {
  treeDragData.value = newData
  lastTreeDrag.value = `${info.draggedKey} → ${info.targetKey}（${info.orderedKeys.length} 顶层行）`
}

// ---- 05 行级退出（customRow draggable: false）----
const pinnedDragData = ref<DemoRow[]>(dataSource.map((row) => ({ ...row })))
const pinnedName = String(pinnedDragData.value[0]?.name ?? '首行')

function pinnedCustomRow(record: DemoRow): Record<string, unknown> {
  // 置顶行不可拖起、也不会成为放置目标，其余行照常排序
  return { draggable: String(record.key) !== String(pinnedDragData.value[0]?.key ?? '') }
}

const lastPinnedDrag = ref(`（除「${pinnedName}」外均可拖动）`)

function handlePinnedDragEnd(newData: DemoRow[], info: RowDragSortInfo) {
  pinnedDragData.value = newData
  const draggedIndex = newData.findIndex((row) => String(row.key) === String(info.draggedKey))
  if (draggedIndex >= 0) {
    lastPinnedDrag.value = `${newData[draggedIndex].name} 现在在第 ${draggedIndex + 1} 行`
  }
}
</script>

<template>
  <div class="play-page">
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">01</p>
          <h2>列显示 visible</h2>
        </div>
        <p class="play-case__desc">
          验证点：visible: false 的列从表头/表体移除，恢复后排序/筛选状态保留。
        </p>
      </header>
      <div class="play-toolbar">
        <button
          v-for="column in manageColumns"
          :key="column.key"
          type="button"
          class="play-ghost-button"
          :style="
            hiddenKeys.includes(String(column.key))
              ? { opacity: 0.45, textDecoration: 'line-through' }
              : undefined
          "
          @click="toggleColumn(String(column.key))"
        >
          {{ column.title }}
        </button>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
            </div>
            <p>无内建列显示，需自行拼装 hiddenColumns</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">Preset verification</p>
            <h3>column.visible</h3>
            <p>点上方按钮切换列显隐，观察表头、表体、ColGroup 与固定列度量是否同步。</p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>visible（受控）</p>
          </div>
          <VTable
            :columns="visibilityColumns as any"
            :data-source="dataSource"
            row-key="key"
            bordered
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">02</p>
          <h2>列顺序 columnOrder</h2>
        </div>
        <p class="play-case__desc">验证点：order 数组重排、未匹配列保持原序、选择列固定行首。</p>
      </header>
      <div class="play-toolbar">
        <template v-for="key in columnOrder" :key="key">
          <button type="button" class="play-ghost-button" @click="moveColumn(key, -1)">‹</button>
          <span class="play-icon-chip">{{ key }}</span>
          <button type="button" class="play-ghost-button" @click="moveColumn(key, 1)">›</button>
        </template>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
            </div>
            <p>无内建 columnOrder</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">Preset verification</p>
            <h3>columnOrder</h3>
            <p>用 ‹ › 调整顺序，再开启 rowSelection 验证选择列是否固定行首。</p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>columnOrder = [{{ columnOrder.join(', ') }}]</p>
          </div>
          <VTable
            :columns="manageColumns as any"
            :data-source="dataSource"
            :column-order="columnOrder"
            row-key="key"
            :row-selection="{ type: 'checkbox' }"
            bordered
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">03</p>
          <h2>行拖拽排序</h2>
        </div>
        <p class="play-case__desc">
          验证点：整行可拖拽、放置指示线、拖拽结束 rowDragEnd 返回新数组。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
            </div>
            <p>需自接 dnd 库，无内建行拖拽</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">Preset verification</p>
            <h3>rowDraggable</h3>
            <p>
              原生 HTML5
              拖放：拖到目标行上半部分插入其上方，下半部分插入其下方。顺序未变化时不触发事件。
            </p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>rowDragEnd：{{ lastDrag }}</p>
          </div>
          <VTable
            :columns="dragColumns as any"
            :data-source="dragData"
            row-key="key"
            row-draggable
            bordered
            @row-drag-end="handleRowDragEnd"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">04</p>
          <h2>树形数据拖拽（跨父移动）</h2>
        </div>
        <p class="play-case__desc">
          验证点：拖到目标行前/后插入其同级位置（可换父），父行携带整棵子树，拖进自身子树无效。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>语义说明</h3>
            </div>
            <p>before / after = 目标行的同级位置</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">Cross-parent move</p>
            <h3>跨父移动</h3>
            <p>
              「前端组」拖到「数据组」旁边 → 变成「中台组」的子节点；「中台组」拖到「数据组」旁边 →
              连同子树整个变成「平台组」的子节点；把「平台组」拖回它自己的子行旁边 →
              环防护生效，不触发事件。
            </p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>rowDragEnd：{{ lastTreeDrag }}</p>
          </div>
          <VTable
            :columns="treeDragColumns as any"
            :data-source="treeDragData"
            row-key="key"
            row-draggable
            default-expand-all-rows
            bordered
            @row-drag-end="handleTreeDragEnd"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">05</p>
          <h2>行级退出</h2>
        </div>
        <p class="play-case__desc">
          验证点：customRow 返回 draggable: false 的行不可拖起、也不作为放置目标。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>语义说明</h3>
            </div>
            <p>customRow: () =&gt; ({ draggable: false })</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">Row-level opt-out</p>
            <h3>锁定「{{ pinnedName }}」</h3>
            <p>
              「{{ pinnedName }}」通过 customRow 返回 draggable: false
              退出拖拽：拖不起、也不会成为放置目标（悬停无指示线）；其余行照常拖拽排序。
            </p>
          </div>
        </article>
        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>rowDragEnd：{{ lastPinnedDrag }}</p>
          </div>
          <VTable
            :columns="dragColumns as any"
            :data-source="pinnedDragData"
            row-key="key"
            row-draggable
            :custom-row="pinnedCustomRow"
            bordered
            @row-drag-end="handlePinnedDragEnd"
          />
        </article>
      </div>
    </section>
  </div>
</template>
