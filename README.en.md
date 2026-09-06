<h1 align="center">vtable-guild</h1>

<p align="center">
  A Vue 3 table drop-in for teams already using <b>ant-design-vue</b> or <b>element-plus</b><br/>
  Keep the <code>columns</code> model you know — gain virtual scrolling and a theme system you can actually override
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm version" src="https://img.shields.io/npm/v/@vtable-guild/vtable-guild?logo=npm&color=cb3837"></a>
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@vtable-guild/vtable-guild?color=2b7489"></a>
  <a href="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml/badge.svg"></a>
  <a href="#size-and-dependencies"><img alt="bundle size" src="https://img.shields.io/badge/gzip-58%20KB%20JS%20%2B%209.3%20KB%20CSS-44cc11"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@vtable-guild/vtable-guild?color=blue"></a>
  <a href="https://deepwiki.com/parade0393/vtable-guild"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
</p>

<p align="center">
  <b><a href="https://parade0393.github.io/vtable-guild/">📖 Docs</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/play/">🎮 Playground</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/perf/">⚡ Benchmarks</a></b> &nbsp;·&nbsp;
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
| **Scrolling 200 columns**       | No column virtualization                    | `el-table-v2` virtualizes rows only, never columns        | `virtualColumn` — only the columns in view are rendered                             |
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
- **You need a full editing engine, Excel export, column reordering or a context menu** — cell and row editing can be composed through [`bodyCell`](https://parade0393.github.io/vtable-guild/guide/editing), but there is no built-in edit state, validation or Excel-style keyboard navigation. Those full enterprise-table capabilities remain [vxe-table](https://vxetable.cn/)'s territory
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

Sorting (controlled / uncontrolled, multi-column) · filtering (multi / single / tree / search / custom dropdown) · row selection (checkbox / radio / batch menu / `checkStrictly`) · expandable rows · tree data · fixed columns and header · grouped headers · cell merging · column resizing · cell and row editing composed through `bodyCell` · title / footer / summary · sticky · virtual scrolling (rows, plus opt-in column virtualization via `virtualColumn` and a fixed-height fast path via `rowHeight`) · built-in locales (zh-CN / en-US) · `EXPAND_COLUMN` and `SELECTION_COLUMN` placeholders.

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

Measured on the current master (`gzip -9`):

| Artifact                                    | raw      | gzip        |
| ------------------------------------------- | -------- | ----------- |
| Full ESM output (106 modules)               | 251.6 KB | **57.9 KB** |
| `css/style.css` (prebuilt, everything)      | 57.5 KB  | **9.3 KB**  |
| `css/tailwind4.css`                         | 15.5 KB  | 3.8 KB      |
| `dist/index.full.mjs` (browser single file) | 309.5 KB | 68.0 KB     |

Output uses `preserveModules` and is tree-shakeable, so real-world cost is typically below 57.9 KB. One runtime dependency (`tailwind-variants`); one peer (`vue ^3.5.0`).

## Performance

Don't take our word for it — [**run it yourself**](https://parade0393.github.io/vtable-guild/perf/). The comparison page measures vtable-guild, ant-design-vue Table, antdv-next, el-table-v2 and vxe-table on your machine, with the same data and the same column config (1k / 10k / 100k rows × 6 / 50 / 200 columns), and exports the results in one click.

Both tables below come from **a single session** (2026-08-10 · Chrome 151 · Windows 11 · 8 cores · DPR 1 · production build · 1 warmup round discarded + 5 measured rounds, median). Cells are `sync render+patch / longtask`, in ms.

### The row axis

| 100k rows · 6 cols | First render      | Sort toggle | DOM nodes | Memory delta |
| ------------------ | ----------------- | ----------- | --------- | ------------ |
| **vtable-guild**   | 13 / 0            | 63 / 64     | 167       | 2.2 MB       |
| el-table-v2        | **6.5 / 0**       | **41 / 0**  | 185       | **0.8 MB**   |
| antdv-next Table   | 23 / 0            | 72 / 74     | **118**   | 10.3 MB      |
| vxe-table          | 213 / 458         | 336 / 336   | 451       | 26.6 MB      |
| ant-design-vue 4.x | no virtual scroll | —           | —         | —            |

"Scroll to bottom" and "continuous scroll" are omitted: longtask is 0 for all four, so the column tells you nothing.

Four takeaways, including the ones that don't flatter us:

- **vs antdv 4.x**: the gap is an order of magnitude. It has no built-in virtual scrolling, so 100k unpaginated rows means 600k cells in the DOM — the comparison page gates it behind a confirmation above 60k cells. To be fair about the premise: this compares _unpaginated_ rendering, and antdv's normal answer at this scale is pagination or el-table-v2.
- **vs el-table-v2**: **it is still the fastest to mount** (6.5 vs 13 ms), but the gap has narrowed from an order of magnitude to a capability cost — it is pure-div with a fixed-height `FixedSizeGrid` and no position table to maintain, while our 13 ms includes initializing variable-row-height support. What matters is that **mount cost no longer grows with row count**: in the same session, 11 ms at 1k rows and 13 ms at 100k, with 167 DOM nodes at both sizes.
- **vs vxe-table**: at 100k rows we mount ~16× faster and sort ~5× faster, with none of its 458 ms longtask. In exchange its feature surface is far wider (cell editing, Excel export, keyboard navigation), which is a fair reason for heavier initialization.
- **Read the capability boundary alongside the numbers**: el-table-v2 requires fixed heights and supports no grouped headers, cell merging, or built-in sorting/filtering, and emits no semantic `<table>`; antdv-next renders its body as divs and drops cell merging in virtual mode. vxe-table has the widest feature surface (its body measures as real `<tbody><tr><td>`), but its own `scroll-y` typings state that enabling vertical virtual scrolling disables dynamic row heights — **so at this data size it too must be fixed-height**. Among the four, we are currently the only one that keeps variable row heights under 100k-row virtual scrolling, and the initialization that buys is exactly what sits inside our 13 ms mount.

> The memory column cannot force a GC and swings by an order of magnitude between sessions — treat it as an order-of-magnitude hint only. DOM node count is the noise-free number in this set.

### The column axis

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-virtual-column.gif" width="900" alt="Scrolling horizontally across 200 columns with only a dozen in the DOM">
  </a>
  <br/>
  <sub>10,000 rows × 200 columns — sweep across all 200, the rendered-column count never leaves the teens · <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">scroll it yourself</a></sub>
</p>

| 10k rows × 200 cols        | virtualColumn off | virtualColumn on | vxe-table    |
| -------------------------- | ----------------- | ---------------- | ------------ |
| Rendered columns           | 200 (all of them) | **13**           | 11           |
| Continuous-scroll longtask | 4,391 ms          | **0**            | 0            |
| Scroll to bottom           | 0.0 / 164         | **0.0 / 0**      | 0.0 / 0      |
| DOM nodes                  | 3,659             | **1,415**        | 2,089        |
| Sort toggle                | 126 / 219         | 75 / 75          | **21 / 0**   |
| First render               | 232 / 342         | 187 / 187        | **51 / 267** |

**Scrolling is now zero-longtask, same as vxe-table** — the wide-table stutter described in #427 no longer reproduces once it is on, and DOM node count drops below vxe-table's too. Two things still lag, stated plainly:

- **Sorting** 75 / 75 against 21 / 0 — still ~3.5× slower
- **First render** 187 against 51 — still ~3.7× slower. A deliberate trade-off, not a defect: with no measurements available on the first frame we fall back to rendering every column, then narrow the window once the header has been measured. A costly first frame beats positioning cells from estimated widths and getting them misaligned. In exchange, column widths need not be numeric — `auto` and percentages work

(The 232 vs 187 on the first-render row does not mean enabling it is faster; the ranges overlap — the "off" run spread min 174 / max 314 across its five rounds.)

`virtualColumn` is strictly opt-in and off by default: in the 6-column baseline, on and off are identical. With few columns it buys nothing and costs nothing. Usage and known limits: [virtual scrolling guide](https://parade0393.github.io/vtable-guild/guide/virtualization) (Chinese).

Virtual scrolling itself works as advertised: in the same session, both 1k and 100k rows sit at 167 DOM nodes and 12 rendered rows. Full methodology, the fairness contract and every data point are in the [performance doc](./docs/performance.md).

## Documentation

- [Getting started](https://parade0393.github.io/vtable-guild/guide/getting-started) · [Migrating from ant-design-vue](https://parade0393.github.io/vtable-guild/guide/migration-from-antd)
- [Feature comparison](https://parade0393.github.io/vtable-guild/comparison/) · [Design rationale](https://parade0393.github.io/vtable-guild/guide/architecture)
- [Three-layer theming](https://parade0393.github.io/vtable-guild/guide/theme-overrides) · [CSS variables](https://parade0393.github.io/vtable-guild/guide/theme-tokens) · [ui slot reference](https://parade0393.github.io/vtable-guild/guide/ui-slots-reference)
- [Virtual scrolling](https://parade0393.github.io/vtable-guild/guide/virtualization) · [Editing](https://parade0393.github.io/vtable-guild/guide/editing) · [Custom rows and slots](https://parade0393.github.io/vtable-guild/guide/api-wiring-and-slots)
- [API reference](https://parade0393.github.io/vtable-guild/guide/api-reference) · [Type reference](https://parade0393.github.io/vtable-guild/guide/type-reference)
- [Changelog](./packages/vtable-guild/CHANGELOG.md)

## Contributing

- [Contributing guide](./CONTRIBUTING.md) — local setup, commit conventions, when a changeset is needed
- [Security policy](./SECURITY.md) — report vulnerabilities privately, not via public issues
- When filing a bug, include a [Playground](https://parade0393.github.io/vtable-guild/play/) reproduction link — it saves everyone time
- Pagination is deliberately out of scope — this project is a table replacement, not a full UI library

## Acknowledgements

- [ant-design-vue](https://antdv.com/components/overview) — the "teacher" for the API; column config, change events, and dual-track controlled mode are all inspired by it
- [antdvNext](https://www.antdv-next.com/) — virtual list component used from this project
- [Nuxt UI](https://ui.nuxt.com/) — inspiration for the three-layer theme model; the slots / variants / `ui` prop philosophy all comes from it
- [tailwind-variants](https://www.tailwind-variants.org/) — the glue that makes the theme system work; slot merging, variant computation, and tailwind-merge integration all rely on it
- [linux.do](https://linux.do/) — Learn AI, visit L-Station

## License

[MIT](./LICENSE) © parade0393
