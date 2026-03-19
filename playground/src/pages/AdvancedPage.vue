<script setup lang="ts">
import { computed, inject } from 'vue'
import AntdvAdvancedPage from './AntdvAdvancedPage.vue'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
</script>

<template>
  <AntdvAdvancedPage v-if="isAntdv" :locale="playground.antLocale.value" />
  <div v-else class="play-inline-note">Element Plus 高级功能对照开发中...</div>
</template>
