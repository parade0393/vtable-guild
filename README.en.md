<h1 align="center">vtable-guild</h1>

<p align="center">
  A Vue 3 table drop-in for teams already using <b>ant-design-vue</b> or <b>element-plus</b><br/>
  Keep the <code>columns</code> model you know — gain virtual scrolling and a theme system you can actually override
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm version" src="https://img.shields.io/npm/v/@vtable-guild/vtable-guild?logo=npm&color=cb3837"></a>
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@vtable-guild/vtable-guild?color=2b7489"></a>
  <a href="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml/badge.svg"></a>
  <a href="#size-and-dependencies"><img alt="bundle size" src="https://img.shields.io/badge/gzip-53%20KB%20JS%20%2B%209.4%20KB%20CSS-44cc11"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@vtable-guild/vtable-guild?color=blue"></a>
  <a href="https://deepwiki.com/parade0393/vtable-guild"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
</p>

<p align="center">
  <b><a href="https://parade0393.github.io/vtable-guild/">📖 Docs</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/play/">🎮 Playground</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/guide/getting-started">🚀 Getting started</a></b> &nbsp;·&nbsp;
  <a href="https://parade0393.github.io/vtable-guild/comparison/">Comparison</a> &nbsp;·&nbsp;
  <a href="./README.md">中文</a>
</p>

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-virtual-scroll.gif" width="900" alt="100,000 rows scrolling with only the visible dozen in the DOM">
  </a>
  <br/>
  <sub>100,000 rows — only the visible dozen ever exist in the DOM · <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">scroll it yourself</a></sub>
</p>

> The documentation site is in Chinese. The demos are interactive, so most pages are usable regardless of language.

## What it solves

If you already use ant-design-vue or element-plus, these three have probably bitten you:

|                                 | ant-design-vue 4.x                          | element-plus 2.x                                          | vtable-guild                                                                        |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Scrolling 100k rows**         | `a-table` has no built-in virtual scrolling | Requires `el-table-v2` — a different API and column model | `virtual` + `scroll.y`, same `columns`                                              |
| **Switching the visual system** | —                                           | —                                                         | `themePreset: 'antdv' \| 'element-plus'`, one line of JS                            |
| **Restyling one cell**          | Override component CSS classes              | class / style / slot combinations                         | `ui` prop targets a specific slot; default theme → global config → instance, merged |

It is not a new UI library, and not a headless logic layer — **it ships its own styles and is meant to slot into the design system you already have.**

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/presets-and-locales">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-preset-switch.gif" width="900" alt="The same columns rendered under the antdv and element-plus presets">
  </a>
  <br/>
  <sub>Same columns, same data — the only change is one <code>themePreset</code> line</sub>
</p>

```ts
// Header, borders, row height and sort icons all follow. No extra CSS import.
app.use(createVTableGuild({ themePreset: 'element-plus' }))
```

## When not to use it

Up front, so you don't find out halfway:

