# @vtable-guild/core

## 2.0.3

### Patch Changes

- [`4e7ff0e`](https://github.com/parade0393/vtable-guild/commit/4e7ff0ed7803c48cbf52c49717d00f5103f00307) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目的 theme 类型提示与模块增强导出
  - core: 收紧 `VTableGuildThemeOverrides`，改为通过 `VTableGuildThemeOverridesMap` 做类型扩展
  - theme: 将模块增强内联到入口声明，确保生成的 `dist/index.d.ts` 保留组件主题类型
  - vtable-guild: 同步发布聚合包，带出类型修复

## 2.0.2

### Patch Changes

- [`6649ca7`](https://github.com/parade0393/vtable-guild/commit/6649ca7d762d443cc122f8348bddd723d96a825c) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 接口支持 module augmentation
  - theme: 通过 augment.ts 注入所有组件的精确 ThemeConfig 类型
  - table: 修复生成的 .d.ts 中 import 路径为工作区相对路径的问题
  - docs: 新增 ui Slot 参考页，列出所有 60+ theme slot

## 2.0.1

### Patch Changes

- fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 可增强接口，createVTableGuild 的 theme 参数现在有完整的 key 和 slot 级别类型补全
  - theme: 通过 module augmentation 注入内置组件的精确 ThemeConfig 类型
  - table: 修复 .d.ts 中 import 路径为工作区相对路径的问题，新增 tsconfig.build.json
  - theme/table: dts 构建配置添加 paths 清空，防止 workspace paths 泄漏到声明文件
  - docs: 新增 ui Slot 参考页，列出全部 60+ theme slot 及使用示例

## 1.0.2

### Patch Changes

- 4e5951f: Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

  Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.

## 1.0.0

### Minor Changes

- c24a498: initial release of vtable-guild packages
