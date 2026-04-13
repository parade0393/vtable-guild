---
'@vtable-guild/core': patch
'@vtable-guild/theme': patch
'@vtable-guild/table': patch
'@vtable-guild/vtable-guild': patch
---

fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导

- core: 新增 VTableGuildThemeOverridesMap 接口支持 module augmentation
- theme: 通过 augment.ts 注入所有组件的精确 ThemeConfig 类型
- table: 修复生成的 .d.ts 中 import 路径为工作区相对路径的问题
- docs: 新增 ui Slot 参考页，列出所有 60+ theme slot
