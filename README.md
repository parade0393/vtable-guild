# vtable-guild

`vtable-guild` 是一个面向 Vue 3 的高度可定制表格组件库，设计目标是在保留现有设计体系的前提下，无缝替换 `ant-design-vue` 或 `element-plus` Table 组件中难以扩展的部分。

**为什么不直接用他们的原生 Table？**

- `ant-design-vue` 使用原生滚动条，出现滚动条时表头会多渲染一个空列来对齐，视觉上不美；且不支持虚拟滚动
- `element-plus` 的 `el-table` 不支持纯配置驱动，`el-table-v2` 虽支持虚拟滚动但 API 体验差
- 两者均缺乏统一的主题扩展机制

**vtable-guild 的策略：**

- API 对齐 `ant-design-vue Table`，迁移成本低
- 滚动条方案参考 `element-plus`，视觉更一致
- 内置虚拟滚动，开箱即用
- 三层主题合并模型（默认主题 → 全局配置 → 实例 props），覆盖粒度细至单个 slot

当前内置预设：`antdv`（默认）、`element-plus`。

## Status

- 基础表格、排序、筛选、选择、树形和虚拟滚动能力已进入可集成状态。
- Playground 已覆盖 `ant-design-vue` 与 `element-plus` 两套预设对照页面。

## Requirements

- Node `^20.19.0 || >=22.12.0`
- `pnpm >=10.28.0`
- Vue `^3.5.0`
- 使用方需要自行安装并接入目标 UI 库，例如 `ant-design-vue` 或 `element-plus`

## Install

```bash
pnpm add @vtable-guild/vtable-guild
pnpm add -D tailwindcss @tailwindcss/vite
```

## Setup

### 1. 配置 Vite 插件

在 `vite.config.ts` 中注册 `@tailwindcss/vite`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

### 2. 引入样式

在项目的 CSS 入口文件（如 `main.css`）中添加：

```css
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css';
```

然后在 `main.ts` 中导入该 CSS 文件：

```ts
import './main.css'
```

## Quick Start

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css'

const app = createApp(App)

app.use(createVTableGuild())
app.component('VTable', VTable)
app.mount('#app')
```

```vue
<script setup lang="ts">
import type { ColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: ColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 96, align: 'right', sorter: true },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
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

## Theme Presets

- 默认导入 `@vtable-guild/vtable-guild/css` 时使用 `antdv` 预设（所有预设样式已统一包含在内）。
- 切换预设只需在 JS 侧指定 `themePreset`，无需追加额外的 CSS import。
- 运行时通过 `createVTableGuild({ themePreset })` 控制主题预设，并可通过 `theme` 与组件 `ui` props 做覆盖。

```ts
// 切换到 element-plus 预设，只需改 JS 侧，无需追加 CSS
app.use(createVTableGuild({ themePreset: 'element-plus' }))
```

## Workspace Commands

```bash
pnpm install
pnpm dev
pnpm playground
pnpm test
pnpm lint
pnpm type-check
pnpm build
pnpm site:dev
```
