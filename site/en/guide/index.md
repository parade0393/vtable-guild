# Guide

This documentation is for developers who already use ant-design-vue or element-plus in a Vue 3 project. It is not about how the repository itself is developed; it helps you decide whether replacing your current table is worth it, how to integrate vtable-guild into an existing project, and how to use it in high-frequency scenarios.

## Suggested reading order

### If you are evaluating whether to replace

1. Start with [Why vtable-guild](/en/guide/why) to confirm which kind of table problem it solves.
2. Then read the [Feature comparison](/en/comparison/) to quickly judge the differences from your current table solution.
3. If you care about the enhancements, continue with [Enhancements and extras](/en/comparison/enhancements).

### If you are ready to integrate

1. Start from [Getting started](/en/guide/getting-started) to finish installation, style imports and plugin initialization.
2. If you already have an ant-design-vue Table, continue with [Migrating from ant-design-vue](/en/guide/migration-from-antd).
3. Then read [Installation and usage](/en/guide/installation) to confirm style entries, theme presets and common integration patterns.

### If you are implementing a specific feature

- Data interaction:
  [Sorting](/en/guide/sorting), [Filtering](/en/guide/filtering), [Pagination](/en/guide/pagination), [Row selection](/en/guide/selection)
- Data hierarchy:
  [Expandable rows](/en/guide/expandable-rows), [Tree table](/en/guide/tree-table)
- Large-table experience:
  [Fixed columns](/en/guide/fixed-columns), [Virtual scrolling](/en/guide/virtualization), [Column resizing](/en/guide/column-resize)
- Display and operations:
  [Column display and order](/en/guide/column-display), [Toolbar](/en/guide/toolbar)
- Structural extensions:
  [Grouped headers and merged cells](/en/guide/grouped-and-merged-cells), [Title, footer and summary](/en/guide/title-footer-summary), [Custom rows and slots](/en/guide/api-wiring-and-slots), [Editing](/en/guide/editing)

### If you need to unify the visual system

1. Start with [Three-layer theme overrides](/en/guide/theme-overrides) to establish the split between `themePreset`, global `theme` and per-instance `ui`.
2. Then read [Table CSS variables](/en/guide/theme-tokens) to confirm which cases only need a token change.
3. Then read the [ui slot reference](/en/guide/ui-slots-reference) for the complete list of slots and variants.
4. Finally read [Presets and locales](/en/guide/presets-and-locales) to handle preset switching and locale.

### If you want to understand the design decisions

- To understand why theming is layered and why there is a single integration entry:
  read [Design rationale](/en/guide/architecture)
- To quickly look up field names, events, slots and common types:
  read the [API Reference](/en/guide/api-reference) and the [type reference](/en/guide/type-reference)
