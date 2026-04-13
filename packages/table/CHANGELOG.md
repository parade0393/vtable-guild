# @vtable-guild/table

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

## 2.0.0

### Patch Changes

- Updated dependencies [[`f3f1eae`](https://github.com/parade0393/vtable-guild/commit/f3f1eaed310ab6c6d77b4bd9bc4d0149aba05d29)]:
  - @vtable-guild/theme@2.0.0

## 1.0.2

### Patch Changes

- 4e5951f: Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

  Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.

- Updated dependencies [4e5951f]
  - @vtable-guild/core@1.0.2
  - @vtable-guild/theme@1.0.2

## 1.0.0

### Minor Changes

- c24a498: initial release of vtable-guild packages

### Patch Changes

- Updated dependencies [c24a498]
  - @vtable-guild/core@1.0.0
  - @vtable-guild/icons@1.0.0
  - @vtable-guild/theme@1.0.0
