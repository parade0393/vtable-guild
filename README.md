# vtable-guild

`vtable-guild` 是一个面向 Vue 3 UI 生态的表格组件库，目标是在保留现有设计体系的前提下，替换原生表格组件中较难扩展的部分。当前预设围绕 `ant-design-vue` 和 `element-plus` 对齐，主题系统采用默认主题、全局配置、实例 props 三层合并模型。

## Packages

- `@vtable-guild/core`：主题系统、基础组件、插件与工具函数。
- `@vtable-guild/icons`：表格相关 SVG 图标组件。
- `@vtable-guild/theme`：主题对象、预设解析器和 CSS token。
- `@vtable-guild/table`：`VTable` 组件、composables 和类型定义。
- `@vtable-guild/vtable-guild`：聚合入口，统一导出 core、theme、table。

## Status

- 基础表格、排序、筛选、选择、树形和虚拟滚动能力已进入可集成状态。
- Playground 已覆盖 `ant-design-vue` 与 `element-plus` 两套预设对照页面。
- 当前正在补齐阶段 7/8：table 测试、VitePress 文档站、Changesets 与 CI/CD 发布流程。

## Requirements

- Node `^20.19.0 || >=22.12.0`
- `pnpm >=10.28.0`
- Vue `^3.5.0`
- 使用方需要自行安装并接入目标 UI 库，例如 `ant-design-vue` 或 `element-plus`

## Install

如果你希望从聚合包接入：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

如果你只需要表格与主题：

```bash
pnpm add @vtable-guild/table @vtable-guild/theme @vtable-guild/core vue
```

## Quick Start

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
import '@vtable-guild/theme/css'

const app = createApp(App)

app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)

app.component('VTable', VTable)
app.mount('#app')
```

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

- 默认导入 `@vtable-guild/theme/css` 时使用 `antdv` 预设。
- 如需切换到 `element-plus` 预设，可以在默认样式后继续引入 `@vtable-guild/theme/css/presets/element-plus`。
- 运行时通过 `createVTableGuild({ themePreset })` 控制主题预设，并可通过 `theme` 与组件 `ui` props 做覆盖。

```ts
import '@vtable-guild/theme/css'
import '@vtable-guild/theme/css/presets/element-plus'
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

## Release Flow

- `pnpm changeset`：记录本次包变更。
- `pnpm version`：应用版本号与 changelog 变更。
- `pnpm release`：执行 lint、type-check、test、build 并发布到 npm。

GitHub Actions 已预留两条工作流：

- `CI`：在 PR 和 `main` 分支上运行 lint、type-check、test、build。
- `Release`：在 `main` 分支上由 Changesets 生成版本 PR，或在存在变更集时自动发布。

## Monorepo Structure

```text
packages/
	core/
	icons/
	table/
	theme/
	vtable-guild/
playground/
site/
docs/
```

## Roadmap

- 近期重点：补齐 `packages/table` 测试、初始化 `site/` 文档站、打通首次发布流程。
- 设计与实现背景见 `docs/` 目录，当前执行计划以 [docs/roadmap.md](./docs/roadmap.md) 为准。
