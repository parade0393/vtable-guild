<script setup lang="ts">
import { computed, ref } from 'vue'
import { CDN_SOURCES, type CdnSource } from '@/utils/cdn'
import {
  DOCS_URL,
  MIN_SUPPORTED_VTG_VERSION,
  REPO_URL,
  THEME_PRESETS,
  type ThemePreset,
} from '@/constants'

const props = defineProps<{
  vtgVersions: string[]
  vueVersions: string[]
  defaultVueVersion: string
  versionError: string
  dark: boolean
}>()

const vtgVersion = defineModel<string>('vtgVersion', { required: true })
const vueVersion = defineModel<string | null>('vueVersion', { required: true })
const preset = defineModel<ThemePreset>('preset', { required: true })
const cdn = defineModel<CdnSource>('cdn', { required: true })

const emit = defineEmits<{ 'update:dark': [boolean]; share: [] }>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyShareLink() {
  await navigator.clipboard.writeText(location.href)
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = false), 2000)
  emit('share')
}

// 版本列表还没回来时，至少让下拉里有当前选中的版本，不要显示成空
const vtgOptions = computed(() =>
  props.vtgVersions.length ? props.vtgVersions : [vtgVersion.value],
)
</script>

<template>
  <header class="play-header">
    <a class="play-header__brand" :href="DOCS_URL">
      <span class="play-header__logo" aria-hidden="true" />
      <strong>vtable-guild</strong>
      <span class="play-header__eyebrow">Playground</span>
    </a>

    <div class="play-header__controls">
      <label class="play-field">
        <span>版本</span>
        <select v-model="vtgVersion">
          <option v-for="version in vtgOptions" :key="version" :value="version">
            {{ version }}
          </option>
        </select>
      </label>

      <label class="play-field">
        <span>Vue</span>
        <select v-model="vueVersion">
          <option :value="null">{{ defaultVueVersion }}（默认）</option>
          <option v-for="version in vueVersions" :key="version" :value="version">
            {{ version }}
          </option>
        </select>
      </label>

      <label class="play-field">
        <span>预设</span>
        <select v-model="preset">
          <option v-for="item in THEME_PRESETS" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <label class="play-field">
        <span>CDN</span>
        <select v-model="cdn">
          <option v-for="item in CDN_SOURCES" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </label>

      <button type="button" class="play-btn" @click="copyShareLink">
        {{ copied ? '已复制' : '分享链接' }}
      </button>

      <button
        type="button"
        class="play-btn play-btn--icon"
        :title="dark ? '切换到浅色' : '切换到深色'"
        @click="emit('update:dark', !dark)"
      >
        {{ dark ? '☀' : '☾' }}
      </button>

      <a
        class="play-btn play-btn--icon"
        :href="REPO_URL"
        target="_blank"
        rel="noreferrer"
        title="GitHub"
      >
        ★
      </a>
    </div>
  </header>

  <p v-if="versionError" class="play-notice play-notice--warn">{{ versionError }}</p>
  <p v-else class="play-notice">
    版本下拉只列出
    {{ MIN_SUPPORTED_VTG_VERSION }} 及之后的版本——更早的版本没有浏览器单文件产物，无法在这里加载。
  </p>
</template>
