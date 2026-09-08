---
title: Getting started
description: Install and initialize vtable-guild in a Vue 3 + Vite project and render your first high-performance table within minutes, with ant-design-vue and element-plus theme presets.
---

# Getting started

This page does one thing: get your first vtable-guild table running in an existing Vue 3 + Vite project as quickly as possible.

If you are already using ant-design-vue or element-plus, finish the initialization here first, then continue with the migration and theming pages (currently Chinese-only).

## Requirements

- Node `^20.19.0` or `>=22.12.0`
- pnpm `>=10.28.0`
- Vue `^3.5.0`
- Vite `^5` or newer

## Install

The component does not require Tailwind CSS in the host project. Install the package:

```bash
pnpm add @vtable-guild/vtable-guild
```

## Configure the style entry

vtable-guild supports three style modes: `prebuilt`, `tailwind3` and `tailwind4`.

### prebuilt

If your project does not use Tailwind CSS, import the prebuilt stylesheet entry directly.

For example, in `src/main.css`:

```css
@import '@vtable-guild/vtable-guild/css/style';
```

This entry ships pre-generated utilities for the library's internal styles. You do not need to install Tailwind CSS, configure `@tailwindcss/vite`, or scan this library's sources.

### tailwind3

If your project uses Tailwind CSS 3, use the Tailwind 3 entry and add the library's preset to your Tailwind config:

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

If your project uses Tailwind CSS 4, use the Tailwind 4 entry:

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

`@vtable-guild/vtable-guild/css/style`, `@vtable-guild/vtable-guild/css/tailwind3` and `@vtable-guild/vtable-guild/css/tailwind4` all include:

- the default `antdv` preset
- the `element-plus` preset
- theme tokens
- the base styles required by the components

Switching presets requires no extra CSS.

In prebuilt mode the library's internal utility classes are emitted with the `vtg-` prefix. In Tailwind 3/4 modes internal classes stay unprefixed. See [package consumption](/guide/package-consumption) (Chinese) for the full rules.

## Initialize the plugin

Import the global stylesheet and initialize the plugin in your entry file.

For example, in `src/main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import './main.css'

const app = createApp(App)

app.use(createVTableGuild())

app.mount('#app')
```

The default preset is `antdv`. To switch to the element-plus look, set `themePreset`:

```ts
app.use(
  createVTableGuild({
    themePreset: 'element-plus',
  }),
)
```

## Minimal example

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

## Where to go next

- To estimate migration cost: read [migrating from ant-design-vue](/guide/migration-from-antd) (Chinese)
- To unify the visual system: [three-layer theme overrides](/guide/theme-overrides) and [Table CSS variables](/guide/theme-tokens) (Chinese)
- To inspect the full API: the [English API Reference](/en/guide/api-reference)
