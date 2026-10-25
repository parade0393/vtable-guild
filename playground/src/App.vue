<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { VTableGuildConfigProvider, syncDocumentPresetAttr } from '@vtable-guild/vtable-guild'
import type { ThemePresetName } from '@vtable-guild/vtable-guild'
import type { BuiltInLocaleName } from '@vtable-guild/vtable-guild'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import PlaygroundPresetScope from './components/PlaygroundPresetScope.vue'
import { PLAYGROUND_CONTEXT_KEY } from './playgroundContext'

const currentPreset = ref<ThemePresetName>('antdv')
const currentLocale = ref<BuiltInLocaleName>('zh-CN')
const currentAntdvLocale = computed(() => (currentLocale.value === 'en-US' ? enUS : zhCN))

provide(PLAYGROUND_CONTEXT_KEY, {
  preset: currentPreset,
  locale: currentLocale,
  antLocale: currentAntdvLocale,
})

const navGroups = [
  {
    label: '功能',
    items: [
      { to: '/basic', label: '基础' },
      { to: '/filter', label: '筛选' },
      { to: '/selection', label: '选择' },
      { to: '/sort', label: '排序' },
      { to: '/pagination', label: '分页' },
      { to: '/column-settings', label: '列设置' },
      { to: '/toolbar', label: '工具栏' },
      { to: '/enterprise', label: '企业能力' },
      { to: '/pro-table', label: 'ProTable 协议' },
      { to: '/drag-sort', label: '行拖拽' },
      { to: '/advanced', label: '高级' },
    ],
  },
  {
    label: '进阶',
    items: [
      { to: '/virtual', label: '虚拟滚动' },
      { to: '/tree', label: '树形' },
      { to: '/auto-height', label: '自动高度' },
      { to: '/min-width', label: '最小列宽' },
      { to: '/perf', label: '性能' },
    ],
  },
  {
    label: '实验',
    items: [
      { to: '/prebuilt', label: 'prebuilt' },
      { to: '/antdv-full', label: 'antdv 一比一' },
      { to: '/agent-demo', label: 'Agent Demo' },
    ],
  },
]

watch(currentPreset, syncDocumentPresetAttr, { immediate: true })
watch(
  currentLocale,
  (locale) => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.removeAttribute('data-vtg-preset')
  document.documentElement.removeAttribute('lang')
})
</script>

<template>
  <div class="play-shell">
    <header class="play-nav">
      <div class="play-brand">
        <span class="play-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="3.25" />
            <path d="M3.25 9.5h17.5" />
            <path d="M9.75 9.5v10.25" />
          </svg>
        </span>
        <span class="play-brand__text">
          <span class="play-nav__eyebrow">
            <i class="play-nav__eyebrow-rule" aria-hidden="true" />
            Playground pages
          </span>
          <h1 class="play-brand__title">功能矩阵 · 路由实验场</h1>
          <span class="play-brand__meta"
            >Vue 3 Table · ant-design-vue / element-plus 双预设对照</span
          >
        </span>
      </div>

      <div class="play-nav__controls">
        <div class="play-seg" role="tablist" aria-label="Preset switch">
          <span class="play-seg__caption">Preset</span>
          <button
            type="button"
            class="play-seg__btn"
            :class="{ 'is-active': currentPreset === 'antdv' }"
            @click="currentPreset = 'antdv'"
          >
            <i class="play-seg__dot play-seg__dot--antdv" aria-hidden="true" />
            ant-design-vue
          </button>
          <button
            type="button"
            class="play-seg__btn"
            :class="{ 'is-active': currentPreset === 'element-plus' }"
            @click="currentPreset = 'element-plus'"
          >
            <i class="play-seg__dot play-seg__dot--element" aria-hidden="true" />
            element-plus
          </button>
        </div>
        <div class="play-seg play-seg--locale" role="group" aria-label="Locale switch">
          <svg
            class="play-seg__globe"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17" />
            <path
              d="M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z"
            />
          </svg>
          <button
            type="button"
            class="play-seg__btn"
            :class="{ 'is-active': currentLocale === 'zh-CN' }"
            @click="currentLocale = 'zh-CN'"
          >
            中文
          </button>
          <button
            type="button"
            class="play-seg__btn"
            :class="{ 'is-active': currentLocale === 'en-US' }"
            @click="currentLocale = 'en-US'"
          >
            English
          </button>
        </div>
      </div>

      <nav class="play-tabs" aria-label="Feature routes">
        <div v-for="group in navGroups" :key="group.label" class="play-tabs__group">
          <span class="play-tabs__label">{{ group.label }}</span>
          <div class="play-tabs__row">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              class="play-tab"
              active-class="is-active"
              :to="item.to"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </nav>
    </header>

    <VTableGuildConfigProvider :locale="currentLocale">
      <PlaygroundPresetScope :preset="currentPreset">
        <RouterView />
      </PlaygroundPresetScope>
    </VTableGuildConfigProvider>
  </div>
</template>

