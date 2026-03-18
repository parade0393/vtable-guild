<script setup lang="ts">
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import {
  dataSource,
  isSelected,
  teamFilters,
  toggleKeys,
  useFilterMatrixState,
} from '../filterMatrixShared'

defineProps<{
  locale: Record<string, unknown>
}>()

const state = useFilterMatrixState()
</script>

<template>
  <AConfigProvider :locale="locale">
    <main class="play-page">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Filter Matrix Playground</p>
          <h1>ant-design-vue 筛选 API 全量对照</h1>
          <p class="play-summary">
            全部测试案例改为筛选功能点。每个案例都保留可排序列，专门观察筛选图标、下拉层与排序控件在同一表头中的共存
            UI。
          </p>
        </div>
      </section>

      <section class="play-metrics">
        <article class="play-metric-card">
          <span class="play-metric-card__label">Case count</span>
          <strong>12</strong>
          <p>筛选 API 每个功能点一个案例。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Parity</span>
          <strong>12 / 12 real native parity</strong>
          <p>ant-design-vue 可做完整高级筛选对照。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Focus</span>
          <strong>Sort + Filter header UI</strong>
          <p>优先核对表头图标位置、激活态、下拉偏移与排序箭头并存布局。</p>
        </article>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">01</p>
            <h2>基础多选筛选</h2>
          </div>
          <p class="play-case__desc">验证点：多选选中态、筛选图标位置、同列表头排序箭头共存。</p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antMultiColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="(...args: unknown[]) => state.onReferenceChange('ATable multi', ...args)"
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>真实验证目标</p>
            </div>
            <VTable
              :columns="state.vtableMultiColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">02</p>
            <h2>单选筛选</h2>
          </div>
          <p class="play-case__desc">
            验证点：单选行为、面板选中反馈、筛选与排序共存时的表头密度。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antSingleColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="(...args: unknown[]) => state.onReferenceChange('ATable single', ...args)"
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filterMultiple: false`</p>
            </div>
            <VTable
              :columns="state.vtableSingleColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">03</p>
            <h2>受控筛选值</h2>
          </div>
          <p class="play-case__desc">
            验证点：外部状态切换、筛选高亮同步、手动交互后受控状态回写。
          </p>
        </header>
        <div class="play-toolbar">
          <button type="button" class="play-ghost-button" @click="state.setControlledTeam([])">
            Clear
          </button>
          <button
            type="button"
            class="play-ghost-button"
            @click="state.setControlledTeam(['Platform'])"
          >
            Platform
          </button>
          <button
            type="button"
            class="play-ghost-button"
            @click="state.setControlledTeam(['Commerce'])"
          >
            Commerce
          </button>
          <button
            type="button"
            class="play-ghost-button"
            @click="state.setControlledTeam(['Platform', 'Design Systems'])"
          >
            Platform + Design Systems
          </button>
        </div>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实受控筛选</p>
            </div>
            <ATable
              :columns="state.antControlledColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="state.onAntControlledChange"
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filteredValue`</p>
            </div>
            <VTable
              :columns="state.vtableControlledColumns"
              :data-source="dataSource"
              @change="state.onVTableControlledChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">04</p>
            <h2>默认筛选与重置回默认</h2>
          </div>
          <p class="play-case__desc">
            验证点：初始筛选命中、Reset 后是否回到默认值而不是完全清空。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antDefaultResetColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable default reset', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`defaultFilteredValue + filterResetToDefaultFilteredValue`</p>
            </div>
            <VTable
              :columns="state.vtableDefaultResetColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">05</p>
            <h2>筛选搜索</h2>
          </div>
          <p class="play-case__desc">
            验证点：长筛选项搜索、面板输入区域样式、与排序箭头的间距关系。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antSearchColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable filter search', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filterSearch`</p>
            </div>
            <VTable
              :columns="state.vtableSearchColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">06</p>
            <h2>树形筛选</h2>
          </div>
          <p class="play-case__desc">
            验证点：树形节点缩进、父子选项呈现、排序控件与树形过滤图标共存。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antTreeColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable tree filter', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filterMode: 'tree'`</p>
            </div>
            <VTable
              :columns="state.vtableTreeColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">07</p>
            <h2>表级自定义筛选图标</h2>
          </div>
          <p class="play-case__desc">
            验证点：图标替换、激活色、同一列排序箭头与自定义图标的排列。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>近似对照：列级 filterIcon</p>
            </div>
            <p class="play-inline-note">
              antdv 没有表级 `customFilterIcon` slot，这里用列级 `filterIcon` 做最接近的 UI 参考。
            </p>
            <ATable
              :columns="state.antTableIconApproxColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable table icon approx', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>table slot `#customFilterIcon`</p>
            </div>
            <VTable
              :columns="state.vtableTableIconColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            >
              <template #customFilterIcon="{ filtered }">
                <span class="play-icon-chip" :class="{ 'is-active': filtered }">slot</span>
              </template>
            </VTable>
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">08</p>
            <h2>列级自定义筛选图标</h2>
          </div>
          <p class="play-case__desc">
            验证点：列级 icon 渲染优先级、激活态、排序与筛选图标宽度分配。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antColumnIconColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable column icon', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`column.filterIcon`</p>
            </div>
            <VTable
              :columns="state.vtableColumnIconColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">09</p>
            <h2>表级自定义筛选下拉</h2>
          </div>
          <p class="play-case__desc">
            验证点：自定义面板结构、按钮排布、操作区与默认表头 UI 的衔接。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>近似对照：列级 filterDropdown</p>
            </div>
            <p class="play-inline-note">
              antdv 使用列级 `filterDropdown`；右侧是 `VTable` 的表级 slot。
            </p>
            <ATable
              :columns="state.antTableDropdownApproxColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) =>
                  state.onReferenceChange('ATable table dropdown approx', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>table slot `#customFilterDropdown`</p>
            </div>
            <VTable
              :columns="state.vtableTableDropdownColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            >
              <template
                #customFilterDropdown="{
                  selectedKeys,
                  setSelectedKeys,
                  confirm,
                  clearFilters,
                  column,
                }"
              >
                <div class="play-filter-menu">
                  <p class="play-filter-menu__eyebrow">Table-level slot</p>
                  <h4 class="play-filter-menu__title">{{ column.title }} / shared slot</h4>
                  <div class="play-filter-token-grid">
                    <button
                      v-for="item in teamFilters"
                      :key="String(item.value)"
                      type="button"
                      class="play-filter-token"
                      :class="{ 'is-active': isSelected(selectedKeys, item.value) }"
                      @click="setSelectedKeys(toggleKeys(selectedKeys, item.value))"
                    >
                      {{ item.text }}
                    </button>
                  </div>
                  <div class="play-filter-actions">
                    <button
                      type="button"
                      class="play-ghost-button"
                      @click="clearFilters({ confirm: true })"
                    >
                      Reset
                    </button>
                    <button type="button" class="play-solid-button" @click="confirm()">
                      Apply
                    </button>
                  </div>
                </div>
              </template>
            </VTable>
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">10</p>
            <h2>列级自定义筛选下拉</h2>
          </div>
          <p class="play-case__desc">
            验证点：列级 dropdown 渲染优先级、单选面板排版、排序与面板入口的间距。
          </p>
        </header>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antColumnDropdownColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable column dropdown', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`column.filterDropdown`</p>
            </div>
            <VTable
              :columns="state.vtableColumnDropdownColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">11</p>
            <h2>受控下拉显隐</h2>
          </div>
          <p class="play-case__desc">
            验证点：外部打开/关闭、图标点击回调、受控显隐状态与表头 UI 一致性。
          </p>
        </header>
        <div class="play-toolbar">
          <button type="button" class="play-ghost-button" @click="state.openBothDropdowns()">
            Open panel
          </button>
          <button type="button" class="play-ghost-button" @click="state.closeBothDropdowns()">
            Close panel
          </button>
        </div>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antControlledOpenColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable controlled open', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filterDropdownOpen + onFilterDropdownOpenChange`</p>
            </div>
            <VTable
              :columns="state.vtableControlledOpenColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>

      <section class="play-case">
        <header class="play-case__header">
          <div>
            <p class="play-case__index">12</p>
            <h2>高亮态覆盖</h2>
          </div>
          <p class="play-case__desc">
            验证点：无真实筛选值时强制点亮图标，检查视觉反馈与数据状态是否解耦。
          </p>
        </header>
        <div class="play-toolbar">
          <button type="button" class="play-ghost-button" @click="state.toggleForcedHighlight()">
            Highlight: {{ state.forcedHighlight ? 'ON' : 'OFF' }}
          </button>
        </div>
        <div class="play-compare-grid">
          <article class="play-panel">
            <div class="play-panel__head">
              <div>
                <span class="play-badge">reference</span>
                <h3>ant-design-vue</h3>
              </div>
              <p>真实原生对照</p>
            </div>
            <ATable
              :columns="state.antFilteredOverrideColumns"
              :data-source="dataSource"
              :pagination="false"
              @change="
                (...args: unknown[]) => state.onReferenceChange('ATable filtered override', ...args)
              "
            />
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>antdv preset</h3>
              </div>
              <p>`filtered` override</p>
            </div>
            <VTable
              :columns="state.vtableFilteredOverrideColumns"
              :data-source="dataSource"
              @change="state.onVTableChange"
            />
          </article>
        </div>
      </section>
    </main>
  </AConfigProvider>
</template>
