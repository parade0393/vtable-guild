<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { VTableGuildConfigProvider } from '@vtable-guild/core'
import type { BuiltInLocaleName } from '@vtable-guild/theme'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import AntdvComparisonPage from './pages/AntdvComparisonPage.vue'
import ElementPlusComparisonPage from './pages/ElementPlusComparisonPage.vue'

type PlaygroundPage = 'antdv' | 'element-plus'

const currentPage = ref<PlaygroundPage>('antdv')
const currentLocale = ref<BuiltInLocaleName>('zh-CN')
const currentAntdvLocale = computed(() => (currentLocale.value === 'en-US' ? enUS : zhCN))

function syncHtmlPreset(page: PlaygroundPage) {
  if (typeof document === 'undefined') return

  if (page === 'element-plus') {
    document.documentElement.setAttribute('data-vtg-preset', 'element-plus')
    return
  }

  document.documentElement.removeAttribute('data-vtg-preset')
}

watch(currentPage, syncHtmlPreset, { immediate: true })
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
      <div>
        <p class="play-nav__eyebrow">Playground pages</p>
        <h1>筛选矩阵分屏对照</h1>
      </div>
      <div class="play-tabs" role="tablist" aria-label="Comparison pages">
        <button
          type="button"
          class="play-tab"
          :class="{ 'is-active': currentPage === 'antdv' }"
          @click="currentPage = 'antdv'"
        >
          ant-design-vue
        </button>
        <button
          type="button"
          class="play-tab play-tab--element"
          :class="{ 'is-active': currentPage === 'element-plus' }"
          @click="currentPage = 'element-plus'"
        >
          element-plus
        </button>
      </div>
      <div class="play-locale-switch" role="group" aria-label="Locale switch">
        <span class="play-locale-switch__label">Locale</span>
        <button
          type="button"
          class="play-locale-pill"
          :class="{ 'is-active': currentLocale === 'zh-CN' }"
          @click="currentLocale = 'zh-CN'"
        >
          中文
        </button>
        <button
          type="button"
          class="play-locale-pill"
          :class="{ 'is-active': currentLocale === 'en-US' }"
          @click="currentLocale = 'en-US'"
        >
          English
        </button>
      </div>
    </header>

    <VTableGuildConfigProvider :locale="currentLocale">
      <AntdvComparisonPage v-if="currentPage === 'antdv'" :locale="currentAntdvLocale" />
      <ElementPlusComparisonPage v-else />
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
  font-family: 'Segoe UI', sans-serif;
}

.play-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 24px;
  align-items: end;
  margin-bottom: 18px;
  padding: 22px 24px;
  border: 1px solid var(--play-line);
  border-radius: 28px;
  background: linear-gradient(145deg, rgb(255 252 246 / 96%), rgb(247 241 230 / 90%));
  box-shadow: 0 18px 55px rgb(42 36 28 / 8%);
}

.play-nav__eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-nav h1 {
  margin: 0;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: clamp(1.8rem, 2.4vw, 2.6rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

.play-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.play-locale-switch {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.play-locale-switch__label {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-muted);
}

.play-tab {
  border: 1px solid rgb(39 45 39 / 16%);
  border-radius: 999px;
  padding: 11px 16px;
  background: rgb(255 255 255 / 54%);
  color: var(--play-ink);
  font-size: 0.92rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.play-tab:hover {
  transform: translateY(-1px);
}

.play-tab.is-active {
  background: #1677ff;
  border-color: #1677ff;
  color: #ffffff;
}

.play-tab--element.is-active {
  background: #409eff;
  border-color: #409eff;
}

.play-locale-pill {
  border: 1px solid rgb(39 45 39 / 16%);
  border-radius: 999px;
  padding: 9px 14px;
  background: rgb(255 255 255 / 60%);
  color: var(--play-ink);
  font-size: 0.84rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.play-locale-pill:hover {
  transform: translateY(-1px);
}

.play-locale-pill.is-active {
  border-color: rgb(186 91 50 / 36%);
  background: var(--play-accent-soft);
  color: var(--play-accent);
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
  overflow: hidden;
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
