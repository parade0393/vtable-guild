# 快速开始

这一页只解决一件事：让你在已有 Vue 3 项目里尽快跑起第一张 vtable-guild 表格。

如果你已经在使用 ant-design-vue 或 element-plus，建议先按这里完成初始化，再根据项目情况阅读迁移与主题页面。

## 环境要求

- Node ^20.19.0 或 >=22.12.0
- pnpm >=10.28.0
- Vue ^3.5.0

## 安装

如果你希望用聚合入口接入：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

如果你更偏向按包拆分使用：

```bash
pnpm add @vtable-guild/core @vtable-guild/table @vtable-guild/theme vue
```

如果你的项目需要保持 ant-design-vue 或 element-plus 的整体视觉，也请继续安装并接入对应 UI 库本身。

## 初始化插件

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

默认预设是 antdv。如果你要切到 element-plus 风格，除了切换 themePreset，还需要补充对应的预设样式入口，详见 [包导入与样式](/guide/package-consumption)。

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

- 想评估替换成本，继续看 [从 ant-design-vue 迁移](/guide/migration-from-antd)。
- 想统一视觉体系，继续看 [三层主题覆盖](/guide/theme-overrides) 和 [预设与语言](/guide/presets-and-locales)。
- 想确认差异化能力，继续看 [功能对比总览](/comparison/)。
