import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitepress'

// 导航 / 侧边栏与 locale 相关，分别挂在各 locale 的 themeConfig 下；
// sitemap/head/构建选项与 locale 无关，留在顶层。
const ignoreDeadLinks = [/^\/play\//, /^\/perf\//]

const zhTheme = {
  nav: [
    { text: '首页', link: '/' },
    { text: '指南', link: '/guide/' },
    { text: '对比', link: '/comparison/' },
    { text: 'API', link: '/guide/api-reference' },
    { text: 'Playground', link: '/play/', target: '_blank' },
    { text: '性能对照', link: '/perf/', target: '_blank' },
  ],
  sidebar: {
    '/guide/': [
      {
        text: '入门',
        items: [
          { text: '指南概览', link: '/guide/' },
          { text: '为什么选择 vtable-guild', link: '/guide/why' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '安装与使用', link: '/guide/installation' },
          { text: '从 ant-design-vue 迁移', link: '/guide/migration-from-antd' },
          { text: '包导入与样式', link: '/guide/package-consumption' },
        ],
      },
      {
        text: '功能',
        items: [
          { text: '排序', link: '/guide/sorting' },
          { text: '筛选', link: '/guide/filtering' },
          { text: '行选择', link: '/guide/selection' },
          { text: '展开行', link: '/guide/expandable-rows' },
          { text: '树形表格', link: '/guide/tree-table' },
          { text: '固定列', link: '/guide/fixed-columns' },
          { text: '虚拟滚动', link: '/guide/virtualization' },
          { text: '列宽拖拽', link: '/guide/column-resize' },
          { text: '列显示与列顺序', link: '/guide/column-display' },
          { text: '行拖拽排序', link: '/guide/row-drag-sort' },
          { text: '多级表头与合并', link: '/guide/grouped-and-merged-cells' },
          { text: '标题与摘要行', link: '/guide/title-footer-summary' },
          { text: '自定义行与插槽', link: '/guide/api-wiring-and-slots' },
          { text: '编辑', link: '/guide/editing' },
        ],
      },
      {
        text: '主题系统',
        items: [
          { text: '三层主题覆盖', link: '/guide/theme-overrides' },
          { text: 'Table CSS 变量参考', link: '/guide/theme-tokens' },
          { text: 'ui Slot 参考', link: '/guide/ui-slots-reference' },
          { text: '预设与语言', link: '/guide/presets-and-locales' },
        ],
      },
      {
        text: '参考',
        items: [
          { text: '为什么这样设计', link: '/guide/architecture' },
          { text: 'API Reference', link: '/guide/api-reference' },
          { text: '类型参考', link: '/guide/type-reference' },
        ],
      },
      {
        text: 'AI 工具',
        items: [{ text: 'LLMs.txt', link: '/guide/llms-txt' }],
      },
    ],
    '/comparison/': [
      {
        text: '对比',
        items: [
          { text: '功能对比总览', link: '/comparison/' },
          { text: '增强与独有能力', link: '/comparison/enhancements' },
        ],
      },
    ],
  },
  socialLinks: [{ icon: 'github', link: 'https://github.com/parade0393/vtable-guild' }],
  search: {
    provider: 'local' as const,
  },
  outline: {
    level: [2, 3] as [number, number],
  },
}

// 英文站先只挂已翻译页面；后续页面翻译完成后再往 sidebar 里追加。
const enTheme = {
  nav: [
    { text: 'Home', link: '/en/' },
    { text: 'Guide', link: '/en/guide/' },
    { text: 'API', link: '/en/guide/api-reference' },
    { text: 'Playground', link: '/play/', target: '_blank' },
    { text: 'Benchmarks', link: '/perf/', target: '_blank' },
    { text: '中文', link: '/', rel: 'alternate' },
  ],
  sidebar: {
    '/en/guide/': [
      {
        text: 'Getting started',
        items: [
          { text: 'Overview', link: '/en/guide/' },
          { text: 'Getting started', link: '/en/guide/getting-started' },
        ],
      },
      {
        text: 'Reference',
        items: [{ text: 'API Reference', link: '/en/guide/api-reference' }],
      },
    ],
  },
  socialLinks: [{ icon: 'github', link: 'https://github.com/parade0393/vtable-guild' }],
  search: {
    provider: 'local' as const,
  },
  outline: {
    level: [2, 3] as [number, number],
  },
}

export default defineConfig({
  base: '/vtable-guild/',
  cleanUrls: true,
  // /play/ 与 /perf/ 是独立构建的应用，部署时才拷进 .vitepress/dist，
  // 不在 VitePress 的页面图里，死链检查要跳过。
  ignoreDeadLinks,
  sitemap: {
    // VitePress 1.6 的 sitemap 生成不拼接 base（SitemapStream 会丢弃 hostname 里的路径），
    // 用 transformItems 手动补 /vtable-guild/ 前缀，保证 URL 与实际部署路径一致。
    hostname: 'https://parade0393.github.io/vtable-guild',
    transformItems: (items) =>
      items.map((item) => ({
        ...item,
        url: `/vtable-guild/${item.url.replace(/^\//, '')}`,
        links: item.links?.map((link) => ({
          ...link,
          url: `/vtable-guild/${link.url.replace(/^\//, '')}`,
        })),
      })),
  },
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'vtable-guild' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
  ],
  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      title: 'vtable-guild',
      description: '面向 ant-design-vue 和 element-plus 用户的高性能表格替换方案。',
      themeConfig: zhTheme,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'vtable-guild',
      description:
        'A high-performance Vue table replacement for ant-design-vue and element-plus users, with built-in virtual scrolling.',
      themeConfig: enTheme,
    },
  },
  vite: {
    ssr: {
      // 强制让 Vite 打包工作区包，而不是交给 Node 外部化——
      // 避免 SSR 构建阶段的 ESM 解析问题。
      noExternal: ['@vtable-guild/vtable-guild'],
    },
  },
  buildEnd(siteConfig) {
    // ---- llms.txt / llms-full.txt ----
    // Agent（Claude Code / Codex 等）不浏览 VitePress 站点，只抓纯文本。
    // 构建时把全部文档页的 markdown 原文汇总成两个 LLM 友好文件写进 outDir。
    const siteRoot = process.cwd()
    const outDir = siteConfig.outDir
    const siteUrl = 'https://parade0393.github.io/vtable-guild'
    interface DocPage {
      url: string
      title: string
      description: string
      body: string
      lang: 'zh' | 'en'
    }

    const collect = (dir: string): string[] => {
      try {
        return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory()
            ? collect(join(dir, e.name))
            : e.name.endsWith('.md')
              ? [join(dir, e.name)]
              : [],
        )
      } catch {
        return []
      }
    }

    const parseFrontmatter = (raw: string) => {
      const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
      if (!fm) return { meta: {} as Record<string, string>, body: raw }
      const meta: Record<string, string> = {}
      for (const line of fm[1].split('\n')) {
        const m = /^(title|description):\s*(.+)$/.exec(line.trim())
        if (m) meta[m[1]] = m[2].trim()
      }
      return { meta, body: raw.slice(fm[0].length) }
    }

    const titleFrom = (meta: Record<string, string>, body: string, file: string) =>
      meta.title || /^#\s+(.+)$/m.exec(body)?.[1]?.trim() || file

    // 展开 VitePress 的 <<< @/demos/xxx.vue 与 <Demo src="xxx"> 语法
    const expandDemoSyntax = (body: string): string => {
      // 展开 <<< @/demos/xxx.vue
      body = body.replace(/<<<\s+@\/demos\/([^\s]+)/g, (_, demoPath) => {
        const fullPath = join(siteRoot, 'demos', demoPath)
        try {
          const demoContent = readFileSync(fullPath, 'utf8')
          return `\`\`\`vue\n// @/demos/${demoPath}\n${demoContent.trim()}\n\`\`\``
        } catch {
          return `<!-- demo not found: @/demos/${demoPath} -->`
        }
      })

      // 移除 <Demo src="xxx"> 组件标签（VitePress 自定义组件，agent 无法解析）
      // 但保留对应的 demo 文件引用（已经被上面的 <<< 展开）
      body = body.replace(/<Demo\s+src="[^"]+"\s*\/?>(\s*<\/Demo>)?/g, '')

      return body
    }

    const sources: Array<{ dir: string; urlPrefix: string; lang: 'zh' | 'en' }> = [
      { dir: join(siteRoot, 'guide'), urlPrefix: 'guide', lang: 'zh' },
      { dir: join(siteRoot, 'comparison'), urlPrefix: 'comparison', lang: 'zh' },
      { dir: join(siteRoot, 'en', 'guide'), urlPrefix: 'en/guide', lang: 'en' },
    ]
    const pages: DocPage[] = []

    for (const { dir, urlPrefix, lang } of sources) {
      for (const file of collect(dir)) {
        const raw = readFileSync(file, 'utf8')
        const { meta, body } = parseFrontmatter(raw)
        const rel = file.slice(dir.length + 1).replace(/\.md$/, '')
        const url = urlPrefix + (rel === 'index' ? '' : `/${rel}`)
        pages.push({
          url: `${siteUrl}/${url}`,
          title: titleFrom(meta, body, rel),
          description: meta.description || '',
          body: expandDemoSyntax(body),
          lang,
        })
      }
    }
    // 根首页（layout: home）
    const homeRaw = readFileSync(join(siteRoot, 'index.md'), 'utf8')
    const home = parseFrontmatter(homeRaw)
    pages.unshift({
      url: siteUrl,
      title: 'vtable-guild',
      description:
        home.meta.description || '面向 ant-design-vue 和 element-plus 用户的高性能表格替换方案。',
      body: expandDemoSyntax(home.body),
      lang: 'zh',
    })

    const zhPages = pages.filter((p) => p.lang === 'zh')
    const enPages = pages.filter((p) => p.lang === 'en')

    const llmsTxt = [
      '# vtable-guild',
      '',
      '> 面向 ant-design-vue 和 element-plus 用户的高性能 Vue 表格组件：内置纵向/横向虚拟滚动、固定列、行拖拽排序与三层主题系统。API 与 ant-design-vue Table 对齐。',
      '',
      'Chinese-first docs with partial English coverage. 文档站为中文主导向，英文覆盖入门与 API。',
      '',
      '## 中文文档',
      '',
      ...zhPages.map((p) => `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}`),
      '',
      '## English docs',
      '',
      ...enPages.map((p) => `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}`),
      '',
      '## For coding agents',
      '',
      `- Full docs in one file: ${siteUrl}/llms-full.txt`,
      `- Repository: https://github.com/parade0393/vtable-guild`,
      '',
    ].join('\n')

    const llmsFullTxt = [
      '# vtable-guild — full documentation',
      '',
      '> 面向 ant-design-vue 和 element-plus 用户的高性能 Vue 表格组件。以下为全部文档页的 markdown 原文。',
      '',
      ...pages.flatMap((p) => ['---', `<!-- page: ${p.url} -->`, '', p.body.trim(), '']),
    ].join('\n')

    writeFileSync(join(outDir, 'llms.txt'), llmsTxt)
    writeFileSync(join(outDir, 'llms-full.txt'), llmsFullTxt)
  },
})
