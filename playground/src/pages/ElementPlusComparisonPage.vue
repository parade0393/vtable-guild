<script setup lang="ts">
import { inject, provide, reactive } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable } from '@vtable-guild/table'
import { VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import {
  cityFilters,
  dataSource,
  isSelected,
  matchField,
  statusFilters,
  teamFilters,
  toggleKeys,
  type DemoRow,
  type FilterValue,
  useFilterMatrixState,
} from '../filterMatrixShared'

const state = useFilterMatrixState()

const parentContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
provide(
  VTABLE_GUILD_INJECTION_KEY,
  reactive({
    get themePreset() {
      return 'element-plus' as const
    },
    get theme() {
      return parentContext?.theme ?? {}
    },
    get locale() {
      return parentContext?.locale ?? 'zh-CN'
    },
    get locales() {
      return parentContext?.locales ?? {}
    },
    get localeOverrides() {
      return parentContext?.localeOverrides ?? {}
    },
  }) as VTableGuildContext,
)
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Filter Matrix Playground</p>
        <h1>element-plus 筛选能力对照页</h1>
        <p class="play-summary">
          该页只保留 element-plus 官方表格能真实对照的筛选能力，其余案例明确展示文档能力边界，再对照
          `VTable` 的 element-plus preset。
        </p>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Case count</span>
        <strong>12</strong>
        <p>同一套筛选能力矩阵，保持横向对照口径一致。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Parity</span>
        <strong>3 / 12 real native parity</strong>
        <p>只保留基础能力真实对照，其余以说明卡明确边界。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Focus</span>
        <strong>Preset fidelity</strong>
        <p>验证 element-plus preset 在有限原生能力下的视觉与交互表达是否稳定。</p>
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
              <h3>element-plus</h3>
            </div>
            <p>真实原生对照</p>
          </div>
          <ElTable :data="dataSource" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="city"
              label="City"
              width="210"
              sortable
              column-key="city"
              :filters="cityFilters"
              :filter-method="(value: FilterValue, row: DemoRow) => matchField('city')(value, row)"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
        <p class="play-case__desc">验证点：单选行为、面板选中反馈、筛选与排序共存时的表头密度。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>真实原生对照</p>
          </div>
          <ElTable :data="dataSource" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="status"
              label="Status"
              width="210"
              sortable
              column-key="status"
              :filters="statusFilters"
              :filter-method="
                (value: FilterValue, row: DemoRow) => matchField('status')(value, row)
              "
              :filter-multiple="false"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
        <p class="play-case__desc">验证点：外部状态切换、筛选高亮同步、手动交互后受控状态回写。</p>
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
              <h3>element-plus</h3>
            </div>
            <p>真实受控筛选</p>
          </div>
          <ElTable
            :data="dataSource"
            style="width: 100%"
            @filter-change="state.onElementControlledFilterChange"
          >
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="team"
              label="Team"
              width="210"
              sortable
              column-key="team"
              :filters="teamFilters"
              :filter-method="(value: FilterValue, row: DemoRow) => matchField('team')(value, row)"
              :filtered-value="state.controlledTeamFilter"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
        <p class="play-case__desc">验证点：初始筛选命中、Reset 后是否回到默认值而不是完全清空。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>
              官方表格文档覆盖
              `filters`、`filter-method`、`filter-multiple`、`filtered-value`，但没有
              `filterResetToDefaultFilteredValue` 的原生对位。
            </p>
            <p>左侧不做伪实现，避免把额外业务逻辑误判为组件能力。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>最新官方 table 文档没有 `ElTableColumn` 原生筛选搜索面板的能力说明。</p>
            <p>若要实现类似交互，通常需要自己在 header slot 里拼 UI，不属于原生对位。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 筛选示例只覆盖平铺菜单，没有 `tree` 模式的原生筛选面板。</p>
            <p>这里保留说明，不用自定义 slot 去掩盖差异。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
        <p class="play-case__desc">验证点：图标替换、激活色、同一列排序箭头与自定义图标的排列。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档未提供筛选图标自定义 API，也没有表级 icon slot 的原生能力。</p>
            <p>如需类似效果，需要自建 header 渲染。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 筛选 API 没有列级 `filterIcon` 入口，因此这里不做伪造对照。</p>
            <p>右侧只验证 `VTable` 的列级图标渲染优先级。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有原生自定义筛选面板入口。</p>
            <p>如果强行模拟，需要自己在表头里做 popover 与状态同步，这不属于原生组件能力。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
                  <button type="button" class="play-solid-button" @click="confirm()">Apply</button>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>`ElTableColumn` 文档没有列级 `filterDropdown` 回调式 API。</p>
            <p>右侧用真实列级 dropdown，左侧保持说明卡，避免混入手写替身。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有筛选面板开关的受控属性说明。</p>
            <p>这种能力通常只能通过自建表头 popover 状态完成。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
              <h3>element-plus</h3>
            </div>
            <p>文档能力边界说明</p>
          </div>
          <div class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有暴露独立于实际筛选值的 `filtered` 高亮覆盖属性。</p>
            <p>右侧单独验证 `VTable` 是否能把视觉高亮与数据过滤状态解耦。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
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
</template>
