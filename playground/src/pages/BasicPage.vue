<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ConfigProvider as AConfigProvider, Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType } from '@vtable-guild/table'
import { dataSource, type DemoRow } from '../filterMatrixShared'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
const demoSize = ref<'sm' | 'md' | 'lg'>('md')
const hoverable = ref(true)

const baseColumns: ColumnsType<DemoRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 170 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 130 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const compactRows = computed(() => dataSource.slice(0, 4))
</script>

<template>
  <AConfigProvider :locale="playground.antLocale.value">
    <main class="play-page">
      <section class="play-hero">
        <div class="play-hero__copy">
          <p class="play-kicker">Basic Surface Playground</p>
          <h1>基础 API 分路由验证</h1>
          <p class="play-summary">
            这一页只看基础表格状态与外观 API，包括
            empty、loading、bordered、striped、size、hoverable，以及默认态与 slot 覆盖之间的
            对齐关系，避免和筛选、行选择、排序交叉干扰。
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
          <strong>{{ isAntdv ? 'ant-design-vue parity' : 'element-plus preset surface' }}</strong>
          <p>切换 preset 后，右侧同一套 VTable API 会直接切换主题表达。</p>
        </article>
        <article class="play-metric-card">
          <span class="play-metric-card__label">Why separate</span>
          <strong>减少功能串扰</strong>
          <p>基础视觉回归不再被筛选弹层或选择列干扰。</p>
        </article>
      </section>

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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? '原生 loading' : 'element-plus 这一页先聚焦 VTable' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="baseColumns"
              :data-source="compactRows"
              :loading="true"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>这一页主要验证 VTable 的基础 API 在 element-plus preset 下的视觉表达。</p>
              <p>左侧不再重复堆原生表格，只保留说明卡，避免路由噪声过高。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>default loading</p>
            </div>
            <VTable
              :columns="baseColumns"
              :data-source="compactRows"
              :loading="true"
              row-key="key"
            />
          </article>
        </div>
      </section>

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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? '原生 loading 参照' : '重点观察右侧自定义 slot 覆盖后的节奏' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="baseColumns"
              :data-source="compactRows"
              :loading="true"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>
                这里主要看 slot 覆盖后，右侧的 loading 区域是否仍然保持和默认态一致的边界与居中。
              </p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? '空数据原生表现' : '以说明卡代替' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="baseColumns"
              :data-source="[]"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>右侧更关键的是验证空数据下的 token、边框、留白和 empty slot 对齐。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
              </div>
              <p>default empty</p>
            </div>
            <VTable :columns="baseColumns" :data-source="[]" row-key="key" />
          </article>
        </div>
      </section>

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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? '空数据原生表现' : '右侧重点验证 custom empty 的对齐' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :columns="baseColumns"
              :data-source="[]"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>这里主要看自定义 empty slot 是否和默认空态一样保持稳定的居中、边距和边框节奏。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'bordered 原生对照' : '原生 stripe 不作为这一页重点' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              bordered
              :columns="baseColumns"
              :data-source="compactRows"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>右侧同时打开 bordered + striped，更适合观察 preset 纹理和边界线细节。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
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
                <h3>{{ isAntdv ? 'ant-design-vue' : 'native parity note' }}</h3>
              </div>
              <p>{{ isAntdv ? 'size 同步切换' : '尺寸主要看右侧 token' }}</p>
            </div>
            <ATable
              v-if="isAntdv"
              :size="demoSize === 'sm' ? 'small' : demoSize === 'lg' ? 'large' : 'middle'"
              :columns="baseColumns"
              :data-source="compactRows"
              :pagination="false"
              row-key="key"
            />
            <div v-else class="play-note-card">
              <p class="play-note-card__eyebrow">Preset verification</p>
              <h3>element-plus</h3>
              <p>切换尺寸时重点看右侧表头高度、单元格 padding 和空态节奏。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
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
                <h3>native note</h3>
              </div>
              <p>原生表格通常不暴露独立 hoverable 开关</p>
            </div>
            <div class="play-note-card">
              <p class="play-note-card__eyebrow">No direct parity</p>
              <h3>Why this route exists</h3>
              <p>基础视觉 API 里有一部分是 VTable 自己补足的统一能力，例如独立 hover 开关。</p>
              <p>这类能力放在单独路由里，比在筛选页顺带观察更清晰。</p>
            </div>
          </article>

          <article class="play-panel play-panel--accent">
            <div class="play-panel__head">
              <div>
                <span class="play-badge play-badge--accent">vtable-guild</span>
                <h3>{{ isAntdv ? 'antdv preset' : 'element-plus preset' }}</h3>
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
  </AConfigProvider>
</template>

<style scoped>
.play-note-card--centered {
  min-height: 180px;
  place-items: center;
  text-align: center;
}
</style>
