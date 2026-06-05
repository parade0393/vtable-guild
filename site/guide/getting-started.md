# 快速开始

这一页只解决一件事：让你在已有 Vue 3 + Vite 项目里尽快跑起第一张 vtable-guild 表格。

如果你已经在使用 ant-design-vue 或 element-plus，建议先按这里完成初始化，再根据项目情况阅读迁移与主题页面。

## 环境要求

- Node `^20.19.0` 或 `>=22.12.0`
- pnpm `>=10.28.0`
- Vue `^3.5.0`
- Vite `^5` 或更高版本

## 安装

组件本身不要求宿主项目安装 Tailwind CSS。先安装组件包：

```bash
pnpm add @vtable-guild/vtable-guild
```

## 配置样式入口

vtable-guild 支持 `prebuilt`、`tailwind3` 和 `tailwind4` 三种样式模式。

### prebuilt

项目不使用 Tailwind CSS 时，直接引入完整预编译样式入口。

例如 `src/main.css`：

```css
@import '@vtable-guild/vtable-guild/css/style';
```

这个入口已经预生成组件库内部需要的 utilities，使用它时不需要安装 Tailwind CSS、配置 `@tailwindcss/vite` 或扫描本库源码。

### tailwind3

项目使用 Tailwind CSS 3 时，使用 Tailwind 3 入口，并在 Tailwind 配置中加入组件库 preset：

```js
import vtableGuildTailwind3Preset from '@vtable-guild/vtable-guild/tailwind3-preset'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
    './node_modules/@vtable-guild/**/*.{js,mjs}',
  ],
  presets: [vtableGuildTailwind3Preset],
}
```

```css
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
app.use(createVTableGuild({ cssMode: 'tailwind3' }))
```

### tailwind4

项目使用 Tailwind CSS 4 时，使用 Tailwind 4 入口：

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

```css
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

```ts
app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

`@vtable-guild/vtable-guild/css/style`、`@vtable-guild/vtable-guild/css/tailwind3` 和 `@vtable-guild/vtable-guild/css/tailwind4` 均已包含：

- 默认的 `antdv` 预设
- `element-plus` 预设
- 主题 token
- 组件运行所需的基础样式

切换预设不需要额外追加 CSS。

预编译模式下，库内部 utility class 会输出 `vtg-` 前缀。Tailwind 3/4 模式下，内部 class 保持无前缀。详细规则见 [包导入与样式](/guide/package-consumption)。

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
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
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
