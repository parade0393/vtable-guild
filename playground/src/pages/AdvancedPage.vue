<script setup lang="ts">
import { computed, inject } from 'vue'
import AntdvAdvancedPage from './AntdvAdvancedPage.vue'
import ElementPlusAdvancedPage from './ElementPlusAdvancedPage.vue'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
</script>

<template>
  <AntdvAdvancedPage v-if="isAntdv" :locale="playground.antLocale.value" />
  <ElementPlusAdvancedPage v-else />
</template>