- **You need pagination** — there is no built-in `pagination`; wire your own (`change` only carries `filters / sorter / extra`)
- **You need cell editing, Excel export, column reordering or a context menu** — none of these exist. That is [vxe-table](https://vxetable.cn/)'s territory and its feature surface is far wider
- **You have keyboard-accessibility / a11y compliance requirements** — sort headers and filter triggers are not yet keyboard operable; this is being worked on
- **You just need a plain table** — native `a-table` / `el-table` is enough; don't add a dependency

## Install

```bash
pnpm add @vtable-guild/vtable-guild
```

Requires Vue `^3.5.0` and Node `^20.19.0 || >=22.12.0`. Tailwind is not required, and neither ant-design-vue nor element-plus is a hard dependency.

## Quick start

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style'

createApp(App).use(createVTableGuild()).mount('#app')
```

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

To edit code and see it run without installing anything: **[🎮 open the Playground](https://parade0393.github.io/vtable-guild/play/)**.

## Features

Sorting (controlled / uncontrolled, multi-column) · filtering (multi / single / tree / search / custom dropdown) · row selection (checkbox / radio / batch menu / `checkStrictly`) · expandable rows · tree data · fixed columns and header · grouped headers · cell merging · column resizing · title / footer / summary · sticky · virtual scrolling · built-in locales (zh-CN / en-US) · `EXPAND_COLUMN` and `SELECTION_COLUMN` placeholders.

Every one of these has a **live, clickable demo** in the docs: [feature index](https://parade0393.github.io/vtable-guild/guide/).

## Styling setup

Three modes, chosen by how the host app builds CSS:

| Mode                 | Use when                   | CSS entry                                  | Plugin config                                 |
| -------------------- | -------------------------- | ------------------------------------------ | --------------------------------------------- |
| `prebuilt` (default) | No Tailwind in the project | `@vtable-guild/vtable-guild/css/style`     | `createVTableGuild()`                         |
| `tailwind3`          | Project uses Tailwind 3    | `@vtable-guild/vtable-guild/css/tailwind3` | `createVTableGuild({ cssMode: 'tailwind3' })` |
| `tailwind4`          | Project uses Tailwind 4    | `@vtable-guild/vtable-guild/css/tailwind4` | `createVTableGuild({ cssMode: 'tailwind4' })` |

In `prebuilt` mode internal utilities carry a `vtg-` prefix, so overrides must use the same prefix (`:ui="{ th: 'vtg-px-2' }"`). In both Tailwind modes internal classes are unprefixed, so plain `px-2` overrides work.

Full details (custom prefixes, granular imports, SSR): [package consumption guide](https://parade0393.github.io/vtable-guild/guide/package-consumption).

> [!IMPORTANT]
> **If your project also imports an unlayered CSS reset** (`ant-design-vue/dist/reset.css`, `normalize.css`, or a hand-written one), you must pull it into a layer before `utilities` using `@import ... layer()`:
>
> ```css
> @layer antd-reset, theme, base, components, utilities;
>
> @import 'ant-design-vue/dist/reset.css' layer(antd-reset);
> @import 'tailwindcss';
> @import '@vtable-guild/vtable-guild/css/tailwind4';
> ```
>
> Per the [CSS Cascade Layers spec](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), unlayered rules beat anything inside a layer regardless of specificity — `button { color: inherit }` will strip the text color from the Reset / OK buttons in filter dropdowns. Also drop JS-side side-effect imports like `import 'ant-design-vue/dist/reset.css'` from `main.ts`; they bypass `layer()`.

## Moving the selection / expand column

Modeled on ant-design-vue's `Table.EXPAND_COLUMN` / `Table.SELECTION_COLUMN` — drop the placeholder anywhere in `columns`:

```ts
import { EXPAND_COLUMN, SELECTION_COLUMN } from '@vtable-guild/vtable-guild'

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  EXPAND_COLUMN,
  { title: 'Age', dataIndex: 'age', key: 'age' },
  SELECTION_COLUMN,
  { title: 'Address', dataIndex: 'address', key: 'address' },
]
```

Only takes effect when the corresponding feature (`expandable` / `rowSelection`) is enabled, and only recognized at the top level of `columns` — never inside `ColumnGroupType.children`. Same as ant-design-vue.

## Size and dependencies

Measured locally on v2.4.0 (`gzip -9`):

| Artifact                                    | raw      | gzip        |
| ------------------------------------------- | -------- | ----------- |
| Full ESM output (105 modules)               | 239.0 KB | **53.0 KB** |
| `css/style.css` (prebuilt, everything)      | 57.0 KB  | **9.4 KB**  |
| `css/tailwind4.css`                         | 15.5 KB  | 3.8 KB      |
| `dist/index.full.mjs` (browser single file) | 297.7 KB | 63.7 KB     |

Output uses `preserveModules` and is tree-shakeable, so real-world cost is typically below 53 KB. One runtime dependency (`tailwind-variants`); one peer (`vue ^3.5.0`).

## Documentation

- [Getting started](https://parade0393.github.io/vtable-guild/guide/getting-started) · [Migrating from ant-design-vue](https://parade0393.github.io/vtable-guild/guide/migration-from-antd)
- [Feature comparison](https://parade0393.github.io/vtable-guild/comparison/) · [Design rationale](https://parade0393.github.io/vtable-guild/guide/architecture)
- [Three-layer theming](https://parade0393.github.io/vtable-guild/guide/theme-overrides) · [CSS variables](https://parade0393.github.io/vtable-guild/guide/theme-tokens) · [ui slot reference](https://parade0393.github.io/vtable-guild/guide/ui-slots-reference)
- [API reference](https://parade0393.github.io/vtable-guild/guide/api-reference) · [Type reference](https://parade0393.github.io/vtable-guild/guide/type-reference)
- [Changelog](./packages/vtable-guild/CHANGELOG.md)

## Acknowledgements

- [ant-design-vue](https://antdv.com/components/overview) — the "teacher" for the API; column config, change events, and dual-track controlled mode are all inspired by it
- [antdvNext](https://www.antdv-next.com/) — virtual list component used from this project
- [Nuxt UI](https://ui.nuxt.com/) — inspiration for the three-layer theme model; the slots / variants / `ui` prop philosophy all comes from it
- [tailwind-variants](https://www.tailwind-variants.org/) — the glue that makes the theme system work; slot merging, variant computation, and tailwind-merge integration all rely on it
- [linux.do](https://linux.do/) — Learn AI, visit L-Station

## License

[MIT](./LICENSE) © parade0393
