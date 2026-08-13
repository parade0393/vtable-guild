# Repository Guidelines

## Product Goal & Theming Strategy

`@vtable-guild/table` is a highly customizable table replacement for Vue UI ecosystems.

- Initial presets: `ant-design-vue` and `element-plus`.
- Adoption model: users are expected to already have one of those UI libraries integrated.
- Product intent: quickly replace imperfect native table implementations with a compatible, stronger solution.
- Long-term direction: expose styling through presets and tokens so most visual needs are configurable.

## Project Structure & Module Organization

This repository is a `pnpm` + Turborepo monorepo.

- `packages/*`: publishable libraries (`core`, `icons`, `table`, `theme`, `vtable-guild`), with source in `src/` and outputs in `dist/`.
- `playground/`: local Vite app for manual validation and screenshots.
- `site/`: VitePress documentation site (the user-facing docs); `play/` and `perf/` are standalone
  apps assembled into it at deploy time.
- `docs/`: maintainer-facing notes — architecture, performance, release and tooling guides.

## Build, Test, and Development Commands

Use Node `^20.19.0 || >=22.12.0` and `pnpm >=10.28.0`.

- `pnpm install`: install dependencies (`pnpm` is mandatory).
- `pnpm dev`: run workspace dev tasks.
- `pnpm build`: build all packages.
- `pnpm type-check`: run `vue-tsc`.
- `pnpm lint`: run ESLint.
- `pnpm lint:style`: run Stylelint (`--fix`).
- `pnpm playground`: start demo app.
- `pnpm test`: run Turbo test pipeline.

## Coding Style & Naming Conventions

- Formatting baseline: UTF-8, LF, 2-space indentation (`.editorconfig`).
- Prettier rules: no semicolons, single quotes, `printWidth: 100`.
- ESLint uses Vue + TypeScript flat config; prefix intentionally unused vars with `_`.
- Stylelint enforces standard/Vue rules and kebab-case or BEM-style class naming.
- Any feature or bug fix must be compatible with all supported presets (`ant-design-vue`, `element-plus`).
- Do not hardcode one-off styles in components; route visual changes through existing tokens and preset layers in `packages/theme`.
- Follow naming patterns: component files in `PascalCase`, composables as `useXxx.ts`, shared helpers under `src/utils/`.

## Testing Guidelines

Vitest is configured at the root (`vitest.config.ts`) as a multi-project workspace; `core`, `theme`
and `table` carry the real suites (25 test/bench files today), the remaining projects are wired with
`passWithNoTests`. `happy-dom` is the environment and `tests/setup.ts` the shared setup file.

- `pnpm test`: run the suites through Turbo.
- `pnpm bench`: run the `*.bench.ts` benchmarks (currently `table` only).
- `pnpm test:coverage`: v8 coverage over `core` / `theme` / `table`.

For new tests:

- Name files `*.test.ts` — the project `include` globs are `src/**/*.test.ts`, so `*.spec.ts` is
  **not** collected by Vitest. Reserve `*.spec.ts` / `*.typecheck.ts` for type-level contracts that
  `pnpm type-check` asserts via `vue-tsc`.
- Keep tests next to the implementation (`useSorter.ts` → `useSorter.test.ts`).
- New packages need a `test` script plus a project entry in `vitest.config.ts`.

## Commit & Pull Request Guidelines

Conventional Commits are enforced by Husky + Commitlint.

- Format: `type(scope): subject`.
- Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `perf`.
- Use `pnpm commit` (Commitizen) for guided commit messages.
- Before opening a PR, run `pnpm lint && pnpm type-check && pnpm build`.
- PRs should include a concise summary, linked issue/task, and UI evidence from `playground/`.
