# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vtable-guild is a Vue 3 Table component library with flexible theme customization, built on a three-layer theme system (default theme → global config → instance props) powered by tailwind-variants, inspired by Nuxt UI. The API design references ant-design-vue Table, while the theme preset system is designed to reproduce the look-and-feel of multiple UI libraries — ant-design-vue (current primary preset), element-plus (reserved), and potentially others (TDesign, Naive UI, etc.) in the future.

## Monorepo Structure

pnpm workspaces + Turborepo. Six packages with this dependency graph:

```
@vtable-guild/vtable-guild (aggregation entry, re-exports all)
  ├── @vtable-guild/table (main table component + composables)
  │   ├── @vtable-guild/core (peer)
  │   ├── @vtable-guild/icons (peer)
  │   ├── @vtable-guild/theme (peer)
  │   └── @vtable-guild/pagination (peer)
  ├── @vtable-guild/pagination → core (peer)
  ├── @vtable-guild/theme → core (peer)
  ├── @vtable-guild/icons
  └── @vtable-guild/core (tailwind-variants, tailwind-merge, vue as peer)
```

- **core**: `tv()` wrapper, `cn()` class merging, `useTheme()` composable, Vue plugin (`createVTableGuild`), base UI components (Tooltip, Button, Checkbox), prop helpers
- **theme**: Pure data objects defining tailwind-variants theme configs + CSS variable tokens. Presets: `antdv` (default), `element-plus`
- **table**: `VTable` component (TSX) with sub-components, composables (`useSorter`, `useFilter`, `useColumns`), and types
- **pagination**: Standalone pagination component
- **icons**: SVG icon Vue components
- **vtable-guild**: Aggregation package that re-exports everything

## Common Commands

```bash
pnpm build              # Build all packages (via Turborepo)
pnpm dev                # Watch-build all packages
pnpm playground         # Run playground dev server (Vite)
pnpm lint               # Lint all packages
pnpm type-check         # TypeScript check all packages
pnpm lint:style         # Stylelint with --fix
pnpm commit             # Interactive conventional commit (commitizen)

# Single package operations
pnpm --filter @vtable-guild/table build
pnpm --filter @vtable-guild/core dev
```

## Architecture

### Three-Layer Theme System

1. **Default theme** (`packages/theme/src/*.ts`): tailwind-variants slot definitions with variants
2. **Global config** (`createVTableGuild({ theme })`): app-level overrides via Vue provide/inject
3. **Instance props** (`<VTable :ui="{ th: '...' }" class="...">`): per-component overrides

Layers merge via `useTheme()` composable using `cn()` (tailwind-merge) for conflict resolution. Each theme file exports a plain object with `slots`, `variants`, `defaultVariants`, and `compoundVariants`.

### Table Component Patterns

- All table sub-components are written in **TSX** (not Vue SFC)
- State managed via composables: `useSorter()`, `useFilter()`, `useColumns()`
- Supports both **controlled** (`column.sortOrder`) and **uncontrolled** (`column.defaultSortOrder`) modes
- Single `change` event emitted with `(pagination, filters, sorter, extra)` — mirrors ant-design-vue API
- Cross-component data via `provide/inject` with `TABLE_CONTEXT_KEY`
- Data pipeline: `dataSource → filterData() → sortData() → processedData`

### CSS Variables

Theme tokens defined as CSS custom properties in `packages/theme/css/`:

- `--vtg-table-bg`, `--vtg-table-border-color`, `--vtg-table-header-bg`, etc.
- Semantic tokens: `--color-primary`, `--color-surface`, `--color-on-surface`

## Code Conventions

- **No semicolons**, single quotes, 100 char line width (Prettier)
- Unused variables/parameters prefixed with `_`
- Commit messages: conventional commits (`feat`, `fix`, `docs`, `refactor`, etc.), max 95 chars header, lowercase
- All components use Vue 3 Composition API with TypeScript
- Prop helpers from core: `optionalProp<T>()`, `requiredProp<T>()`, `optionalBoolProp()`, `optionalStringProp()`
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Each package has `composite: true` tsconfig extending `tsconfig.base.json`

## Build System

- **Vite 7** in library mode for all packages (ES module output only)
- **vite-plugin-dts** generates `.d.ts` declarations
- **Turborepo** orchestrates build order based on dependency graph
- Build task depends on upstream `^build`; dev/lint/type-check also depend on `^build`
- Playground is a standalone Vite app importing workspace packages

## Key File Locations

- Theme definitions: `packages/theme/src/table.ts`, `packages/theme/src/pagination.ts`
- Theme presets CSS: `packages/theme/css/presets/antdv.css`
- Core utilities: `packages/core/src/utils/tv.ts` (tv wrapper), `packages/core/src/utils/cn.ts`
- Plugin setup: `packages/core/src/plugin/index.ts`
- Table composables: `packages/table/src/composables/`
- Table types: `packages/table/src/types/`
- Architecture doc: `docs/architecture.md`
