import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/core'

// Playground CSS 入口（Tailwind + 语义化 token）
import './main.css'

const app = createApp(App)

// ---- 全局主题配置（Layer 2） ----
const vtg = createVTableGuild({
  theme: {
    table: {
      // 全局覆盖 th 样式，验证合并逻辑
      slots: { th: 'uppercase tracking-wider' },
    },
  },
})

app.use(vtg)
app.mount('#app')
