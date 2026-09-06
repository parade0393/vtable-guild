# vtable-guild 路线图

> 这份文档记录「项目现在处在哪」，不是待办清单。
> 当前发布版本：`@vtable-guild/vtable-guild@2.6.3`（MIT，npm 公开）。
>
> 早期那份逐阶段的建设计划已经全部走完，对应的 phase 指南已从仓库移除；实现细节以代码、
> `CHANGELOG.md` 和 git 历史为准。

---

## 已完成

### 工程基建

- pnpm workspace + Turborepo，5 个子包按依赖拓扑构建
- TypeScript project references，`tsconfig.base.json` 统一编译选项
- Vite library mode 输出 ESM，`vite-plugin-dts` 生成声明文件
- ESLint + Stylelint + Prettier + husky/lint-staged + commitlint（conventional commits）
- Changesets 版本管理；CI（lint / type-check / test / build）、Release（npm trusted publishing）、
  Deploy Site 三条 workflow
- 28 个测试与基准文件，覆盖 composable 状态逻辑、组件渲染、主题合并与类型契约

### 主题系统

- `tv()` 封装与统一的 tailwind-merge 配置
- `useTheme` 三层合并：默认主题 → 全局 `theme` → 实例 `ui` / `class`
- `createVTableGuild()` 插件，支持 `themePreset`、`cssMode`、`classPrefix`、`locale`
- 两套预设：`antdv`（默认）、`element-plus`
- 三种样式模式：`prebuilt`（`vtg-` 前缀）、`tailwind3`、`tailwind4`
- 内置 locale：`zh-CN`、`en-US`，支持 `locales` / `localeOverrides` 与
  `VTableGuildConfigProvider` 局部覆盖

### 表格能力

- 基础渲染：`columns` + `dataSource`，`bodyCell` / `headerCell` slot、column `customRender`
- 排序：受控 / 非受控双轨、多列排序、`sortDirections`
- 筛选：多选 / 单选 / 树形 / 搜索、`customFilterDropdown`
- 行选择：checkbox / radio、批量菜单、`checkStrictly`、`selectedRowKeys` 受控
- 展开行、树形数据（`childrenColumnName`、`indentSize`）
- 固定列与固定表头、多级表头、单元格合并
- 列宽拖拽（`resizable` / `minWidth` / `maxWidth`，触发 `resizeColumn`）
- `title` / `footer` / `summary`（`VTableSummary` 系列组件）、sticky
- 虚拟滚动（`virtual` + `scroll.y`），10 万行实测可用
- `EXPAND_COLUMN` / `SELECTION_COLUMN` 占位常量
- 单元格与整行编辑可通过 `bodyCell` 插槽组合，编辑状态、校验和提交由业务管理

### 文档与分发

- VitePress 文档站，28 个页面 + 18 个可交互 demo，部署在 GitHub Pages
- 独立 Playground（`@vue/repl` + Monaco），挂在文档站 `/play/`
- 可复现的性能对照页，挂在文档站 `/perf/`：vtable-guild / ant-design-vue Table / antdv-next /
  el-table-v2 / vxe-table 在同一批数据与列配置下对照（1k / 1 万 / 10 万行 × 6 / 50 / 200 列），
  公开采集方法并支持一键导出

---

## 规划中

按优先级排列。**未承诺时间表**，单人维护，按实际需求推进。

### 键盘可达性与 a11y

当前 `packages/table/src` 内 `tabindex` / `keydown` 命中数为 0，排序头与筛选触发器不可键盘操作
（`aria-sort` 等属性已有）。计划补：可聚焦的排序头 / 筛选触发器、筛选面板焦点陷阱与 Esc 关闭、
`aria-rowcount` / `aria-colindex`、可见焦点环。

这是目前唯一的「合规级」缺口，对有无障碍要求的团队是硬门槛。

### 开放子包

`core` / `theme` / `table` / `icons` 目前都是 `private`，只能整包引入。把 `core` + `theme` 转为
public，可支持「只要主题引擎、不要表格」的用法。

### 声明式列

原计划中的 `<VTableColumn>` / `<VTableColumnGroup>` 组件**尚未实现**，目前列只能通过 `columns`
数组配置（多级表头用 `ColumnGroupType.children`）。优先级不高——配置式已覆盖绝大多数场景。

### 文档双语

文档站目前是纯中文。计划开 `/en/` 路径，先覆盖 getting-started 与 api-reference。

### 按需扩展

仅在有真实用户提出时才做，优先级：列拖拽换序 > Excel 导出。编辑已能通过 `bodyCell` 插槽组合，
不再作为独立 Table API 排期。

---

## 明确不做

- **分页**：由使用方自带。`change` 事件只携带 `filters` / `sorter` / `extra`，不含 pagination。
- **做成完整 UI 库**：定位是「表格替换件」，不是新的组件体系。
- **正面对标 vxe-table 的功能广度**：`bodyCell` 插槽已支持组合单元格和整行编辑，但完整编辑引擎
  （状态管理、校验协议、事务提交、Excel 式键盘导航）以及导出、右键菜单等企业全能表格能力
  不纳入当前定位。
