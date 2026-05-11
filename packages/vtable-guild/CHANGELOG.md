# @vtable-guild/vtable-guild

## 2.1.0

### Minor Changes

- [`e84a3a2`](https://github.com/parade0393/vtable-guild/commit/e84a3a268c85292605f74d20aa740c3f86d6ab6e) Thanks [@parade0393](https://github.com/parade0393)! - Align the table API more closely with ant-design-vue, including fixed columns,
  loading options, ellipsis behavior, and size naming.

  Add `EXPAND_COLUMN` and `SELECTION_COLUMN` sentinel support for controlling
  expand and selection column placement.

  Fix filter and sorter dropdown interactions, improve external CSS utility
  coverage, and update compatibility, installation, and type reference docs.

## 2.0.6

### Patch Changes

- [`fc0cc39`](https://github.com/parade0393/vtable-guild/commit/fc0cc39cba2f1beccfefb343c4c2e3a07104076b) Thanks [@parade0393](https://github.com/parade0393)! - fix(vtable-guild): restore type hints for createVTableGuild theme parameter

  Fixed missing type hints for the `theme` parameter in `createVTableGuild()` by adding module augmentation to the bundled type declarations. The `theme` object now correctly shows available keys (table, button, checkbox, radio, input, tooltip, scrollbar) with full IntelliSense support.

## 2.0.5

### Patch Changes

- [`b6b51d2`](https://github.com/parade0393/vtable-guild/commit/b6b51d2f005acd16a3e920b65649df06248f94a7) Thanks [@parade0393](https://github.com/parade0393)! - fix: ensure single-package CSS integration works in both workspace dev and published usage
  - keep @vtable-guild/vtable-guild/css as the canonical CSS entry and package-level published asset
  - align playground integration with documented usage by importing package CSS from the CSS entry file
  - fix aggregated CSS copy/rewrite flow so style resolution does not break after packaging
  - normalize table-related arbitrary utility color classes for reliable Tailwind generation

## 2.0.4

### Patch Changes

- [`af327e4`](https://github.com/parade0393/vtable-guild/commit/af327e4cb9ef44c09cc85e8f3dd3a2f240ee45a8) Thanks [@parade0393](https://github.com/parade0393)! - chore: 收敛为单包发布，刷新安装文档与类型校验
  - 将 core/icons/theme/table 源码内联到 `@vtable-guild/vtable-guild` 产物，发布包不再引用 workspace 依赖
  - 新增 `./css`、`./css/tokens`、`./css/presets/*` 导出，构建时通过 `scripts/copy-theme-css.mjs` 拷贝主题样式
  - 使用独立 `tsconfig.build.json` 做 `vue-tsc --noEmit`，避免污染其他包
  - 补充 `theme-overrides.typecheck.spec.ts` 固化主题覆写类型面
  - 文档：`package-consumption.md` 重命名为 `installation.md` 并同步安装指引

## 2.0.3

### Patch Changes

- [`4e7ff0e`](https://github.com/parade0393/vtable-guild/commit/4e7ff0ed7803c48cbf52c49717d00f5103f00307) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目的 theme 类型提示与模块增强导出
  - core: 收紧 `VTableGuildThemeOverrides`，改为通过 `VTableGuildThemeOverridesMap` 做类型扩展
  - theme: 将模块增强内联到入口声明，确保生成的 `dist/index.d.ts` 保留组件主题类型
  - vtable-guild: 同步发布聚合包，带出类型修复

- Updated dependencies [[`4e7ff0e`](https://github.com/parade0393/vtable-guild/commit/4e7ff0ed7803c48cbf52c49717d00f5103f00307)]:
  - @vtable-guild/core@2.0.3
  - @vtable-guild/theme@2.0.3
  - @vtable-guild/table@2.0.3

## 2.0.2

### Patch Changes

- [`6649ca7`](https://github.com/parade0393/vtable-guild/commit/6649ca7d762d443cc122f8348bddd723d96a825c) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 接口支持 module augmentation
  - theme: 通过 augment.ts 注入所有组件的精确 ThemeConfig 类型
  - table: 修复生成的 .d.ts 中 import 路径为工作区相对路径的问题
  - docs: 新增 ui Slot 参考页，列出所有 60+ theme slot

- Updated dependencies [[`6649ca7`](https://github.com/parade0393/vtable-guild/commit/6649ca7d762d443cc122f8348bddd723d96a825c)]:
  - @vtable-guild/core@2.0.2
  - @vtable-guild/theme@2.0.2
  - @vtable-guild/table@2.0.2

## 2.0.1

### Patch Changes

- fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 可增强接口，createVTableGuild 的 theme 参数现在有完整的 key 和 slot 级别类型补全
  - theme: 通过 module augmentation 注入内置组件的精确 ThemeConfig 类型
  - table: 修复 .d.ts 中 import 路径为工作区相对路径的问题，新增 tsconfig.build.json
  - theme/table: dts 构建配置添加 paths 清空，防止 workspace paths 泄漏到声明文件
  - docs: 新增 ui Slot 参考页，列出全部 60+ theme slot 及使用示例

- Updated dependencies []:
  - @vtable-guild/core@2.0.1
  - @vtable-guild/theme@2.0.1
  - @vtable-guild/table@2.0.1

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
