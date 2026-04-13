# @vtable-guild/vtable-guild

## 2.0.0

### Patch Changes

- Updated dependencies [[`f3f1eae`](https://github.com/parade0393/vtable-guild/commit/f3f1eaed310ab6c6d77b4bd9bc4d0149aba05d29)]:
  - @vtable-guild/theme@2.0.0
  - @vtable-guild/table@2.0.0

## 1.0.2

### Patch Changes

- 4e5951f: Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

  Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.

- Updated dependencies [4e5951f]
  - @vtable-guild/core@1.0.2
  - @vtable-guild/table@1.0.2
  - @vtable-guild/theme@1.0.2

## 1.0.1

### Patch Changes

- 59da816: fix: resolve vite-plugin-dts path alias issue causing broken `.d.ts` exports

  The generated `dist/index.d.ts` was resolving `@vtable-guild/*` package names to relative
  source paths (e.g. `../../core/src/index.ts`) due to `tsconfig.base.json` `paths` aliases
  being followed by vite-plugin-dts. Added `compilerOptions: { paths: {} }` override to
  preserve bare package identifiers in declaration output.

## 1.0.0

### Minor Changes

- c24a498: initial release of vtable-guild packages

### Patch Changes

- Updated dependencies [c24a498]
  - @vtable-guild/core@1.0.0
  - @vtable-guild/icons@1.0.0
  - @vtable-guild/table@1.0.0
  - @vtable-guild/theme@1.0.0
