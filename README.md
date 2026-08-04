<h1 align="center">vtable-guild</h1>

<p align="center">
  面向 <b>ant-design-vue</b> / <b>element-plus</b> 用户的 Vue 3 表格替换件<br/>
  保留你熟悉的 columns 心智，补上虚拟滚动和一套真正能改的样式系统
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm version" src="https://img.shields.io/npm/v/@vtable-guild/vtable-guild?logo=npm&color=cb3837"></a>
  <a href="https://www.npmjs.com/package/@vtable-guild/vtable-guild"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@vtable-guild/vtable-guild?color=2b7489"></a>
  <a href="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/parade0393/vtable-guild/actions/workflows/ci.yml/badge.svg"></a>
  <a href="#体积与依赖"><img alt="bundle size" src="https://img.shields.io/badge/gzip-53%20KB%20JS%20%2B%209.4%20KB%20CSS-44cc11"></a>
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
- **要单元格编辑、Excel 导出、列拖拽换序、右键菜单**：都没有，这些是 [vxe-table](https://vxetable.cn/) 的主场，它的功能面比这里宽得多
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

排序（受控 / 非受控双轨、多列）· 筛选（多选 / 单选 / 树形 / 搜索 / 自定义面板）· 行选择（checkbox / radio / 批量菜单 / `checkStrictly`）· 展开行 · 树形数据 · 固定列与固定表头 · 多级表头 · 单元格合并 · 列宽拖拽 · title / footer / summary · sticky · 虚拟滚动 · 内置 locale（zh-CN / en-US）· `EXPAND_COLUMN` 与 `SELECTION_COLUMN` 占位常量。

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

v2.4.0 本地构建实测（`gzip -9`）：

| 产物                                  | raw      | gzip        |
| ------------------------------------- | -------- | ----------- |
| ESM 全量（105 个模块）                | 239.0 KB | **53.0 KB** |
| `css/style.css`（prebuilt 全量）      | 57.0 KB  | **9.4 KB**  |
| `css/tailwind4.css`                   | 15.5 KB  | 3.8 KB      |
| `dist/index.full.mjs`（浏览器单文件） | 297.7 KB | 63.7 KB     |

产物用 `preserveModules` 输出，可 tree-shake，实际打进去的一般少于 53 KB。运行时依赖只有一个 `tailwind-variants`，peer 只有 `vue ^3.5.0`。

## 性能

别信这段话，[**自己跑一遍**](https://parade0393.github.io/vtable-guild/perf/)——对照页会在你的机器上，把 vtable-guild、ant-design-vue Table 与 el-table-v2 放在同一批数据、同一套列配置下测一遍，并一键导出结果。

本机实测（2026-08-03 · Chrome 151 · Windows 11 · 8 核 · production 构建 · 中位数，`同步 render+patch / longtask` ms）：

| 10 万行            | 首次渲染         | 排序切换   | DOM 节点数 | 内存增量   |
| ------------------ | ---------------- | ---------- | ---------- | ---------- |
| **vtable-guild**   | 131 / 130        | 133 / 133  | 251        | 6.6 MB     |
| el-table-v2        | **5.0 / 0**      | **48 / 0** | **185**    | **0.8 MB** |
| ant-design-vue 4.x | 无虚拟滚动，未跑 | —          | —          | —          |

三条结论，包括对我们不利的：

- **对 antdv**：差距是数量级的。1k 行 antdv 首次渲染就要 1126 ms、7,058 个 DOM 节点；**1 万行单轮 112,657 ms（约 113 秒）**，实际不可用。前提说清楚——对照的是**不分页直出**场景，antdv 的常规解法是分页或改用 el-table-v2。
- **对 el-table-v2**：**它更快**，而且挂载耗时几乎与数据量无关（1k→10 万都是约 5 ms），我们是 12→131 ms，说明挂载期有 O(n) 预处理要优化。它的排序数字还已经包含了应用侧 `slice().sort()`（它不内置排序），不是口径便宜。
- **代价换的是什么**：el-table-v2 是纯 div 定高虚拟化——不支持不定行高、多级表头、单元格合并、内置排序与筛选面板，也没有语义化 `<table>`。这些正是 vtable-guild 多出来的开销买到的东西。

虚拟滚动本身是生效的：1k → 10 万行，DOM 节点数恒定 251、可视行数恒定 12 行。完整方法论、公平性契约与全部三档数据见[性能文档](./docs/performance.md)。

## 文档

- [快速开始](https://parade0393.github.io/vtable-guild/guide/getting-started) · [从 ant-design-vue 迁移](https://parade0393.github.io/vtable-guild/guide/migration-from-antd)
- [功能对比总览](https://parade0393.github.io/vtable-guild/comparison/) · [为什么这样设计](https://parade0393.github.io/vtable-guild/guide/architecture)
- [三层主题覆盖](https://parade0393.github.io/vtable-guild/guide/theme-overrides) · [CSS 变量参考](https://parade0393.github.io/vtable-guild/guide/theme-tokens) · [ui Slot 参考](https://parade0393.github.io/vtable-guild/guide/ui-slots-reference)
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
