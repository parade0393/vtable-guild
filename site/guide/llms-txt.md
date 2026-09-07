---
title: LLMs.txt
description: 了解 vtable-guild 的 llms.txt 与 llms-full.txt，以及如何让 AI 编码工具读取组件文档。
---

<div class="llms-page">
  <section class="llms-hero">
    <p class="llms-kicker">AI-READY DOCUMENTATION / VTABLE-GUILD</p>
    <h1>LLMs.txt</h1>
    <p class="llms-hero__lead">
      给 Cursor、Codex、Claude Code 等 AI 编码工具一条更短、更稳定的文档入口，让它们先理解
      vtable-guild 的 API、边界和推荐用法，再开始生成代码。
    </p>
    <div class="llms-hero__actions">
      <a class="llms-button llms-button--primary" href="/vtable-guild/llms.txt">打开 llms.txt</a>
      <a class="llms-button" href="/vtable-guild/llms-full.txt">打开完整文档</a>
    </div>
    <div class="llms-hero__meta">
      <span>自动生成</span>
      <span>纯 Markdown</span>
      <span>中文主导 · English partial</span>
    </div>
  </section>
</div>

## 什么是 LLMs.txt？

`llms.txt` 是给大语言模型和 AI 编码 Agent 使用的文档索引。它把站点中的中文文档、英文文档和完整文档入口整理成一份轻量文本，让工具可以快速判断应该读取哪些内容。

它不是新的组件 API，也不会改变 `vtable-guild` 的运行时行为；它只是把已有文档整理成更适合机器读取的入口。

<div class="llms-resource-grid">
  <a class="llms-resource-card" href="/vtable-guild/llms.txt">
    <span class="llms-resource-card__eyebrow">INDEX / QUICK START</span>
    <strong>llms.txt</strong>
    <span>文档索引、页面描述和完整文档入口。适合先建立全局认识。</span>
    <span class="llms-resource-card__arrow">↗</span>
  </a>
  <a class="llms-resource-card" href="/vtable-guild/llms-full.txt">
    <span class="llms-resource-card__eyebrow">FULL CONTEXT / REFERENCE</span>
    <strong>llms-full.txt</strong>
    <span>合并后的全部 Markdown 文档，包含 API、功能边界和使用示例。</span>
    <span class="llms-resource-card__arrow">↗</span>
  </a>
</div>

## 应该使用哪个文件？

| 你的目标                          | 推荐资源                          | 原因                              |
| --------------------------------- | --------------------------------- | --------------------------------- |
| 让 AI 快速了解项目能做什么        | [`llms.txt`](/llms.txt)           | 内容短，包含文档索引和页面描述    |
| 生成具体的表格代码                | [`llms-full.txt`](/llms-full.txt) | 包含 props、slots、类型和限制说明 |
| 排查虚拟滚动、树表或 summary 问题 | `llms-full.txt` + 对应功能页      | 能同时看到 API 和场景边界         |

## 在 AI 工具中使用

不同工具对外部文档的入口名称可能不同，但使用方式基本一致：把 `llms.txt` 作为项目文档或远程资料加入上下文；当任务需要完整 API 细节时，再补充 `llms-full.txt`。

### Cursor

将下面的地址加入项目文档或远程资料：

```text
https://parade0393.github.io/vtable-guild/llms.txt
```

如果 AI 需要生成复杂的 `VTable` 配置，再让它读取：

```text
https://parade0393.github.io/vtable-guild/llms-full.txt
```

### Codex

在 Codex 的项目或任务上下文中加入下面的文档入口，让它在修改组件代码前先了解真实 API：

```text
https://parade0393.github.io/vtable-guild/llms.txt
```

需要完整 props、slots、类型和边界说明时，再补充 `llms-full.txt`。建议同时要求 Codex：

> 生成 vtable-guild 代码前，先参考项目中的 llms.txt；不要假设 ant-design-vue Table 尚未实现的 API 在 vtable-guild 中一定存在。

### Claude Code 和其他 Agent

把 `llms-full.txt` 下载或加入项目上下文后，适合用于以下任务：

- 根据现有 `columns` 和 `rowSelection` 生成迁移代码；
- 判断 `virtual`、`virtualColumn`、固定列和 `scroll.y` 是否可以组合；
- 根据运行时告警定位 `rowKey`、行高或虚拟化配置问题；
- 查询 `VTableSummary`、展开行、树形数据和主题覆盖的写法。

## 它是怎样生成的？

站点构建结束时会扫描 `site/` 下的 Markdown 页面，并把页面正文整理到构建产物目录：

```bash
pnpm --filter @vtable-guild/site build
```

生成结果为：

```text
site/.vitepress/dist/llms.txt
site/.vitepress/dist/llms-full.txt
```

因此，文档页面更新后不需要手工维护这两个文件；重新构建并部署站点即可同步内容。

## 给 Agent 的使用建议

1. 先读 `llms.txt`，确认文档范围和对应功能页。
2. 再读 `llms-full.txt` 或具体页面，确认真实 API 和限制。
3. 生成代码时显式配置稳定的 `rowKey`，不要凭经验补写未记录的 Table API。
4. 涉及虚拟滚动、树形数据、展开行或 summary 时，同时检查相关功能页的边界说明。

<div class="llms-callout">
  <strong>提示</strong>
  <span>这两个文件是机器友好的文档入口，不替代面向人的指南。想看完整示例和视觉行为，请继续从左侧功能文档或 Playground 开始。</span>
</div>

## 相关页面

- [API Reference](/guide/api-reference)
- [虚拟滚动](/guide/virtualization)
- [树形表格](/guide/tree-table)
- [标题、页脚与摘要行](/guide/title-footer-summary)
- [完整 Agent API 参考](https://github.com/parade0393/vtable-guild/blob/master/docs/AGENT_API.md)
