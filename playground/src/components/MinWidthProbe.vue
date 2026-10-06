<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  title: string
  containerWidth: number
  minWidth: number
}>()

const viewport = ref<HTMLElement>()
const measurement = ref<{
  container: number
  header: number
  body: number
  table: number
  layout: string
}>()
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined
let frame = 0

function measure() {
  frame = 0
  const root = viewport.value
  const header = root?.querySelector('thead th')
  const body = Array.from(root?.querySelectorAll('tbody tr td:first-child') ?? []).find(
    (cell) => cell.getBoundingClientRect().height > 1,
  )
  const table = header?.closest('table')
  if (!root || !header || !body || !table) return

  measurement.value = {
    container: root.getBoundingClientRect().width,
    header: header.getBoundingClientRect().width,
    body: body.getBoundingClientRect().width,
    table: table.getBoundingClientRect().width,
    layout: getComputedStyle(table).tableLayout,
  }
}

function scheduleMeasure() {
  if (!frame) frame = requestAnimationFrame(measure)
}

onMounted(() => {
  if (!viewport.value) return
  resizeObserver = new ResizeObserver(scheduleMeasure)
  resizeObserver.observe(viewport.value)
  mutationObserver = new MutationObserver(scheduleMeasure)
  mutationObserver.observe(viewport.value, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  })
  scheduleMeasure()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <article class="width-probe">
    <h2>{{ props.title }}</h2>
    <p class="width-probe__note"><slot name="note" /></p>
    <div ref="viewport" class="width-probe__viewport" :style="{ width: `${containerWidth}px` }">
      <slot />
    </div>
    <div v-if="measurement" class="width-probe__measurement" aria-live="polite">
      <p>
        姓名列表头 <strong>{{ measurement.header.toFixed(1) }}px</strong> · 表体
        <strong>{{ measurement.body.toFixed(1) }}px</strong> ·
        <strong
          :class="{ 'width-probe__below': measurement.header < minWidth - 0.5 }"
          data-width-result
          >{{ measurement.header < minWidth - 0.5 ? '低于' : '不低于' }} {{ minWidth }}px</strong
        >
      </p>
      <p>
        实际容器 {{ measurement.container.toFixed(1) }}px · 表格
        {{ measurement.table.toFixed(1) }}px · table-layout: {{ measurement.layout }}
      </p>
      <slot name="event" />
    </div>
  </article>
</template>

<style scoped>
.width-probe {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--play-line);
  border-radius: 16px;
  background: var(--play-panel-strong);
}

.width-probe h2 {
  margin: 0 0 8px;
  font-size: 17px;
}

.width-probe__note {
  min-height: 40px;
  margin: 0 0 14px;
  color: var(--play-muted);
  font-size: 13px;
}

.width-probe__viewport {
  max-width: 100%;
  overflow: auto;
  outline: 1px dashed #909399;
}

.width-probe__measurement {
  margin-top: 14px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.width-probe__measurement p {
  margin: 4px 0;
}

.width-probe__below {
  color: #a63d18;
}
</style>
