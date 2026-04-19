---
'@vtable-guild/vtable-guild': patch
---

chore: 收敛为单包发布，刷新安装文档与类型校验

- 将 core/icons/theme/table 源码内联到 `@vtable-guild/vtable-guild` 产物，发布包不再引用 workspace 依赖
- 新增 `./css`、`./css/tokens`、`./css/presets/*` 导出，构建时通过 `scripts/copy-theme-css.mjs` 拷贝主题样式
- 使用独立 `tsconfig.build.json` 做 `vue-tsc --noEmit`，避免污染其他包
- 补充 `theme-overrides.typecheck.spec.ts` 固化主题覆写类型面
- 文档：`package-consumption.md` 重命名为 `installation.md` 并同步安装指引
