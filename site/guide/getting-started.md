# 快速开始

## 环境要求

- Node `^20.19.0 || >=22.12.0`
- `pnpm >=10.28.0`
- Vue `^3.5.0`

## 安装

聚合包接入：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

按需接入：

```bash
pnpm add @vtable-guild/core @vtable-guild/table @vtable-guild/theme vue
```

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

## 最小示例

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
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Age', key: 'age', dataIndex: 'age', sorter: true },
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

## 主题与样式

- `@vtable-guild/theme/css` 默认加载 `antdv` 预设。
- 如需 `element-plus` 视觉风格，可继续引入 `@vtable-guild/theme/css/presets/element-plus`。
- 运行时通过 `createVTableGuild({ themePreset })` 与 `theme` 对象切换和覆盖主题。
- 单实例可以继续使用 `ui` 与 `class` 做最高优先级的 slot 覆盖。

## Playground 对照页

当前最适合参考的页面在 `playground/src/pages/`：

- `BasicPage.vue`：基础渲染与视觉状态
- `SortPage.vue`：排序
- `FilterPage.vue`：筛选
- `SelectionPage.vue`：行选择
- `VirtualPage.vue`：虚拟滚动
- `TreePage.vue`：树形表格
