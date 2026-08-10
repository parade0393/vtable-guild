<h1 align="center">vtable-guild</h1>

<p align="center">
  面向 <b>ant-design-vue</b> / <b>element-plus</b> 用户的 Vue 3 表格替换件<br/>
  保留你熟悉的 columns 心智，补上虚拟滚动和一套真正能改的样式系统
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm version" src="https://img.shields.io/npm/v/@vtable-guild/vtable-guild?logo=npm&color=cb3837"></a>
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@vtable-guild/vtable-guild?color=2b7489"></a>
  <a href="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml/badge.svg"></a>
  <a href="#体积与依赖"><img alt="bundle size" src="https://img.shields.io/badge/gzip-58%20KB%20JS%20%2B%209.3%20KB%20CSS-44cc11"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@vtable-guild/vtable-guild?color=blue"></a>
  <a href="https://deepwiki.com/parade0393/vtable-guild"><img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg"></a>
</p>

<p align="center">
  <b><a href="https://parade0393.github.io/vtable-guild/">📖 文档</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/play/">🎮 在线体验</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/perf/">⚡ 性能对照</a></b> &nbsp;·&nbsp;
  <b><a href="https://parade0393.github.io/vtable-guild/guide/getting-started">🚀 快速开始</a></b> &nbsp;·&nbsp;
  <a href="https://parade0393.github.io/vtable-guild/comparison/">功能对比</a> &nbsp;·&nbsp;
  <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-virtual-scroll.gif" width="900" alt="10 万行虚拟滚动：DOM 里始终只有可视区的十几行">
  </a>
  <br/>
  <sub>10 万行数据，DOM 里始终只有可视区的十几行 · <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">点开自己滚一遍</a></sub>
</p>

## 它解决什么问题

如果你已经在用 ant-design-vue 或 element-plus，下面三件事大概率戳过你：

|                      | ant-design-vue 4.x       | element-plus 2.x                          | vtable-guild                                              |
| -------------------- | ------------------------ | ----------------------------------------- | --------------------------------------------------------- |
| **十万行怎么滚**     | `a-table` 不内置虚拟滚动 | 要换成 `el-table-v2`，另一套 API 和列定义 | `virtual` + `scroll.y`，还是同一套 `columns`              |
| **几百列怎么滚**     | 没有横向虚拟化           | `el-table-v2` 也只虚拟化行，不虚拟化列    | `virtualColumn`，200 列只渲染视口内的十几列               |
| **换一套视觉**       | —                        | —                                         | `themePreset: 'antdv' \| 'element-plus'`，改一行 JS       |
| **改某个单元格样式** | 覆盖组件 CSS 类名        | class / style / slot 组合                 | `ui` prop 精确到 slot，默认主题 → 全局配置 → 实例三层合并 |

它不是新的 UI 库，也不是 headless 逻辑层——**是一个自带样式、能塞进你现有设计体系的表格替换件**。

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/presets-and-locales">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-preset-switch.gif" width="900" alt="同一套 columns 在 antdv 与 element-plus 两套预设之间切换">
  </a>
  <br/>
  <sub>同一套 columns 与数据，换的只有一行 <code>themePreset</code></sub>
</p>

```ts
// 表头、边框、行高、排序图标整套跟着换，不用追加任何 CSS import
app.use(createVTableGuild({ themePreset: 'element-plus' }))
```

## 什么时候别用它

写在前面，省得你走到一半才发现：

