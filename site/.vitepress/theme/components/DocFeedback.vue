<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// 挂在每个文档页的 doc-footer-before 插槽。链接直接打开一个预填好的 Q&A 讨论，
// 标题和正文带上当前页，维护者不用再追问是哪一页的问题。
const { page, lang } = useData()

const SITE_URL = 'https://parade0393.github.io/vtable-guild'
const NEW_DISCUSSION_URL = 'https://github.com/parade0393/vtable-guild/discussions/new'

const text = computed(() =>
  lang.value.startsWith('en')
    ? {
        prompt: 'Something wrong or unclear on this page?',
        link: 'Tell us in Discussions',
        title: 'Docs feedback: ',
        page: 'Page: ',
      }
    : { prompt: '这页有问题或建议？', link: '去讨论区反馈', title: '文档反馈：', page: '页面：' },
)

const feedbackUrl = computed(() => {
  // cleanUrls：guide/index.md → guide/，guide/sorting.md → guide/sorting
  const path = page.value.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  const query = new URLSearchParams({
    category: 'q-a',
    title: `${text.value.title}${page.value.title}`,
    body: `${text.value.page}${SITE_URL}/${path}\n\n`,
  })
  return `${NEW_DISCUSSION_URL}?${query}`
})
</script>

<template>
  <p class="vtg-doc-feedback">
    {{ text.prompt }}
    <a :href="feedbackUrl" target="_blank" rel="noreferrer">{{ text.link }}</a>
  </p>
</template>

<style scoped>
.vtg-doc-feedback {
  margin: 0 0 24px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.vtg-doc-feedback a {
  margin-left: 4px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
