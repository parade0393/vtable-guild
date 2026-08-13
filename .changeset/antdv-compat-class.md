---
'@vtable-guild/vtable-guild': minor
---

compat: 新增 antdv 兼容类名开关 `compatClass`，迁移时不必重写旧的覆盖 CSS

**新增 API**

- `createVTableGuild({ compatClass: true })`：全局 opt-in、默认关闭。开启后在既有元素上额外输出一套
  `ant-table-*` 类名，antdv 时期写的 `.ant-table-thead > tr > th` 这类覆盖 CSS 继续命中，
  不必逐条改写成 `ui` prop 或 Tailwind。
  只在安装时读取一次，不支持运行时切换；不改动 DOM 结构、不引入任何样式，
  开与不开的渲染结果像素一致（playground 三页整页截图逐字节相同）。

覆盖三类类名，均以 ant-design-vue 4.2.6 源码为准：

- 结构类：`ant-table-wrapper`、`ant-table-thead`、`ant-table-cell`、`ant-table-placeholder` 等
- 变体类：`ant-table-small`、`ant-table-middle`、`ant-table-bordered`
- 状态类：`ant-table-row-selected`、`ant-table-row-level-{n}`、`ant-table-cell-fix-left-last`、
  `ant-table-ping-left` 等

**与 antdv 共存**

antdv 4.x 默认经 cssinjs 给每条规则注入 hash 类，我们的元素不带该 hash，所以 antdv 自身的样式匹配不到
我们的表格（同页实测 178 条 `ant-table` 规则命中 0 条），而你手写的选择器照常生效。
例外：项目使用 `<StyleProvider :hashed="false">` 时 antdv 选择器退化为 `[class^='ant-table']` 一类形式，
实测有 20 条会命中我们的表格，这种情况下不要开启。

**稳定性边界**：`compatClass` 开关本身是稳定 API，类名清单也保持向后兼容、删改走 changelog 明示；
但类名之间的 DOM 结构关系不做承诺——后续为性能调整 DOM 时，`.ant-table-thead > tr > th` 这类依赖
父子关系的选择器可能失配。建议尽量写 `.ant-table-cell { }` 这样的单类选择器，它只依赖类名存在于
元素上，抗结构变更。兼容类名仍是迁移期的过渡辅助，长期建议迁移到 `ui` prop 或主题覆盖。
详见[从 ant-design-vue 迁移](https://parade0393.github.io/vtable-guild/guide/migration-from-antd)。

同时导出映射表 `antdvTableCompatClasses` 与 `CompatClassConfig` / `UseThemeOptions` 类型，
自定义组件可经 `useTheme(name, theme, props, { compatClasses })` 接入同一套机制。
