# 架构设计

这一页整理自仓库内现有的架构文档，目的是让后续补测试、补文档、接发布流程时有统一参照。

## 项目定位

`vtable-guild` 是一个 Vue 3 表格组件库，目标不是重新定义表格 API，而是在现有 UI 生态里提供更强的可替换方案。

- 功能层面对齐 `ant-design-vue` Table 的常见能力。
- 样式层通过 tailwind-variants 和 CSS token 支持预设与覆盖。
- 工程层使用 pnpm workspace + Turborepo 维护多包发布。

## 包结构

- `@vtable-guild/core`：主题合并、Vue 插件、基础组件、工具函数。
- `@vtable-guild/icons`：表格相关 SVG 图标。
- `@vtable-guild/theme`：主题对象、预设解析、CSS token 和预设样式入口。
- `@vtable-guild/table`：`VTable`、表格 composables、类型定义与子组件。
- `@vtable-guild/vtable-guild`：聚合入口，面向大多数使用方。

## 三层主题覆盖

主题优先级从低到高分三层：

1. `@vtable-guild/theme` 默认主题与预设。
2. `createVTableGuild({ theme, themePreset })` 提供的全局覆盖。
3. `VTable` 实例上的 `ui` 和 `class`。

这套结构让库可以同时兼容预设对齐和局部改造，不需要为单个业务场景复制整套主题。

## 数据处理主链路

`VTable` 的内部处理顺序是：

1. 响应式列过滤
2. `useColumns` 生成叶子列和表头结构
3. `useFilter` 处理筛选
4. `useSorter` 处理排序
5. `useTreeData` 和 `useSelection` 等高级能力再接入展示阶段

这个顺序直接决定了测试优先级，因此阶段 7 先补 composable 单测，再补组件交互测试。

## 当前工程状态

- Monorepo 基建、主题系统、表格主体能力和 playground 已具备。
- 当前缺口集中在测试覆盖、文档站内容和发布前验收。
- Changesets、CI 和 release workflow 已完成第一版接入，接下来需要用更多测试和文档把它们托住。
