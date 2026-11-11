---
title: Getting started
description: Install and initialize vtable-guild in a Vue 3 + Vite project and get your first high-performance table running within minutes, with both the ant-design-vue and element-plus theme presets.
---

# Getting started

This page does one thing: get your first vtable-guild table running in an existing Vue 3 + Vite project as quickly as possible.

If you already use ant-design-vue or element-plus, finish the initialization here first, then read the migration and theming pages according to your project.

## Requirements

- Node `^20.19.0` or `>=22.12.0`
- pnpm `>=10.28.0`
- Vue `^3.5.0`
- Vite `^5` or newer
- For TypeScript projects, pinning to `5.9.3` is recommended; `6.0.3` has also been verified

## Install

::: warning TypeScript version limit
The `vue-tsc` toolchain verified by this project and the online Playground do not currently support TypeScript 7 or above. Use the verified TypeScript `5.9.3` or `6.0.3` first, and avoid installing `typescript@latest` directly.

The combination verified in a real project is Vue `3.5.26` and `vue-tsc 3.2.2`, together with the two TypeScript versions above. Type checking of plain `.ts` components passes under TS 7, but the existing `vue-tsc` cannot load its new compiler; other TS 7 Vue toolchains are not yet supported by this project. Earlier TypeScript versions also need separate verification.

The online Playground is pinned to TypeScript `5.9.3`. It relies on a browser-loadable JS compiler and standard library declarations, so it cannot use the TS 7 native compiler today; this limit has nothing to do with the component's JavaScript runtime.
:::

The component itself does not require the host project to install Tailwind CSS. First install the package:

```bash
pnpm add @vtable-guild/vtable-guild
```

When a TypeScript project needs to install or adjust its type checking tools, use the verified combination:

```bash
pnpm add -D -E typescript@5.9.3 vue-tsc@3.2.2
```

## Configure the style entry

vtable-guild supports three style modes: `prebuilt`, `tailwind3` and `tailwind4`.

### prebuilt

When the project does not use Tailwind CSS, import the full prebuilt style entry directly.

For example, in `src/main.css`:

```css
@import '@vtable-guild/vtable-guild/css/style';
```

This entry already pre-generates the utilities the library needs internally. Using it requires no Tailwind CSS installation, no `@tailwindcss/vite` configuration and no scanning of this library's sources.

### tailwind3

When the project uses Tailwind CSS 3, use the Tailwind 3 entry and add the library preset to the Tailwind config:

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

When the project uses Tailwind CSS 4, use the Tailwind 4 entry:

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
- the base styles the components need at runtime

Switching presets requires no extra CSS.

In prebuilt mode the library's internal utility classes are emitted with the `vtg-` prefix. In Tailwind 3/4 modes internal classes stay unprefixed. See [Package imports and styles](/en/guide/package-consumption) for the full rules.

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

The default preset is `antdv`. To switch to the element-plus look, just set `themePreset` to `element-plus`:

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

- To estimate the cost of replacing your table, continue with [Migrating from ant-design-vue](/en/guide/migration-from-antd)
- To unify the visual system, continue with [Three-layer theme overrides](/en/guide/theme-overrides) and [Table CSS variables](/en/guide/theme-tokens)
- To confirm the differentiating capabilities, continue with the [Feature comparison](/en/comparison/)

## Type Declarations

These are the plugin and column configuration declarations used on this page. The types they reference and the complete component props are in the [type reference](/en/guide/type-reference).

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

<<< @/.vitepress/type-declarations/table.ts#TableColumnsType

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

<<< @/.vitepress/type-declarations/table.ts#ColumnType

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

:::
