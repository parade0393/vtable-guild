<script setup lang="ts">
import { computed, inject } from 'vue'
import AntdvBasicPage from './AntdvBasicPage.vue'
import ElementPlusBasicPage from './ElementPlusBasicPage.vue'
import { PLAYGROUND_CONTEXT_KEY } from '../playgroundContext'

const playground = inject(PLAYGROUND_CONTEXT_KEY)

if (!playground) {
  throw new Error('Playground context is missing')
}

const isAntdv = computed(() => playground.preset.value === 'antdv')
</script>

<template>
  <AntdvBasicPage v-if="isAntdv" :locale="playground.antLocale.value" />
  <ElementPlusBasicPage v-else />
</template>
