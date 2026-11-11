---
title: LLMs.txt
description: Learn about vtable-guild's llms.txt and llms-full.txt, and how to let AI coding tools read the component documentation.
---

<div class="llms-page">
  <section class="llms-hero">
    <p class="llms-kicker">AI-READY DOCUMENTATION / VTABLE-GUILD</p>
    <h1>LLMs.txt</h1>
    <p class="llms-hero__lead">
      Give AI coding tools such as Cursor, Codex and Claude Code a shorter, more stable documentation entry, so they understand
      vtable-guild's API, boundaries and recommended usage before they start generating code.
    </p>
    <div class="llms-hero__actions">
      <a class="llms-button llms-button--primary" href="/vtable-guild/llms.txt">Open llms.txt</a>
      <a class="llms-button" href="/vtable-guild/llms-full.txt">Open the full documentation</a>
    </div>
    <div class="llms-hero__meta">
      <span>Auto-generated</span>
      <span>Plain Markdown</span>
      <span>中文 · English</span>
    </div>
  </section>
</div>

## What is LLMs.txt?

`llms.txt` is a documentation index for large language models and AI coding agents. It organizes the site's Chinese documentation, English documentation and the full documentation entry into one lightweight text file, so tools can quickly decide what to read.

It is not a new component API and does not change the runtime behavior of `vtable-guild`; it only organizes the existing documentation into an entry that is easier for machines to read.

<div class="llms-resource-grid">
  <a class="llms-resource-card" href="/vtable-guild/llms.txt">
    <span class="llms-resource-card__eyebrow">INDEX / QUICK START</span>
    <strong>llms.txt</strong>
    <span>Documentation index, page descriptions and the full documentation entry. Good for building an overall picture first.</span>
    <span class="llms-resource-card__arrow">↗</span>
  </a>
  <a class="llms-resource-card" href="/vtable-guild/llms-full.txt">
    <span class="llms-resource-card__eyebrow">FULL CONTEXT / REFERENCE</span>
    <strong>llms-full.txt</strong>
    <span>All Markdown documentation merged together, including the API, feature boundaries and usage examples.</span>
    <span class="llms-resource-card__arrow">↗</span>
  </a>
</div>

## Which file should you use?

| Your goal                                                    | Recommended resource                        | Why                                                       |
| ------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| Let the AI quickly learn what the project can do             | [`llms.txt`](/llms.txt)                     | Short, with the documentation index and page descriptions |
| Generate concrete table code                                 | [`llms-full.txt`](/llms-full.txt)           | Includes props, slots, types and limitations              |
| Troubleshoot virtual scrolling, tree table or summary issues | `llms-full.txt` + the matching feature page | Shows the API and the scenario boundaries together        |

## Using it in AI tools

Different tools may name their external documentation entry differently, but the usage is basically the same: add `llms.txt` to the context as project documentation or a remote resource; when the task needs complete API details, add `llms-full.txt` as well.

### Cursor

Add the address below to your project documentation or remote resources:

```text
https://parade0393.github.io/vtable-guild/llms.txt
```

If the AI needs to generate a complex `VTable` configuration, have it read this too:

```text
https://parade0393.github.io/vtable-guild/llms-full.txt
```

### Codex

Add the documentation entry below to Codex's project or task context, so it learns the real API before modifying component code:

```text
https://parade0393.github.io/vtable-guild/llms.txt
```

When you need complete props, slots, types and boundary notes, add `llms-full.txt` as well. It also helps to instruct Codex:

> Before generating vtable-guild code, consult the project's llms.txt first; do not assume that ant-design-vue Table APIs which have not been implemented necessarily exist in vtable-guild.

### Claude Code and other agents

Once `llms-full.txt` is downloaded or added to the project context, it suits tasks such as:

- generating migration code from existing `columns` and `rowSelection`;
- deciding whether `virtual`, `virtualColumn`, fixed columns and `scroll.y` can be combined;
- locating `rowKey`, row height or virtualization configuration problems from runtime warnings;
- looking up how to write `VTableSummary`, expandable rows, tree data and theme overrides.

## How is it generated?

At the end of the site build, the home page, `site/guide/`, `site/comparison/`, the top-level pages of `site/en/` and the Markdown under `site/en/guide/` and `site/en/comparison/` are collected. The generator expands the Vue examples and type declarations that pages reference and writes the complete body text into the build output; the maintenance docs in `docs/` are not merged into the full text.

```bash
pnpm --filter @vtable-guild/site build
```

The generated output is:

```text
site/.vitepress/dist/llms.txt
site/.vitepress/dist/llms-full.txt
```

So after documentation pages are updated, you do not need to maintain these two files by hand; rebuilding and deploying the site keeps the content in sync.

## Usage tips for agents

1. Read `llms.txt` first to confirm the documentation scope and the matching feature pages.
2. Then read `llms-full.txt` or the specific page to confirm the real API and its limitations.
3. When generating code, configure a stable `rowKey` explicitly, and do not fill in undocumented Table APIs from experience.
4. When virtual scrolling, tree data, expandable rows or summary are involved, also check the boundary notes on the related feature pages.
5. When adding application actions such as export or create, read [Toolbar](/en/guide/toolbar) first and extend through `#actions` of `VTableToolbar`; do not assume a built-in export option exists.

<div class="llms-callout">
  <strong>Tip</strong>
  <span>These two files are machine-friendly documentation entries and do not replace the guides written for people. For complete examples and visual behavior, start from the feature docs in the left sidebar or from the Playground.</span>
</div>

## Related pages

- [API Reference](/en/guide/api-reference)
- [Virtual scrolling](/en/guide/virtualization)
- [Tree table](/en/guide/tree-table)
- [Title, footer and summary](/en/guide/title-footer-summary)
- [Complete Agent API reference](https://github.com/parade0393/vtable-guild/blob/master/docs/AGENT_API.md)
