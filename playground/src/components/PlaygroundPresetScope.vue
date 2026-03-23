<script setup lang="ts">
import { computed, inject, provide, reactive } from 'vue'
import type { ThemePresetName, VTableGuildContext } from '@vtable-guild/core'
import { VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'

const props = defineProps<{
  preset: ThemePresetName
}>()

const parentContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

const scopedContext = reactive({
  get themePreset() {
    return props.preset
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
}) as VTableGuildContext

provide(VTABLE_GUILD_INJECTION_KEY, scopedContext)

const rootClass = computed(() => [
  'play-route-frame',
  props.preset === 'element-plus' ? 'play-route-frame--element' : 'play-route-frame--antdv',
])
</script>

<template>
  <div :class="rootClass" :data-vtg-preset="preset">
    <slot />
  </div>
</template>

<style scoped>
.play-route-frame {
  display: block;
}
</style>