<style>
.play-shell {
  --play-bg: #f6efe3;
  --play-panel: rgb(255 252 246 / 94%);
  --play-panel-strong: #fffdf7;
  --play-ink: #1d241e;
  --play-muted: #6b6f63;
  --play-line: rgb(35 43 36 / 12%);
  --play-accent: #ba5b32;
  --play-accent-soft: rgb(186 91 50 / 14%);
  --play-green: #2e5e4e;

  min-height: 100vh;
  padding: 24px 32px 32px;
  color: var(--play-ink);
  background:
    radial-gradient(circle at top left, rgb(255 255 255 / 65%), transparent 28%),
    linear-gradient(135deg, #efe6d6 0%, #f6efe3 42%, #ece6da 100%);
}

.play-nav {
  position: sticky;
  top: 14px;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'brand controls'
    'nav nav';
  gap: 12px 28px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 22px 13px;
  border: 1px solid var(--play-line);
  border-radius: 24px;
  background: linear-gradient(145deg, rgb(255 253 249 / 96%), rgb(246 240 229 / 94%));
  box-shadow: 0 16px 44px rgb(42 36 28 / 9%);
}

.play-brand {
  grid-area: brand;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.play-brand__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(150deg, #cb6a3c 0%, #a0492a 58%, #7f3619 100%);
  box-shadow:
    0 7px 16px rgb(140 62 30 / 26%),
    inset 0 1px 0 rgb(255 255 255 / 30%);
  color: #fff5ec;
}

.play-brand__mark svg {
  width: 22px;
  height: 22px;
}

.play-brand__text {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.play-nav__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-nav__eyebrow-rule {
  width: 20px;
  height: 1px;
  background: currentcolor;
  opacity: 0.55;
}

.play-brand__title {
  margin: 0;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: clamp(1.15rem, 1.5vw, 1.5rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.play-brand__meta {
  overflow: hidden;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--play-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.play-nav__controls {
  grid-area: controls;
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--play-line);
  border-radius: 999px;
  background: rgb(255 255 255 / 45%);
  box-shadow: inset 0 1px 2px rgb(42 36 28 / 5%);
}

.play-seg__caption {
  padding: 0 6px 0 10px;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-muted);
}

.play-seg__btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  padding: 7px 13px;
  background: transparent;
  color: var(--play-muted);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.play-seg__btn:hover {
  background: rgb(255 255 255 / 66%);
  color: var(--play-ink);
}

.play-seg__btn.is-active {
  background: var(--play-panel-strong);
  color: var(--play-ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(42 36 28 / 14%);
}

.play-seg__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  opacity: 0.4;
  transition:
    opacity 0.16s ease,
    box-shadow 0.16s ease;
}

.play-seg__dot--antdv {
  background: #1677ff;
}

.play-seg__dot--element {
  background: #409eff;
}

.play-seg__btn.is-active .play-seg__dot {
  opacity: 1;
}

.play-seg__btn.is-active .play-seg__dot--antdv {
  box-shadow: 0 0 0 3px rgb(22 119 255 / 16%);
}

.play-seg__btn.is-active .play-seg__dot--element {
  box-shadow: 0 0 0 3px rgb(64 158 255 / 20%);
}

.play-seg--locale {
  padding-left: 11px;
}

.play-seg__globe {
  flex: none;
  width: 15px;
  height: 15px;
  color: var(--play-muted);
}

.play-seg--locale .play-seg__btn.is-active {
  background: var(--play-accent-soft);
  color: var(--play-accent);
  box-shadow: none;
}

.play-tabs {
  grid-area: nav;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  padding-top: 11px;
  border-top: 1px solid var(--play-line);
}

.play-tabs__group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-tabs__group + .play-tabs__group {
  position: relative;
  padding-left: 16px;
}

.play-tabs__group + .play-tabs__group::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  translate: 0 -50%;
  width: 1px;
  height: 16px;
  background: var(--play-line);
}

.play-tabs__label {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--play-muted);
  opacity: 0.75;
}

.play-tabs__row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.play-tab {
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 12px;
  background: transparent;
  color: var(--play-muted);
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;
}

.play-tab:hover {
  border-color: var(--play-line);
  background: rgb(255 255 255 / 72%);
  color: var(--play-ink);
}

.play-tab.is-active {
  border-color: transparent;
  background: var(--play-ink);
  color: #fffdf7;
  box-shadow: 0 2px 8px rgb(29 36 30 / 18%);
}

.play-tab:focus-visible,
.play-seg__btn:focus-visible {
  outline: 2px solid var(--play-accent);
  outline-offset: 2px;
}

.play-page {
  display: block;
}

.play-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 28px;
  border: 1px solid var(--play-line);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgb(255 252 246 / 96%), rgb(247 241 230 / 90%)), var(--play-panel);
  box-shadow: 0 18px 55px rgb(42 36 28 / 8%);
}