- **要分页**：没有内置 `pagination`，需要自己接（`change` 事件只带 `filters / sorter / extra`）
- **要完整编辑引擎、Excel 导出、列拖拽换序、右键菜单**：单元格和整行编辑可通过 [`bodyCell`](https://parade0393.github.io/vtable-guild/guide/editing) 组合，但不内置编辑状态、校验和 Excel 式键盘导航；这些完整企业表格能力仍是 [vxe-table](https://vxetable.cn/) 的主场
- **有键盘可达性 / 无障碍合规要求**：目前排序头和筛选触发器还不能键盘操作，正在补
- **只需要一张基础表格**：原生 `a-table` / `el-table` 就够了，不必多引一个依赖

## 安装

```bash
pnpm add @vtable-guild/vtable-guild
```

环境要求：Vue `^3.5.0`、Node `^20.19.0 || >=22.12.0`。不需要装 Tailwind，也不强制装 ant-design-vue 或 element-plus。

## 快速开始

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
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, align: 'right', sorter: true },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: '在岗', value: 'active' },
      { text: '休假', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: '陈嘉', age: 28, status: 'active' },
  { key: '2', name: '林悦', age: 32, status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable />
</template>
```

想直接改代码看效果，不用装任何东西：**[🎮 打开 Playground](https://parade0393.github.io/vtable-guild/play/)**。

## 功能

排序（受控 / 非受控双轨、多列）· 筛选（多选 / 单选 / 树形 / 搜索 / 自定义面板）· 行选择（checkbox / radio / 批量菜单 / `checkStrictly`）· 展开行 · 树形数据 · 固定列与固定表头 · 多级表头 · 单元格合并 · 列宽拖拽 · 通过 `bodyCell` 组合单元格与整行编辑 · title / footer / summary · sticky · 虚拟滚动（纵向，外加可选的横向 `virtualColumn` 与定高快路径 `rowHeight`）· 内置 locale（zh-CN / en-US）· `EXPAND_COLUMN` 与 `SELECTION_COLUMN` 占位常量。

每一项在文档站都有**可以直接点的 demo**：[功能索引](https://parade0393.github.io/vtable-guild/guide/)。

## 样式接入

三种模式，按宿主项目怎么构建 CSS 来选：

| 模式               | 什么时候用          | CSS 入口                                   | 插件配置                                      |
| ------------------ | ------------------- | ------------------------------------------ | --------------------------------------------- |
| `prebuilt`（默认） | 项目里没有 Tailwind | `@vtable-guild/vtable-guild/css/style`     | `createVTableGuild()`                         |
| `tailwind3`        | 项目用 Tailwind 3   | `@vtable-guild/vtable-guild/css/tailwind3` | `createVTableGuild({ cssMode: 'tailwind3' })` |
| `tailwind4`        | 项目用 Tailwind 4   | `@vtable-guild/vtable-guild/css/tailwind4` | `createVTableGuild({ cssMode: 'tailwind4' })` |

`prebuilt` 下库内部的 utility 带 `vtg-` 前缀，覆盖时要用同前缀（`:ui="{ th: 'vtg-px-2' }"`）；两种 Tailwind 模式下内部 class 不带前缀，直接写 `px-2` 就能覆盖。

完整说明（自定义前缀、按需引入、SSR）见 [包导入与样式](https://parade0393.github.io/vtable-guild/guide/package-consumption)。

> [!IMPORTANT]
> **如果你的项目同时引了未分层的 CSS reset**（`ant-design-vue/dist/reset.css`、`normalize.css` 或手写 reset），必须用 `@import ... layer()` 把它收进 `utilities` 之前的层：
>
> ```css
> @layer antd-reset, theme, base, components, utilities;
>
> @import 'ant-design-vue/dist/reset.css' layer(antd-reset);
> @import 'tailwindcss';
> @import '@vtable-guild/vtable-guild/css/tailwind4';
> ```
>
> 按 [CSS Cascade Layers 规范](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@layer)，unlayered 的普通规则会胜过任何 layer 内的规则，与特异性无关——`button { color: inherit }` 会把筛选面板里「重置 / 确定」按钮的文字颜色压掉。同时要去掉 `main.ts` 里 `import 'ant-design-vue/dist/reset.css'` 这种 JS 侧副作用 import，它会绕过 `layer()`。

## 调整选择列 / 展开列位置

借鉴 ant-design-vue 的 `Table.EXPAND_COLUMN` / `Table.SELECTION_COLUMN`，把占位常量插进 `columns` 的任意位置：

```ts
import { EXPAND_COLUMN, SELECTION_COLUMN } from '@vtable-guild/vtable-guild'

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  EXPAND_COLUMN,
  { title: '年龄', dataIndex: 'age', key: 'age' },
  SELECTION_COLUMN,
  { title: '地址', dataIndex: 'address', key: 'address' },
]
```

只在对应特性（`expandable` / `rowSelection`）启用时生效；只识别 `columns` 顶层，不会进 `ColumnGroupType.children` 里找——这点与 ant-design-vue 一致。

## 体积与依赖

当前 master 本地构建实测（`gzip -9`）：

| 产物                                  | raw      | gzip        |
| ------------------------------------- | -------- | ----------- |
| ESM 全量（106 个模块）                | 251.6 KB | **57.9 KB** |
| `css/style.css`（prebuilt 全量）      | 57.5 KB  | **9.3 KB**  |
| `css/tailwind4.css`                   | 15.5 KB  | 3.8 KB      |
| `dist/index.full.mjs`（浏览器单文件） | 309.5 KB | 68.0 KB     |

产物用 `preserveModules` 输出，可 tree-shake，实际打进去的一般少于 57.9 KB。运行时依赖只有一个 `tailwind-variants`，peer 只有 `vue ^3.5.0`。

## 性能

别信这段话，[**自己跑一遍**](https://parade0393.github.io/vtable-guild/perf/)——对照页会在你的机器上，把 vtable-guild、ant-design-vue Table、antdv-next、el-table-v2 与 vxe-table 放在同一批数据、同一套列配置下测一遍（1k / 1 万 / 10 万行 × 6 / 50 / 200 列），并一键导出结果。

下面两张表**全部采自同一次会话**（2026-08-10 · Chrome 151 · Windows 11 · 8 核 · DPR 1 · production 构建 · 预热 1 轮丢弃 + 正式 5 轮取中位数），单元格是 `同步 render+patch / longtask`，单位 ms。

### 行数这条轴

| 10 万行 · 6 列     | 首次渲染         | 排序切换   | DOM 节点数 | 内存增量   |
| ------------------ | ---------------- | ---------- | ---------- | ---------- |
| **vtable-guild**   | 13 / 0           | 63 / 64    | 167        | 2.2 MB     |
| el-table-v2        | **6.5 / 0**      | **41 / 0** | 185        | **0.8 MB** |
| antdv-next Table   | 23 / 0           | 72 / 74    | **118**    | 10.3 MB    |
| vxe-table          | 213 / 458        | 336 / 336  | 451        | 26.6 MB    |
| ant-design-vue 4.x | 无虚拟滚动，未跑 | —          | —          | —          |

「滚动到底」与「连续滚动」四家 longtask 全是 0，没有区分度，故不列。

四条结论，包括对我们不利的：

- **对 antdv 4.x**：差距是数量级的。它不内置虚拟滚动，10 万行不分页直出意味着 60 万个单元格全进 DOM，对照页因此给它设了 6 万单元格的二次确认闸门。前提说清楚：对照的是**不分页直出**场景，antdv 的常规解法是分页或改用 el-table-v2。
- **对 el-table-v2**：**它仍然是挂载最快的**（6.5 vs 13 ms），但差距已经从数量级收敛到能力成本——它是纯 div + 定高 `FixedSizeGrid`，没有位置表要维护；我们的 13 ms 里含不定行高支持的初始化。关键是**挂载耗时已不随行数增长**：同一次会话里 1k 行 11 ms、10 万行 13 ms，DOM 节点数两档都是 167。
- **对 vxe-table**：10 万行下我们挂载快约 16×、排序快约 5×，且没有它那 458 ms 的 longtask。代价是它的功能面更宽（单元格编辑、Excel 导出、键盘导航），初始化更重是有来由的。
- **能力边界要一起看**：el-table-v2 必须定高，不支持多级表头 / 单元格合并 / 内置排序筛选，也没有语义化 `<table>`；antdv-next 的表体是 div，虚拟模式下不支持单元格合并。vxe-table 能力最全（表体实测也是 `<tbody><tr><td>`），但它的 `scroll-y` 类型注释写明「启用纵向虚拟滚动之后将不能支持动态行高」——**大数据档它同样要定高**。四家里在 10 万行虚拟滚动下还能保留不定行高的，目前只有我们，代价就是那 13ms 挂载里的初始化开销。

> 内存一列无法强制 GC，跨会话波动可达一个数量级，只能作数量级参考。这套指标里零噪声、无辩驳空间的是 DOM 节点数。

### 列数这条轴

起因是 [antdv-next#427](https://github.com/antdv-next/antdv-next/issues/427)：1 万行 × 200 列的宽表卡顿甚至崩溃，维护者确认没有横向虚拟滚动。行数那条轴现在几乎是免费的，列数却是另一回事——`virtualColumn` 就是为这一档做的：

<p align="center">
  <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">
    <img src="https://raw.githubusercontent.com/parade0393/vtable-guild/master/cover/hero-virtual-column.gif" width="900" alt="1 万行 × 200 列横向滚动：DOM 里始终只有十几列">
  </a>
  <br/>
  <sub>1 万行 × 200 列 —— 横向扫过 200 列，「渲染列数」始终是十几 · <a href="https://parade0393.github.io/vtable-guild/guide/virtualization">点开自己滚一遍</a></sub>
</p>

| 1 万行 × 200 列   | virtualColumn 关 | virtualColumn 开 | vxe-table    |
| ----------------- | ---------------- | ---------------- | ------------ |
| 可视列数          | 200（全部渲染）  | **13**           | 11           |
| 连续滚动 longtask | 4,391 ms         | **0**            | 0            |
| 滚动到底          | 0.0 / 164        | **0.0 / 0**      | 0.0 / 0      |
| DOM 节点数        | 3,659            | **1,415**        | 2,089        |
| 排序切换          | 126 / 219        | 75 / 75          | **21 / 0**   |
| 首次渲染          | 232 / 342        | 187 / 187        | **51 / 267** |

**滚动这一项已经和 vxe-table 一样是零 longtask**——#427 描述的宽表滚动卡顿开启后不再复现，DOM 节点数也降到它之下。两处仍然落后，说清楚：

- **排序** 75 / 75 对 21 / 0，仍慢约 3.5×
- **首次渲染** 187 对 51，仍慢约 3.7×。这是设计取舍不是缺陷：首帧还没有测量结果时我们刻意回落到渲染全部列，量到表头列宽后再收窄，宁可第一帧贵也不要按估算宽度定位然后错位。换来的是列宽不必声明数字，`auto` 和百分比都支持

（首次渲染那一行的 232 vs 187 不代表开启更快，两者波动区间重叠——关的那一档 5 轮里 min 174 / max 314。）

`virtualColumn` 严格 opt-in、默认关闭：6 列基准档开与不开完全持平，列不多时它既没有收益也没有代价。用法与已知边界见[虚拟滚动文档](https://parade0393.github.io/vtable-guild/guide/virtualization)。

虚拟滚动本身是生效的：同一次会话里 1k 行与 10 万行的 DOM 节点数都是 167、可视行数都是 12 行。完整方法论、公平性契约与全部档位数据见[性能文档](./docs/performance.md)。

## 文档

- [快速开始](https://parade0393.github.io/vtable-guild/guide/getting-started) · [从 ant-design-vue 迁移](https://parade0393.github.io/vtable-guild/guide/migration-from-antd)
- [功能对比总览](https://parade0393.github.io/vtable-guild/comparison/) · [为什么这样设计](https://parade0393.github.io/vtable-guild/guide/architecture)
- [三层主题覆盖](https://parade0393.github.io/vtable-guild/guide/theme-overrides) · [CSS 变量参考](https://parade0393.github.io/vtable-guild/guide/theme-tokens) · [ui Slot 参考](https://parade0393.github.io/vtable-guild/guide/ui-slots-reference)
- [虚拟滚动](https://parade0393.github.io/vtable-guild/guide/virtualization) · [编辑](https://parade0393.github.io/vtable-guild/guide/editing) · [自定义行与插槽](https://parade0393.github.io/vtable-guild/guide/api-wiring-and-slots)
- [API Reference](https://parade0393.github.io/vtable-guild/guide/api-reference) · [类型参考](https://parade0393.github.io/vtable-guild/guide/type-reference)
- [更新日志](./packages/vtable-guild/CHANGELOG.md) · [路线图](./docs/roadmap.md)

## 参与贡献

- [贡献指南](./CONTRIBUTING.md) —— 本地怎么跑起来、提交规范、什么时候需要加 changeset
- [安全策略](./SECURITY.md) —— 安全问题请走私密报告通道，不要开公开 issue
- 提 Bug 时请附一个 [Playground](https://parade0393.github.io/vtable-guild/play/) 复现链接，这是最省双方时间的方式
- 想知道什么在做、什么不做，看[路线图](./docs/roadmap.md)——分页是刻意不做的

## 致谢

- [ant-design-vue](https://antdv.com/components/overview) —— API 的「老师」，列配置、change 事件、双轨受控全套都在向它致敬
- [antdvNext](https://www.antdv-next.com/) —— 使用了它的虚拟列表组件
- [Nuxt UI](https://ui.nuxt.com/) —— 三层主题模型的灵感来源，slots / variants / `ui` prop 这套理念全部来自它
- [tailwind-variants](https://www.tailwind-variants.org/) —— 真正让主题系统跑起来的胶水，slots 合并、variant 计算、tailwind-merge 集成都靠它
- [linux.do](https://linux.do/) —— 学 AI，上 L 站

## License

[MIT](./LICENSE) © parade0393
