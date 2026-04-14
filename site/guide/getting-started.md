# 快速开始

这一页只解决一件事：让你在已有 Vue 3 + Vite 项目里尽快跑起第一张 vtable-guild 表格。

如果你已经在使用 ant-design-vue 或 element-plus，建议先按这里完成初始化，再根据项目情况阅读迁移与主题页面。

## 环境要求

- Node `^20.19.0` 或 `>=22.12.0`
- pnpm `>=10.28.0`
- Vue `^3.5.0`
- Vite `^7`

## 安装

除了组件包本身，你还需要在宿主项目里安装 Tailwind CSS 4 和 `@tailwindcss/vite`：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme
pnpm add -D tailwindcss @tailwindcss/vite
```

## 配置 Vite

在 `vite.config.ts` 里接入 `@tailwindcss/vite`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

## 配置样式入口

在你的全局样式文件里引入 Tailwind CSS 和 vtable-guild 的主题 CSS。

例如 `src/main.css`：

```css
@import 'tailwindcss';
@import '@vtable-guild/theme/css';
```

`@vtable-guild/theme/css` 已包含：

- Tailwind `@theme` token 注册
- 默认的 `antdv` 预设
- `element-plus` 预设
- 组件运行所需的基础样式

如果只是切换预设，不需要额外追加 CSS。

## 初始化插件

在入口文件里引入全局样式并初始化插件。

例如 `src/main.ts`：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import './main.css'

const app = createApp(App)

app.use(createVTableGuild())

app.mount('#app')
```

默认预设是 `antdv`。如果你要切到 `element-plus` 风格，只需把 `themePreset` 设为 `element-plus`：

```ts
app.use(
  createVTableGuild({
    themePreset: 'element-plus',
  }),
)
```

## 最小可用示例

```vue
<script setup lang="ts">
import { VTable, type ColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: ColumnsType<UserRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name', width: 180 },
  { title: 'Age', key: 'age', dataIndex: 'age', width: 96, align: 'right', sorter: true },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada Lovelace', age: 28, status: 'active' },
  { key: '2', name: 'Grace Hopper', age: 32, status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable />
</template>
```

## 下一步看什么

- 想评估替换成本，继续看 [从 ant-design-vue 迁移](/guide/migration-from-antd)
- 想统一视觉体系，继续看 [三层主题覆盖](/guide/theme-overrides) 和 [Table CSS 变量参考](/guide/theme-tokens)
- 想确认差异化能力，继续看 [功能对比总览](/comparison/)
