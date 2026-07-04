---
'@vtable-guild/vtable-guild': minor
---

perf & build: round-2 optimizations

**构建产物**

- 聚合包启用 `preserveModules`：产物从 302KB 单文件改为按源码模块保留（103 个模块），消费方打包器可做模块级 tree-shaking
- `tailwind-variants` 改为 external + dependencies 声明，不再内联
- 主入口不再产出不可达的 `index.cjs`（`exports` 从未暴露 require 条目）；`tailwind3-preset` 的 CJS 版本单独构建保留

**运行时性能**

- 横向滚动状态拆为独立布尔 computed，滚动不再触发全表固定列样式重算
- `subThemeSlots` 改为稳定引用 + 懒求值函数，variant 变化只影响实际读取对应 slot 的组件
- 树形选择：消除 O(n²) 的 findIndex 回查、半选后代集合记忆化（整表 O(n²) → 拓扑变化时 O(n)）
- 树形数据新增 record→行元信息 Map，替换三处每行 O(n) 的 `.find()` 查找
- 虚拟滚动 `scrollWidth` 提为 computed

**开发体验**

- 新增 `devWarn`（core 导出）：rowKey 缺失回退 index 时给出开发期警告
- 新增 `createSvgIcon` 图标工厂（icons 导出）

**内部注意**：`TableContext.subThemeSlots` 字段类型由 `string` 变为 `() => string`，直接消费该 context 的自定义代码需同步调整调用方式。
