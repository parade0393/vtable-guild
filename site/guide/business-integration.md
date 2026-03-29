# 业务项目完整接入

这一页给的是一条从零到可用的落地路径，目标不是罗列全部 API，而是让你在真实业务项目里最短路径把 `vtable-guild` 接起来。

## 1. 安装依赖

聚合包方案：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

如果你的项目已经明确区分运行时层级，也可以使用分包方案，详见 [包导入与样式入口](/guide/package-consumption)。

## 2. 在应用入口注册插件和样式

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/theme/css'

const app = createApp(App)

app.use(
  createVTableGuild({
    themePreset: 'antdv',
    locale: 'zh-CN',
  }),
)

app.mount('#app')
```

如果目标是 `element-plus` 视觉风格，需要同时：

```ts
import '@vtable-guild/theme/css'
import '@vtable-guild/theme/css/presets/element-plus'
```

并把 `themePreset` 切到 `element-plus`。

## 3. 定义 columns 与 dataSource

```ts
import type { ColumnsType } from '@vtable-guild/vtable-guild'

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
```

## 4. 在业务页面中落表格

```vue
<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    bordered
    hoverable
    :scroll="{ y: 420 }"
  />
</template>
```

## 5. 再逐步叠加高级能力

建议顺序：

1. 先接排序、筛选、行选择。
2. 再接固定列、展开行、树形数据或虚拟滚动。
3. 最后再做 `ui`、主题覆盖、slot 级别的细节定制。

## 6. 联调时优先看的地方

- 样式不对：先检查主题 CSS 是否已加载，以及 `themePreset` 是否与 CSS 入口一致。
- 文案不对：检查 `locale`、`locales`、`localeOverrides`。
- 固定列或虚拟滚动异常：优先到 playground 对照页复现。

## 推荐阅读顺序

- [快速开始](/guide/getting-started)
- [包导入与样式入口](/guide/package-consumption)
- [预设与语言](/guide/presets-and-locales)
- [主题覆盖](/guide/theme-overrides)

## 对照入口

- playground 入口：playground/src/App.vue
- 基础对照页：playground/src/pages/BasicPage.vue
- 高级能力对照页：playground/src/pages/AdvancedPage.vue
