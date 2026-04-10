---
'@vtable-guild/vtable-guild': patch
---

fix: resolve vite-plugin-dts path alias issue causing broken `.d.ts` exports

The generated `dist/index.d.ts` was resolving `@vtable-guild/*` package names to relative
source paths (e.g. `../../core/src/index.ts`) due to `tsconfig.base.json` `paths` aliases
being followed by vite-plugin-dts. Added `compilerOptions: { paths: {} }` override to
preserve bare package identifiers in declaration output.
