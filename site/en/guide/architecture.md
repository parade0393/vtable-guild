# Design rationale

This page is optional reference material, not required reading for most users.

If you just want to get the table into your project, the getting started, migration, feature and API pages are enough. This page is only worth reading when you are evaluating long-term adoption, building a wrapper on top of the library, or governing themes in a unified way.

## 1. Why there is a single public entry

For users, what matters most is that the installation, import and upgrade paths are stable enough, so vtable-guild exposes only one entry:

- `@vtable-guild/vtable-guild`
- `createVTableGuild` as the global configuration entry, used to switch presets, locales and the global theme

Inside the repository, source modules are still organized by responsibility, but those modules are implementation details that you do not need to understand or install separately. The value of this is:

- a simple installation path, with no need to work out which packages to install
- a shorter type chain, with theme overrides and component types centered on one entry
- a clearer versioning model, since you only track one package when upgrading

## 2. Why theming has three layers

If theming had only one layer, two problems usually appear:

- Global changes are too heavy, and a single page cannot easily be an exception.
- Per-page changes are too scattered, and you end up with nothing but application style patches.

vtable-guild splits theming into three layers to solve exactly this:

1. The preset provides the overall visual baseline.
2. The global theme of createVTableGuild provides unified application-level overrides.
3. The per-instance ui handles local adjustments for a single table.

This means you can quickly adopt the antdv or element-plus look, and also change only the header, cell or root container styles of one table without copying the whole theme.

## 3. Why it suits migration from an existing table

The idea behind VTable is not to make you learn a completely different table model, but to keep common capabilities in columns and props:

- Sorting, filtering, selection, tree data and expandable rows are all composed through declarative configuration.
- Virtual scrolling, column resizing and theme overrides are layered on directly as enhancements.
- Many of the interaction and style patches that used to be scattered across application pages can be pulled back into the table itself.

This is also why it suits replacing existing application tables. Migration is mostly about confirming boundaries, not rewriting whole pages.

## When this page is worth reading

Coming back to it in these situations is enough:

- You are evaluating whether to adopt vtable-guild for the long term.
- You are building an internal company wrapper.
- You need to unify the table theme across several application lines.
- You want to understand why themePreset, theme and ui are used separately.

## Related pages

- [Why vtable-guild](/en/guide/why)
- [Three-layer theme overrides](/en/guide/theme-overrides)
- [API Reference](/en/guide/api-reference)
