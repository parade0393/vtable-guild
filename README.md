[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/parade0393/vtable-guild)

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

# vtable-guild

`vtable-guild` is a highly customizable Vue 3 table component library designed to seamlessly replace the hard-to-extend parts of `ant-design-vue` or `element-plus` Table components while preserving your existing design system.

**Why not use their native Tables directly?**

- `ant-design-vue` uses native scrollbars; when a scrollbar appears, the table header renders an extra empty column for alignment, which looks awkward. It also lacks virtual scrolling.
- `element-plus`'s `el-table` doesn't support pure configuration-driven usage, and while `el-table-v2` supports virtual scrolling, its API is cumbersome.
- Both lack a unified theme extensibility mechanism.

**vtable-guild's approach:**

- API aligned with `ant-design-vue Table` — low migration cost
- Scrollbar approach inspired by `element-plus` — more consistent visuals
- Built-in virtual scrolling — out of the box
- Three-layer theme merging model (default theme → global config → instance props) — fine-grained overrides down to individual slots

Built-in presets: `antdv` (default), `element-plus`.

## Status

- Basic table, sorting, filtering, selection, tree data, and virtual scrolling are ready for integration.
- Playground covers comparison pages for both `ant-design-vue` and `element-plus` presets.

## Requirements

- Node `^20.19.0 || >=22.12.0`
- `pnpm >=10.28.0`
- Vue `^3.5.0`
- You need to install and set up the target UI library yourself, e.g. `ant-design-vue` or `element-plus`

## Install

```bash
pnpm add @vtable-guild/vtable-guild
pnpm add -D tailwindcss @tailwindcss/vite
```

## Setup

### 1. Configure Vite Plugin

Register `@tailwindcss/vite` in your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

### 2. Import Styles

Add the following to your CSS entry file (e.g. `main.css`):

```css
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css';
```

For Tailwind CSS 3 projects, use the dedicated entry point. The utilities this library depends on are pre-generated, so you don't need to scan this package or copy semantic color tokens in `tailwind.config.js`:

```css
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Then import the CSS file in `main.ts`:

```ts
import './main.css'
```

> [!IMPORTANT] Coexisting with unlayered CSS resets (ant-design-vue / normalize.css etc.)
>
> This library is built on Tailwind v4, where all utilities are generated inside `@layer utilities`. Per the [CSS Cascade Layers spec](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), **unlayered (not in any layer) normal CSS rules win over any rules inside a layer**, regardless of specificity.
>
> If your project also imports an unlayered CSS reset such as:
>
> - `ant-design-vue/dist/reset.css`
> - `normalize.css`
> - Any hand-written global reset
>
> Rules like `button { color: inherit }`, `input { ... }` will **override** the Tailwind utilities this library's Button, Input, and other components rely on (typical symptom: text color missing on "Reset / OK" buttons in filter dropdowns).
>
> **Correct setup**: use the `layer()` modifier on `@import` to explicitly place the reset in a layer before `utilities`, and declare the layer order upfront:
>
> ```css
> @layer antd-reset, theme, base, components, utilities;
>
> @import 'ant-design-vue/dist/reset.css' layer(antd-reset);
> @import 'tailwindcss';
> @import '@vtable-guild/vtable-guild/css';
> ```
>
> Also remove any JS-side side-effect imports like `import 'ant-design-vue/dist/reset.css'` from `main.ts` — let the CSS-side `@import ... layer(...)` handle it instead (JS imports bypass the layer modifier).
>
> The playground doesn't hit this issue because it doesn't import `ant-design-vue/dist/reset.css`; but production projects typically need that reset, so please follow the setup above.

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
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
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

## Adjusting Selection / Expand Column Positions

Inspired by ant-design-vue's `Table.EXPAND_COLUMN` / `Table.SELECTION_COLUMN` design, you can insert these two placeholder constants anywhere in the `columns` array. The corresponding expand icon column or checkbox selection column will appear at that position instead of the default leftmost position. This only takes effect when the related feature (`expandable` / `rowSelection`) is enabled; duplicate placeholders of the same type only take effect at the first position.

```ts
import { VTable, EXPAND_COLUMN, SELECTION_COLUMN } from '@vtable-guild/vtable-guild'
// Also available as VTable.EXPAND_COLUMN / VTable.SELECTION_COLUMN

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  EXPAND_COLUMN,
  { title: 'Age', dataIndex: 'age', key: 'age' },
  SELECTION_COLUMN,
  { title: 'Address', dataIndex: 'address', key: 'address' },
]
```

> Placeholder constants are only recognized at the top level of `columns` — they won't be found inside `ColumnGroupType.children`. This is consistent with ant-design-vue.

## Theme Presets

- Importing `@vtable-guild/vtable-guild/css` uses the `antdv` preset by default (all preset styles are included in one import).
- Switching presets only requires specifying `themePreset` on the JS side — no additional CSS imports needed.
- Control the theme preset at runtime via `createVTableGuild({ themePreset })`, and override via `theme` or component `ui` props.

```ts
// Switch to element-plus preset — JS side only, no extra CSS needed
app.use(createVTableGuild({ themePreset: 'element-plus' }))
```

## Acknowledgements

- [ant-design-vue](https://antdv.com/components/overview) — the "teacher" for the API; column config, change events, and dual-track controlled mode are all inspired by it
- [antdvNext](https://www.antdv-next.com/) — virtual list component used from this project
- [Nuxt UI](https://ui.nuxt.com/) — inspiration for the three-layer theme model; the slots / variants / `ui` prop philosophy all comes from it
- [tailwind-variants](https://www.tailwind-variants.org/) — the glue that makes the theme system work; slot merging, variant computation, and tailwind-merge integration all rely on it
- [liunx.do](https://linux.do/) — Learn AI, visit L-Station
