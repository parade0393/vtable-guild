<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType, RowSelection, SelectionItem } from '@vtable-guild/table'
import { dataSource, type DemoRow } from '../filterMatrixShared'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')

const selectionColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 170 },
  { title: 'City', dataIndex: 'city', key: 'city', width: 140 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const controlledKeys = ref<(string | number)[]>([1, 3])
const dropdownKeys = ref<(string | number)[]>([])
const customKeys = ref<(string | number)[]>([])
const richKeys = ref<(string | number)[]>([2, 5])
const rangeActionText = ref('未触发 shift 批量选择')
const preserveKeys = ref<(string | number)[]>([1, 6])
const preserveCompact = ref(false)

function isDisabled(record: DemoRow) {
  return record.name === 'Ren Moss'
}

const antCheckboxSelection = {
  type: 'checkbox' as const,
  getCheckboxProps: (record: DemoRow) => ({
    disabled: isDisabled(record),
  }),
}

const vtableCheckboxSelection: RowSelection<DemoRow> = {
  type: 'checkbox',
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
}

const antRadioSelection = {
  type: 'radio' as const,
}

const vtableRadioSelection: RowSelection<DemoRow> = {
  type: 'radio',
}

const antControlledSelection = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: controlledKeys.value,
  onChange: (keys: (string | number)[]) => {
    controlledKeys.value = [...keys]
  },
  getCheckboxProps: (record: DemoRow) => ({
    disabled: isDisabled(record),
  }),
}))

const vtableControlledSelection = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: controlledKeys.value,
  onChange: (keys) => {
    controlledKeys.value = [...keys]
  },
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
}))

const customSelectionItems: SelectionItem[] = [
  {
    key: 'engineers',
    text: '选择工程团队',
    onSelect: (changeableRowKeys) => {
      customKeys.value = dataSource
        .filter((row) => row.role.includes('Engineer'))
        .map((row) => row.key)
        .filter((key) => changeableRowKeys.includes(key))
    },
  },
  {
    key: 'north',
    text: '选择 North 区域',
    onSelect: (changeableRowKeys) => {
      customKeys.value = dataSource
        .filter((row) => row.region === 'North')
        .map((row) => row.key)
        .filter((key) => changeableRowKeys.includes(key))
    },
  },
  {
    key: 'clear',
    text: '清空',
    onSelect: () => {
      customKeys.value = []
    },
  },
]

const antDefaultSelections = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: dropdownKeys.value,
  onChange: (keys: (string | number)[]) => {
    dropdownKeys.value = [...keys]
  },
  selections: true,
  getCheckboxProps: (record: DemoRow) => ({
    disabled: isDisabled(record),
  }),
}))

const vtableDefaultSelections = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: dropdownKeys.value,
  onChange: (keys) => {
    dropdownKeys.value = [...keys]
  },
  selections: true,
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
}))

const antCustomSelections = computed(() => ({
  type: 'checkbox' as const,
  selectedRowKeys: customKeys.value,
  onChange: (keys: (string | number)[]) => {
    customKeys.value = [...keys]
  },
  selections: customSelectionItems,
  getCheckboxProps: (record: DemoRow) => ({
    disabled: isDisabled(record),
  }),
}))

const vtableCustomSelections = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: customKeys.value,
  onChange: (keys) => {
    customKeys.value = [...keys]
  },
  selections: customSelectionItems,
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
}))

const vtableHiddenSelection: RowSelection<DemoRow> = {
  type: 'checkbox',
  hideSelectAll: true,
  columnWidth: 72,
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
}

const richSelection = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: richKeys.value,
  fixed: true,
  columnTitle: '成员',
  onChange: (keys) => {
    richKeys.value = [...keys]
  },
  onSelectMultiple: (selected, _selectedRows, changeRows) => {
    rangeActionText.value = `${selected ? '批量选中' : '批量取消'}: ${
      changeRows.map((row) => row.name).join(' / ') || '(无变化)'
    }`
  },
  getCheckboxProps: (record) => ({
    disabled: isDisabled(record as DemoRow),
  }),
  renderCell: (checked, record, _index, originNode) =>
    h('span', { class: 'inline-flex items-center gap-2' }, [
      originNode,
      h(
        'span',
        {
          class: [
            'inline-flex min-w-[72px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
            checked
              ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
              : 'border-[color:var(--color-border)] text-[color:var(--color-text-secondary)]',
          ],
        },
        checked ? 'selected' : String((record as DemoRow).team),
      ),
    ]),
}))

