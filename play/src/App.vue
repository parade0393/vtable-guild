<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watchEffect } from 'vue'
import { Repl } from '@vue/repl'
import PlayHeader from '@/components/PlayHeader.vue'
import { useVtgRepl } from '@/composables/useVtgRepl'

// Monaco 及其 TS 语言服务是首屏最大的一块（未压缩 4MB+）。
// 异步加载让顶栏和布局先出来，编辑器随后补上。
const Monaco = defineAsyncComponent(() => import('@vue/repl/monaco-editor'))

const {
  store,
  previewOptions,
  cdn,
  preset,
  vtgVersion,
  vtgVersions,
  vueVersion,
  vueVersions,
  defaultVueVersion,
  versionError,
} = useVtgRepl()

const dark = ref(false)

onMounted(() => {
  dark.value =
    localStorage.getItem('vtg-play-dark') === '1' ||
    (localStorage.getItem('vtg-play-dark') === null &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
})

watchEffect(() => {
  document.documentElement.classList.toggle('dark', dark.value)
  try {
    localStorage.setItem('vtg-play-dark', dark.value ? '1' : '0')
  } catch {
    // 隐私模式下忽略
  }
})
</script>

<template>
  <div class="play-root">
    <PlayHeader
      v-model:vtg-version="vtgVersion"
      v-model:vue-version="vueVersion"
      v-model:preset="preset"
      v-model:cdn="cdn"
      v-model:dark="dark"
      :vtg-versions="vtgVersions"
      :vue-versions="vueVersions"
      :default-vue-version="defaultVueVersion"
      :version-error="versionError"
    />

    <Repl
      class="play-repl"
      :store="store"
      :editor="Monaco"
      :theme="dark ? 'dark' : 'light'"
      :preview-options="previewOptions"
      :show-compile-output="false"
      :clear-console="false"
      :editor-options="{ autoSaveText: '自动保存' }"
    />
  </div>
</template>
