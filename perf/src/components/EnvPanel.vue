<script setup lang="ts">
import { computed } from 'vue'
import type { EnvInfo } from '../env'
import { shortBrowser, shortOs } from '../env'

const props = defineProps<{ env: EnvInfo }>()

const rows = computed(() => [
  { label: '浏览器', value: shortBrowser(props.env.userAgent) },
  { label: '系统', value: shortOs(props.env.userAgent) },
  { label: '逻辑核心', value: props.env.hardwareConcurrency ?? '未提供' },
  {
    label: '设备内存',
    value: props.env.deviceMemoryGb
      ? `${props.env.deviceMemoryGb} GB（浏览器上报值，会被取整）`
      : '未提供',
  },
  { label: 'DPR', value: props.env.devicePixelRatio },
  { label: '视口', value: props.env.viewport },
  {
    label: '构建模式',
    value: props.env.isDev ? `${props.env.buildMode}（⚠ 非基线）` : props.env.buildMode,
  },
  {
    label: '跨源隔离',
    value: props.env.crossOriginIsolated
      ? '是 —— 可用标准内存 API'
      : '否 —— 内存回落到 Chrome 非标准接口',
  },
])

const versions = computed(() => Object.entries(props.env.versions))
</script>

<template>
  <section class="perf-card">
    <h2>采集环境</h2>
    <p class="perf-note">数字离开环境就是噪声。这一份会一起进导出的 Markdown。</p>
    <dl class="perf-env">
      <div v-for="row in rows" :key="row.label" class="perf-env__item">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <p class="perf-group-label">版本</p>
    <dl class="perf-env">
      <div v-for="[name, version] in versions" :key="name" class="perf-env__item">
        <dt>{{ name }}</dt>
        <dd>
          <code>{{ version }}</code>
        </dd>
      </div>
    </dl>
    <details class="perf-details">
      <summary>完整 User-Agent</summary>
      <code class="perf-ua">{{ env.userAgent }}</code>
    </details>
  </section>
</template>
