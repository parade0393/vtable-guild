<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowRef, watchEffect } from 'vue'
import { withBase } from 'vitepress'

const props = withDefaults(
  defineProps<{
    /** 相对 site/demos 的路径，不含扩展名。例：`sorting/basic` */
    src: string
    /** 预览区最小高度，避免 ClientOnly 挂载前后的布局抖动 */
    minHeight?: number
  }>(),
  { minHeight: 240 },
)

// 组件懒加载：每个文档页只会拉自己用到的 demo chunk。
const demoModules = import.meta.glob('../../../demos/**/*.vue')
// 源码 eager：复制代码需要同步拿到字符串。
// demo 合计几十 KB 文本，gzip 后可以忽略。
const demoSources = import.meta.glob('../../../demos/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const modulePath = computed(() => `../../../demos/${props.src}.vue`)
const source = computed(() => demoSources[modulePath.value] ?? '')
const missing = computed(() => !(modulePath.value in demoModules))

const DemoComponent = shallowRef<ReturnType<typeof defineAsyncComponent> | null>(null)
watchEffect(() => {
  const loader = demoModules[modulePath.value]
  DemoComponent.value = loader ? defineAsyncComponent(loader as never) : null
})

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (missing.value) {
      console.warn(
        `[Demo] 找不到 demo 源文件：site/demos/${props.src}.vue\n` +
          `可用的有：\n${Object.keys(demoModules)
            .map((key) => `  - ${key.replace('../../../demos/', '').replace(/\.vue$/, '')}`)
            .join('\n')}`,
      )
    }
  })
}

// Playground 地址：默认走站点 base 下的 /play/。
// 本地把两个站分开跑时用 VITE_PLAYGROUND_URL 覆盖，仓库里不写死任何主机名。
const playgroundBase = import.meta.env.VITE_PLAYGROUND_URL || withBase('/play/')

const playgroundUrl = computed(() => {
  if (missing.value) return playgroundBase
  const separator = playgroundBase.includes('?') ? '&' : '?'
  return `${playgroundBase}${separator}demo=${encodeURIComponent(props.src)}`
})

const expanded = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copySource() {
  try {
    await navigator.clipboard.writeText(source.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    // 非安全上下文下 clipboard 不可用，展开源码让用户自己选中复制
    expanded.value = true
  }
}
</script>

<template>
  <div class="vtg-demo">
    <p v-if="missing" class="vtg-demo__missing">
      找不到 demo：<code>site/demos/{{ src }}.vue</code>
    </p>

    <div v-else class="vtg-demo__preview vp-raw" :style="{ minHeight: `${minHeight}px` }">
      <ClientOnly>
        <component :is="DemoComponent" v-if="DemoComponent" />
        <template #fallback>
          <div class="vtg-demo__skeleton">加载示例…</div>
        </template>
      </ClientOnly>
    </div>

    <div class="vtg-demo__actions">
      <a class="vtg-demo__action" :href="playgroundUrl" target="_blank" rel="noreferrer">
        在 Playground 中编辑
      </a>
      <button class="vtg-demo__action" type="button" @click="copySource">
        {{ copied ? '已复制' : '复制代码' }}
      </button>
      <button
        class="vtg-demo__action vtg-demo__action--toggle"
        type="button"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起源码' : '展开源码' }}
        <svg
          class="vtg-demo__chevron"
          :class="{ 'vtg-demo__chevron--up': expanded }"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    </div>

    <div v-show="expanded" class="vtg-demo__source">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.vtg-demo {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.vtg-demo__preview {
  padding: 22px;
}

.vtg-demo__skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: inherit;
  color: var(--vp-c-text-3);
  font-size: 14px;
}

.vtg-demo__missing {
  margin: 0;
  padding: 22px;
  color: var(--vp-c-danger-1);
}

.vtg-demo__actions {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  border-top: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.vtg-demo__action {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  background: transparent;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.vtg-demo__action:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}

.vtg-demo__action--toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.vtg-demo__chevron {
  transition: transform 0.2s;
}

.vtg-demo__chevron--up {
  transform: rotate(180deg);
}

.vtg-demo__source {
  border-top: 1px solid var(--vp-c-divider);
}

/* 插槽里是 VitePress 构建期高亮好的代码块，去掉它自带的外边距与圆角 */
.vtg-demo__source :deep(div[class*='language-']) {
  margin: 0;
  border-radius: 0;
}
</style>