const defaultSelectedSelection: RowSelection<DemoRow> = {
  type: 'checkbox',
  defaultSelectedRowKeys: [2, 6],
  columnTitle: 'Preset',
}

const preserveSelectionData = computed(() =>
  preserveCompact.value ? dataSource.slice(0, 4) : dataSource,
)

const preserveSelection = computed<RowSelection<DemoRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: preserveKeys.value,
  preserveSelectedRowKeys: true,
  columnTitle: 'Keep keys',
  onChange: (keys) => {
    preserveKeys.value = [...keys]
  },
}))
</script>

<template>
  <AConfigProvider :locale="playground.antLocale.value as any">
    <main class="play-page">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Selection Playground</p>
          <h1>行选择能力拆分验证</h1>
          <p class="play-summary">
            这一页专门覆盖 checkbox、radio、受控 selectedRowKeys，以及之前未单独验证的 selections
            自定义选择菜单、hideSelectAll 与 columnWidth。
          </p>
        </div>
      </section>

      <section class="play-metrics">
        <article class="play-metric-card">
          <span class="play-metric-card__label">Route focus</span>
          <strong>rowSelection 全链路</strong>
          <p>把选择列头部状态、菜单行为和受控同步从筛选页里剥离出来。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">New coverage</span>
          <strong>advanced rowSelection APIs</strong>
          <p>
            补齐 selections 之外的 columnTitle、renderCell、defaultSelectedRowKeys 和
            preserveSelectedRowKeys。
          </p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Preset</span>
          <strong>{{ isAntdv ? 'ant-design-vue 对照' : 'element-plus preset 验证' }}</strong>
          <p>element-plus 下保留必要说明卡，重点看右侧 VTable 的统一 API。</p>
        </article>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">01</p>
            <h2>Checkbox 行选择</h2>
          </div>
          <p class="play-case__desc">验证点：全选/半选态、禁用行、取消全选。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'rowSelection checkbox' : 'checkbox 是原生可对齐，其他放说明卡' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="antCheckboxSelection as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Native coverage</p>
              <h3>element-plus</h3>
              <p>多选原生能做，但这一页更关心统一的 rowSelection API，而不是再写一套独立实现。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>rowSelection checkbox</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableCheckboxSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">02</p>
            <h2>Radio 单选</h2>
          </div>
          <p class="play-case__desc">验证点：单选切换、表头无全选框。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'rowSelection radio' : 'element-plus 无同构 API' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="antRadioSelection as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">No native parity</p>
              <h3>element-plus</h3>
              <p>官方表格没有与 rowSelection radio 完全对位的单选列 API。</p>
              <p>这里保留说明卡，避免把 current-row 或手写 radio 列误判为原生能力。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>rowSelection radio</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableRadioSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">03</p>
            <h2>受控 Checkbox 选择</h2>
          </div>
          <p class="play-case__desc">验证点：selectedRowKeys 双向同步、禁用行。</p>
        </header>
        <p class="play-inline-note">
          两侧共享 controlledKeys = [{{ controlledKeys.join(', ') }}]。
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'controlled rowSelection' : '受控选择重点看右侧统一 API' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="antControlledSelection as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>受控选中集合在这里直接验证 VTable 是否稳定同步外部状态。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>selectedRowKeys</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableControlledSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">04</p>
            <h2>默认选择菜单</h2>
          </div>
          <p class="play-case__desc">验证点：表头下拉菜单、全选/反选/清空默认项。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'selections: true' : 'element-plus 无原生表头选择菜单' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="antDefaultSelections as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">No native parity</p>
              <h3>element-plus</h3>
              <p>原生没有和 rowSelection.selections 对位的 header dropdown 能力。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>selections = true</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableDefaultSelections as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">05</p>
            <h2>自定义选择菜单</h2>
          </div>
          <p class="play-case__desc">验证点：自定义 selections 项回调是否能批量更新行选择。</p>
        </header>
        <p class="play-inline-note">当前 customKeys = [{{ customKeys.join(', ') || 'none' }}]</p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? '自定义 selections[]' : '重点验证右侧 API 行为' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="antCustomSelections as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">No native parity</p>
              <h3>element-plus</h3>
              <p>
                没有对应的 header selection dropdown，自定义菜单项在这里直接由 VTable 统一提供。
              </p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>selections = SelectionItem[]</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableCustomSelections as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">06</p>
            <h2>hideSelectAll / columnWidth</h2>
          </div>
          <p class="play-case__desc">验证点：表头全选入口隐藏，以及选择列宽度调整。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>native note</h3>
              </div>
              <p>组合型 API，重点看右侧</p>
            </div>
            <div class="play-note-card">
              <p class="play-note-card__eyebrow">Implemented API</p>
              <h3>Why separate</h3>
              <p>这组能力集中在选择列表头和列宽控制，单独验证能更快发现 header 对齐问题。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>hideSelectAll + columnWidth</p>
            </div>
            <VTable
              bordered
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="vtableHiddenSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">07</p>
            <h2>columnTitle / renderCell / fixed / onSelectMultiple</h2>
          </div>
          <p class="play-case__desc">
            验证点：选择列标题、单元格自定义渲染、固定在左侧，以及按住 Shift 的范围选择回调。
          </p>
        </header>
        <p class="play-inline-note">
          richKeys = [{{ richKeys.join(', ') || 'none' }}]，{{ rangeActionText }}
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'rowSelection advanced config' : '右侧统一 API 是验证重点' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="richSelection as any"
              :scroll="{ x: 760 }"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>
                这组验证的是统一的 antd 风格 rowSelection 高级 API，不再把原生 selection column
                拼到同一个语义层里。
              </p>
              <p>试一下按住 Shift 点击多行，右侧会更新批量选择回调文案。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>columnTitle + renderCell + fixed</p>
            </div>
            <VTable
              bordered
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="richSelection as any"
              :scroll="{ x: 760 }"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">08</p>
            <h2>defaultSelectedRowKeys</h2>
          </div>
          <p class="play-case__desc">验证点：初次渲染时内部选中集合是否按默认值建立。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'defaultSelectedRowKeys' : '右侧统一 API 更值得验证' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="defaultSelectedSelection as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>这里主要回归默认选中是否只在首次挂载时生效，而不是把它当成受控配置。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>defaultSelectedRowKeys = [2, 6]</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="dataSource"
              :row-selection="defaultSelectedSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">09</p>
            <h2>preserveSelectedRowKeys</h2>
          </div>
          <p class="play-case__desc">
            验证点：数据源缩短后，当前页面消失的 key 仍然保留在 selectedRowKeys 里。
          </p>
        </header>
        <div class="play-toolbar">
          <button type="button" class="play-ghost-button" @click="preserveCompact = false">
            Full data
          </button>
          <button type="button" class="play-ghost-button" @click="preserveCompact = true">
            Compact data
          </button>
        </div>
        <p class="play-inline-note">
          preserveKeys = [{{ preserveKeys.join(', ') || 'none' }}]， current rows =
          {{ preserveSelectionData.length }}
        </p>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'preserveSelectedRowKeys' : '右侧统一 API 更值得验证' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="selectionColumns as any"
              :data-source="preserveSelectionData"
              :row-selection="preserveSelection as any"
              row-key="key"
              :pagination="false"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">State continuity</p>
              <h3>element-plus</h3>
              <p>切换数据规模后，右侧不会因为当前列表里缺失对应行就把已有选中 key 清掉。</p>
            </div>
          </article>
          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>preserveSelectedRowKeys</p>
            </div>
            <VTable
              :columns="selectionColumns as any"
              :data-source="preserveSelectionData"
              :row-selection="preserveSelection as any"
              row-key="key"
            />
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
