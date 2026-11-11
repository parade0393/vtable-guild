---
layout: home

hero:
  name: vtable-guild
  text: A high-performance table replacement for ant-design-vue and element-plus users
  tagline: Built-in virtual scrolling, theme presets and three-layer style overrides, so complex application tables no longer need to be assembled from extra patches.
  actions:
    - theme: brand
      text: Getting started
      link: /en/guide/getting-started
    - theme: alt
      text: Feature comparison
      link: /en/comparison/

features:
  - title: Controlled migration cost
    details: Keeps the columns, sorting, filtering, selection and change-event model you already know — migrate your existing tables step by step instead of rewriting them.
  - title: Large-table capabilities built in
    details: Virtual scrolling, fixed columns and column resizing come with the same table model, so you never need a second list solution.
  - title: A clear theming system
    details: themePreset, global theme and per-instance ui split styling into three layers — standardize globally while keeping local exceptions.
  - title: Multiple presets
    details: The same table logic renders under both the antdv and element-plus visual systems, matching projects that already have a Vue UI ecosystem.
  - title: Visual states you can switch on
    details: striped, hoverable, bordered and other common visual states are one prop or theme option away.
  - title: A complete TypeScript experience
    details: Column types, theme keys, slot keys and event payloads all have clear type boundaries, which holds up in long-lived application code.
---

## Try it first, read the docs later

<Demo src="home/overview">

<<< @/demos/home/overview.vue

</Demo>

For a bigger scenario, see [100,000 rows with virtual scrolling](/en/guide/virtualization); to edit code and see the result immediately, go to the [Playground](/play/).

## Who it is for

vtable-guild is for teams already using ant-design-vue or element-plus in their projects.

If you want to keep the table usage you know but need more dependable virtual scrolling, column width control, theme extensibility and a more maintainable style-override model, this library is a better fit than continuing to stack patches on top of the stock table.

## Which path to start with

- To get it running as soon as possible:
  read [Getting started](/en/guide/getting-started)
- To decide whether a replacement is worth it:
  read the [Feature comparison](/en/comparison/) and [Why vtable-guild](/en/guide/why)
- To unify the visual system:
  read [Three-layer theme overrides](/en/guide/theme-overrides) and [Table CSS variables](/en/guide/theme-tokens)
- To look up the API directly:
  read the [API Reference](/en/guide/api-reference) and the [type reference](/en/guide/type-reference)
