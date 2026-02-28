import { createApp } from 'vue'
import App from './App.vue'
import './main.css'
import { createVTableGuild } from '@vtable-guild/core'

// Playground CSS 入口（Tailwind + 语义化 token）

const app = createApp(App)

// ---- 全局主题配置（Layer 2） ----
const vtg = createVTableGuild({
  themePreset: 'antdv',
  theme: {},
})

app.use(vtg)
app.mount('#app')
