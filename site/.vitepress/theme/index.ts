import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import Demo from './components/Demo.vue'
import './style.css'

// 文档站使用 prebuilt 模式（默认 cssMode），与独立 Playground 完全一致：
// 运行时输出 vtg- 前缀 class，配 css/style.css 即可，浏览器侧不需要跑 Tailwind。
// css/style.css 不含 preflight/全局 reset，只有前缀 utility + token + .dark 覆盖，
// 注入 VitePress 不会影响文档排版，暗色模式还能直接跟随 VitePress 的 .dark。
import '@vtable-guild/vtable-guild/css/style'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(createVTableGuild())
    app.component('Demo', Demo)
  },
} satisfies Theme
