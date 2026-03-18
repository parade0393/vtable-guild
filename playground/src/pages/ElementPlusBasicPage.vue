<script setup lang="ts">
import { computed, inject, provide, reactive, ref } from 'vue'
import { ElTable, ElTableColumn, ElLoading } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/loading/style/css'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType } from '@vtable-guild/table'
import { VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { dataSource, type DemoRow } from '../filterMatrixShared'

const vLoading = ElLoading.directive

const demoSize = ref<'sm' | 'md' | 'lg'>('md')
const hoverable = ref(true)

const baseColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 130 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const compactRows = computed(() => dataSource.slice(0, 4))

const elSizeMap: Record<string, '' | 'small' | 'large'> = {
  sm: 'small',
  md: '',
  lg: 'large',
}

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
        <p class="play-kicker">Basic Surface Playground</p>
        <h1>element-plus 基础 API 对照</h1>
        <p class="play-summary">
          基础表格状态与外观 API 对照，左侧使用真实 ElTable，右侧为 VTable element-plus preset。
        </p>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Route focus</span>
        <strong>基础状态与视觉 API</strong>
        <p>单独验证默认态、自定义态、边框、尺寸和 hover 行为。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Preset</span>
        <strong>element-plus parity</strong>
        <p>左侧真实 ElTable，右侧 VTable element-plus preset。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Parity</span>
        <strong>5 / 7 real native parity</strong>
        <p>loading slot 和 hoverable 开关无直接原生对位，用说明卡代替。</p>
      </article>
    </section>

    <!-- 01 默认 Loading -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">01</p>
          <h2>默认 Loading 状态</h2>
        </div>
        <p class="play-case__desc">验证点：默认遮罩层、表头保留和 loading 对齐。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>v-loading 原生对照</p>
          </div>
          <ElTable v-loading="true" :data="compactRows" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>default loading</p>
          </div>
          <VTable :columns="baseColumns" :data-source="compactRows" :loading="true" row-key="key" />
        </article>
      </div>
    </section>

    <!-- 02 自定义 Loading Slot -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">02</p>
          <h2>自定义 Loading Slot</h2>
        </div>
        <p class="play-case__desc">验证点：slot 覆盖默认 loading 后，布局和留白是否仍然对齐。</p>
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
            <p>ElTable 使用 v-loading 指令实现加载态，没有自定义 loading slot 入口。</p>
            <p>右侧重点验证自定义 slot 覆盖后的居中和留白对齐。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>slot #loading</p>
          </div>
          <VTable :columns="baseColumns" :data-source="compactRows" :loading="true" row-key="key">
            <template #loading>
              <div class="play-note-card">
                <p class="play-note-card__eyebrow">Custom loading</p>
                <h3>Preparing table surface</h3>
                <p>这里验证 loading slot 是否能替换默认状态层。</p>
              </div>
            </template>
          </VTable>
        </article>
      </div>
    </section>

    <!-- 03 默认空状态 -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">03</p>
          <h2>默认空状态</h2>
        </div>
        <p class="play-case__desc">验证点：默认 empty 表现、留白和内容居中。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>空数据原生表现</p>
          </div>
          <ElTable :data="[]" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>default empty</p>
          </div>
          <VTable :columns="baseColumns" :data-source="[]" row-key="key" />
        </article>
      </div>
    </section>

    <!-- 04 自定义 Empty Slot -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">04</p>
          <h2>自定义 Empty Slot</h2>
        </div>
        <p class="play-case__desc">
          验证点：自定义 empty slot 替换后，内容对齐与默认空态是否一致。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>自定义 empty slot</p>
          </div>
          <ElTable :data="[]" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
            <template #empty>
              <div class="play-note-card play-note-card--centered">
                <p class="play-note-card__eyebrow">Custom empty</p>
                <h3>No rows on purpose</h3>
                <p>ElTable 支持 #empty slot 自定义空态内容。</p>
              </div>
            </template>
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>slot #empty</p>
          </div>
          <VTable :columns="baseColumns" :data-source="[]" row-key="key">
            <template #empty>
              <div class="play-note-card play-note-card--centered">
                <p class="play-note-card__eyebrow">Custom empty</p>
                <h3>No rows on purpose</h3>
                <p>基础 API 路由用空态验证留白、对齐和插槽覆写。</p>
              </div>
            </template>
          </VTable>
        </article>
      </div>
    </section>

    <!-- 05 Bordered + Striped -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">05</p>
          <h2>Bordered 与 Striped</h2>
        </div>
        <p class="play-case__desc">验证点：边框密度、分隔线节奏与斑马纹背景强度。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>border + stripe 原生对照</p>
          </div>
          <ElTable border stripe :data="compactRows" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>bordered + striped</p>
          </div>
          <VTable
            bordered
            striped
            :columns="baseColumns"
            :data-source="compactRows"
            row-key="key"
          />
        </article>
      </div>
    </section>

    <!-- 06 Size -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">06</p>
          <h2>Size</h2>
        </div>
        <p class="play-case__desc">验证点：sm / md / lg 的行高、字号和操作密度。</p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="demoSize = 'sm'">sm</button>
        <button type="button" class="play-ghost-button" @click="demoSize = 'md'">md</button>
        <button type="button" class="play-ghost-button" @click="demoSize = 'lg'">lg</button>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>element-plus</h3>
            </div>
            <p>size 同步切换</p>
          </div>
          <ElTable :data="compactRows" :size="elSizeMap[demoSize]" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="170" />
            <ElTableColumn prop="age" label="Age" width="90" align="right" />
            <ElTableColumn prop="status" label="Status" width="130" />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>size = {{ demoSize }}</p>
          </div>
          <VTable
            :size="demoSize"
            :columns="baseColumns"
            :data-source="compactRows"
            row-key="key"
          />
        </article>
      </div>
    </section>

    <!-- 07 Hoverable -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">07</p>
          <h2>Hoverable</h2>
        </div>
        <p class="play-case__desc">验证点：行 hover 高亮是否能独立开关。</p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="hoverable = !hoverable">
          Hoverable: {{ hoverable ? 'ON' : 'OFF' }}
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
            <p>ElTable 的 highlight-current-row 是单击高亮，不等同于 hover 行高亮开关。</p>
            <p>右侧验证 VTable 的独立 hoverable 开关在 element-plus preset 下的表现。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>element-plus preset</h3>
            </div>
            <p>hoverable</p>
          </div>
          <VTable
            :hoverable="hoverable"
            :columns="baseColumns"
            :data-source="compactRows"
            row-key="key"
          />
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.play-note-card--centered {
  min-height: 180px;
  place-items: center;
  text-align: center;
}
</style>
