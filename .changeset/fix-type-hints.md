---
'@vtable-guild/core': patch
'@vtable-guild/theme': patch
'@vtable-guild/vtable-guild': patch
---

fix: 修复外部项目的 theme 类型提示与模块增强导出

- core: 收紧 `VTableGuildThemeOverrides`，改为通过 `VTableGuildThemeOverridesMap` 做类型扩展
- theme: 将模块增强内联到入口声明，确保生成的 `dist/index.d.ts` 保留组件主题类型
- vtable-guild: 同步发布聚合包，带出类型修复
