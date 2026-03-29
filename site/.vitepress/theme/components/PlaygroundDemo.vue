<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    route: string
    note?: string
    src?: string
    height?: number
  }>(),
  {
    note: '启动 pnpm playground 后可直接在文档页内预览当前示例。',
    src: 'http://localhost:5173',
    height: 420,
  },
)

const normalizedRoute = computed(() =>
  props.route.startsWith('/') ? props.route : `/${props.route}`,
)
const demoUrl = computed(() => `${props.src}/#${normalizedRoute.value}`)
</script>

<template>
  <div class="vtg-demo-card">
    <div class="vtg-demo-card__header">
      <div>
        <p class="vtg-demo-card__eyebrow">Playground Demo</p>
        <h3>{{ title }}</h3>
      </div>
      <a :href="demoUrl" target="_blank" rel="noreferrer">新窗口打开</a>
    </div>
    <p class="vtg-demo-card__note">{{ note }}</p>
    <div class="vtg-demo-card__meta">
      <span>route: {{ normalizedRoute }}</span>
      <span>command: pnpm playground</span>
    </div>
    <iframe
      class="vtg-demo-card__frame"
      :src="demoUrl"
      :title="title"
      loading="lazy"
      :style="{ height: `${height}px` }"
    />
  </div>
</template>
