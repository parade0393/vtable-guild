# @vtable-guild/vtable-guild

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