.play-hero h1 {
  margin: 6px 0 10px;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: clamp(2rem, 3vw, 3.2rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.play-kicker {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-summary {
  max-width: 760px;
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.65;
  color: var(--play-muted);
}

.play-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.play-metric-card {
  padding: 18px 20px;
  border: 1px solid var(--play-line);
  border-radius: 22px;
  background: var(--play-panel);
  box-shadow: 0 12px 30px rgb(42 36 28 / 6%);
}

.play-metric-card__label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-muted);
}

.play-metric-card strong {
  display: block;
  font-size: 1.18rem;
  font-weight: 700;
  line-height: 1.2;
}

.play-metric-card p {
  margin: 8px 0 0;
  line-height: 1.55;
  color: var(--play-muted);
}

.play-case {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid var(--play-line);
  border-radius: 26px;
  background: rgb(255 252 246 / 78%);
  box-shadow: 0 14px 40px rgb(42 36 28 / 5%);
}

.play-case__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;
}

.play-case__index {
  margin: 0 0 8px;
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-case__header h2 {
  margin: 0;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: 1.45rem;
  line-height: 1.1;
}

.play-case__desc {
  max-width: 460px;
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--play-muted);
}

.play-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.play-compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.play-panel {
  padding: 18px;
  border: 1px solid var(--play-line);
  border-radius: 22px;
  background: var(--play-panel-strong);
  overflow: clip;
}

.play-panel--accent {
  border-color: rgb(186 91 50 / 22%);
  background: linear-gradient(180deg, rgb(255 249 245 / 100%), rgb(255 252 246 / 100%));
}

.play-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.play-panel__head h3 {
  margin: 6px 0 0;
  font-size: 1rem;
}

.play-panel__head p {
  margin: 4px 0 0;
  font-size: 0.83rem;
  line-height: 1.45;
  color: var(--play-muted);
  text-align: right;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgb(29 36 30 / 7%);
  color: var(--play-green);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-badge--accent {
  background: var(--play-accent-soft);
  color: var(--play-accent);
}

.play-inline-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-left: 3px solid rgb(186 91 50 / 48%);
  background: rgb(186 91 50 / 8%);
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--play-muted);
}

.play-note-card {
  display: grid;
  gap: 10px;
  min-height: 230px;
  align-content: start;
  padding: 18px;
  border: 1px dashed rgb(39 45 39 / 22%);
  border-radius: 18px;
  background: linear-gradient(180deg, rgb(244 239 229 / 78%), rgb(255 252 246 / 92%));
}

.play-note-card__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-note-card h3 {
  margin: 0;
  font-size: 1rem;
}

.play-note-card p {
  margin: 0;
  line-height: 1.65;
  color: var(--play-muted);
}

.play-ghost-button,
.play-solid-button,
.play-filter-token {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.84rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.play-ghost-button {
  border: 1px solid rgb(39 45 39 / 16%);
  background: rgb(255 255 255 / 70%);
  color: var(--play-ink);
}

.play-solid-button {
  border: 1px solid var(--play-accent);
  background: var(--play-accent);
  color: #ffffff;
}

.play-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(29 36 30 / 8%);
  color: var(--play-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-icon-chip.is-active {
  background: rgb(186 91 50 / 16%);
  color: var(--play-accent);
}

.play-filter-menu {
  width: 240px;
  padding: 16px;
  border: 1px solid rgb(39 45 39 / 14%);
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf8, #f5efe5);
  box-shadow: 0 16px 36px rgb(40 31 24 / 14%);
}

.play-filter-menu__eyebrow {
  margin: 0 0 6px;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-filter-menu__title {
  margin: 0 0 12px;
  font-size: 0.92rem;
  line-height: 1.35;
}

.play-filter-token-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.play-filter-token {
  border: 1px solid rgb(39 45 39 / 14%);
  background: rgb(255 255 255 / 76%);
  color: var(--play-ink);
}

.play-filter-token.is-active {
  border-color: rgb(186 91 50 / 42%);
  background: rgb(186 91 50 / 12%);
  color: var(--play-accent);
}

.play-ghost-button:hover,
.play-solid-button:hover,
.play-filter-token:hover {
  transform: translateY(-1px);
}

.play-filter-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}

@media (width <= 1180px) {
  .play-nav {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'brand'
      'controls'
      'nav';
    justify-items: start;
  }

  .play-nav__controls {
    flex-wrap: wrap;
  }
}

@media (width <= 1080px) {
  .play-nav,
  .play-compare-grid,
  .play-metrics,
  .play-case__header,
  .play-hero {
    grid-template-columns: 1fr;
  }

  .play-panel__head {
    flex-direction: column;
  }

  .play-panel__head p {
    text-align: left;
  }
}

@media (width <= 720px) {
  .play-shell {
    padding: 16px;
  }

  .play-nav {
    top: 8px;
  }

  .play-nav__eyebrow-rule,
  .play-seg__caption {
    display: none;
  }

  .play-nav,
  .play-hero,
  .play-case,
  .play-panel,
  .play-metric-card {
    padding: 16px;
  }

  .play-filter-menu {
    width: min(240px, calc(100vw - 60px));
  }
}
</style>
