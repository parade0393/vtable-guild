<script setup lang="ts">
import { computed, inject } from 'vue'
import AntdvComparisonPage from './AntdvComparisonPage.vue'
import ElementPlusComparisonPage from './ElementPlusComparisonPage.vue'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
</script>

<template>
  <AntdvComparisonPage v-if="isAntdv" :locale="playground.antLocale.value" />
  <ElementPlusComparisonPage v-else />
</template>
