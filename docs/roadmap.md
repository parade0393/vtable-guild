# vtable-guild 任务排期

> 按依赖关系和优先级排列，每个阶段的产出是下一阶段的前置条件。

---

## 阶段一：Monorepo 基建（地基）

> 目标：让多包结构能跑起来——能装依赖、能构建、能互相引用。
> 详细操作步骤见 [phase-1-guide.md](./phase-1-guide.md)。

### 1.1 修正根目录依赖位置

- [ ] 将 `tailwind-variants` 从根 devDependencies 移除（后续放入 core 包的 dependencies）
- [ ] 清理根 `package.json` 中不属于 monorepo 根的依赖（pinia, vue-router 等移至 playground）

### 1.2 TypeScript 基础配置（前置，所有子包依赖此项）

- [ ] 创建 `tsconfig.base.json`，提取公共编译选项（target, module, strict 等）
- [ ] 改造根 `tsconfig.json`，通过 references 引用所有子包
- [ ] 改造 `tsconfig.app.json` 为 playground 专用

### 1.3 安装并配置 Turborepo

- [ ] `pnpm add -Dw turbo`
- [ ] 创建 `turbo.json`，定义 build/dev/test/lint pipeline 及依赖拓扑
- [ ] 根 `package.json` scripts 改为 turbo 命令
- [ ] `.gitignore` 添加 `.turbo`

### 1.4 创建 `packages/core` 子包骨架

- [ ] `package.json`（name, version, exports, dependencies 含 tailwind-variants, peerDependencies 含 vue）
- [ ] `tsconfig.json`（extends tsconfig.base.json）
- [ ] `vite.config.ts`（Vite lib mode，输出 ESM）
- [ ] `src/index.ts`（空导出占位）

### 1.5 创建 `packages/theme` 子包骨架

- [ ] 同上结构，纯 TS 包，peerDependencies 含 @vtable-guild/core

### 1.6 创建 `packages/table` 子包骨架

- [ ] 同上结构，含 Vue SFC 支持，peerDependencies 含 core/theme/pagination

### 1.7 创建 `packages/pagination` 子包骨架

- [ ] 同上结构，含 Vue SFC 支持，peerDependencies 含 core

### 1.8 创建 `packages/vtable-guild` 聚合入口包

- [ ] dependencies 引用上述四个子包
- [ ] `src/index.ts` re-export 所有子包

### 1.9 验证

- [ ] `pnpm install` 无报错，workspace 协议解析正确
- [ ] `pnpm build`（turbo）能成功构建所有子包，拓扑顺序正确
- [ ] 子包之间的 import 能正确解析（TypeScript 无报错）

**阶段产出**：5 个子包骨架 + turborepo 编排 + TypeScript 项目引用，`pnpm build` 全部通过。

---

## 阶段二：核心层实现（骨骼）

> 目标：实现主题系统和核心工具，为组件开发提供基础设施。

### 2.1 `@vtable-guild/core` — tv() 封装

- [ ] `src/utils/tv.ts`：封装 `tv()` 调用，统一 tailwind-merge 配置
- [ ] `src/utils/types.ts`：公共类型定义（ThemeConfig, SlotProps 等）
- [ ] `src/utils/props.ts`：prop 定义辅助函数

### 2.2 `@vtable-guild/core` — 主题合并 composable

- [ ] `src/composables/useTheme.ts`：实现三层合并逻辑
  - 接收组件名、默认主题、props（含 ui/class）
  - 通过 inject 获取全局配置
  - deep merge: default → global → instance
  - 返回 slots 对象（每个 slot 是一个返回 class 字符串的函数）

### 2.3 `@vtable-guild/core` — Vue 插件

- [ ] `src/plugin/index.ts`：`createVTableGuild({ theme, locale })`
  - 通过 `provide` 注入全局主题配置
  - 导出 `VTableGuildPlugin` 供 `app.use()` 使用

### 2.4 `@vtable-guild/theme` — 默认主题文件

- [ ] `src/table.ts`：Table 主题（slots, variants, defaultVariants）
- [ ] `src/pagination.ts`：Pagination 主题
- [ ] `src/index.ts`：统一导出

### 2.5 Playground 开发环境

- [ ] 将根目录 Vite 应用改造为 `playground/`（或保留根目录作为 playground）
- [ ] 引用本地 `packages/*`，配置 Tailwind CSS
- [ ] 能实时预览组件效果

### 2.6 验证

- [ ] 在 playground 中使用 `useTheme` + 默认主题，渲染一个静态 `<table>` 验证样式
- [ ] 通过 `createVTableGuild` 全局覆盖主题，验证合并逻辑
- [ ] 通过 `ui` prop 实例级覆盖，验证优先级

**阶段产出**：完整的主题系统 + playground 可视化验证环境。

---

## 阶段三：基础 Table 组件（肌肉 — 第一批）

> 目标：实现最基础的 Table 渲染能力，对齐 ant-design-vue 的基础用法。

### 3.1 类型定义

- [ ] `packages/table/src/types/column.ts`：ColumnType, ColumnGroupType
- [ ] `packages/table/src/types/table.ts`：TableProps, TableEmits

### 3.2 核心组件

- [ ] `Table.vue`：主组件，接收 `dataSource` + `columns`，渲染 `<table>`
- [ ] `TableHeader.vue`：`<thead>` 渲染，遍历 columns 生成 `<th>`
- [ ] `TableBody.vue`：`<tbody>` 渲染，遍历 dataSource 生成 `<tr>`
- [ ] `TableRow.vue`：单行渲染
- [ ] `TableCell.vue`：单元格渲染，支持 `dataIndex` 取值
- [ ] `TableHeaderCell.vue`：表头单元格
- [ ] `TableEmpty.vue`：空状态展示
- [ ] `TableLoading.vue`：加载状态

### 3.3 自定义渲染

- [ ] 支持 `bodyCell` slot：`{ text, record, index, column }`
- [ ] 支持 `headerCell` slot：`{ title, column }`
- [ ] 支持 column `customRender` 函数

### 3.4 列配置

- [ ] `useColumns` composable：解析 columns 配置
- [ ] 支持 `width`, `align`, `ellipsis`, `className`

### 3.5 验证

- [ ] playground 中渲染基础表格，数据正确展示
- [ ] 自定义 bodyCell/headerCell 渲染正常
- [ ] 主题 variants（size/bordered/striped/hoverable）生效

**阶段产出**：可用的基础 Table 组件，支持数据渲染 + 自定义单元格 + 主题变体。

---

## 阶段四：交互功能（肌肉 — 第二批）

> 目标：实现排序、筛选、分页、行选择等核心交互功能。

### 4.1 排序

- [ ] `useSorter` composable：管理排序状态（controlled/uncontrolled）
- [ ] `SortButton.vue`：排序图标 + 点击交互
- [ ] 支持 `sorter`, `sortOrder`, `defaultSortOrder`, `sortDirections`
- [ ] 触发 `change` 事件

### 4.2 筛选

- [ ] `useFilter` composable：管理筛选状态
- [ ] `FilterDropdown.vue`：筛选下拉菜单
- [ ] `FilterIcon.vue`：筛选图标
- [ ] 支持 `filters`, `onFilter`, `filterMultiple`, `filterMode`
- [ ] 支持 `customFilterDropdown` slot

### 4.3 分页

- [ ] `@vtable-guild/pagination` 完整实现
  - `Pagination.vue` 主组件
  - `PaginationItem.vue`, `PaginationPrev.vue`, `PaginationNext.vue`
  - `PaginationJumper.vue`, `PaginationSizeChanger.vue`
  - `usePagination` composable
- [ ] Table 集成分页：`pagination` prop，支持 `position`, `hideOnSinglePage`
- [ ] `usePagination` (table 侧)：数据切片 + 分页状态联动

### 4.4 行选择

- [ ] `useSelection` composable：管理选中状态（checkbox/radio）
- [ ] `SelectionCheckbox.vue`, `SelectionRadio.vue`
- [ ] 支持 `rowSelection` prop 全部配置项
- [ ] 支持 `selectedRowKeys` v-model 模式

### 4.5 验证

- [ ] 排序：点击表头排序，受控/非受控模式均正常
- [ ] 筛选：下拉菜单筛选数据，自定义筛选 UI 正常
- [ ] 分页：翻页、跳页、切换 pageSize 正常
- [ ] 选择：checkbox/radio 选择，全选/反选正常
- [ ] `change` 事件正确携带 pagination/filters/sorter 信息

**阶段产出**：功能完整的交互式 Table，覆盖排序/筛选/分页/选择。

---

## 阶段五：高级功能（肌肉 — 第三批）

> 目标：实现固定列、展开行、声明式列、汇总行等进阶功能。

### 5.1 固定列与固定表头

- [ ] `useScroll` composable：管理 scroll 配置
- [ ] 支持 `scroll.x`（横向滚动）、`scroll.y`（纵向滚动/固定表头）
- [ ] 支持 column `fixed: 'left' | 'right'`
- [ ] 固定列阴影效果

### 5.2 展开行

- [ ] `useExpand` composable：管理展开状态
- [ ] `ExpandIcon.vue`：展开/收起图标
- [ ] 支持 `expandedRowRender`, `expandedRowKeys`, `expandRowByClick`
- [ ] 支持 `expandIcon` 自定义

### 5.3 声明式列

- [ ] `TableColumn.vue`：`<VTableColumn>` 组件
- [ ] `TableColumnGroup.vue`：`<VTableColumnGroup>` 组件
- [ ] 从 children VNodes 中解析列配置，与 `columns` prop 合并

### 5.4 汇总行与表头/表尾

- [ ] `TableSummary.vue`：`<VTableSummary>` 组件
- [ ] 支持 `title`, `footer`, `summary` slots

### 5.5 列宽拖拽

- [ ] `useResize` composable：拖拽状态管理
- [ ] `ResizeHandle.vue`：拖拽手柄
- [ ] 支持 `resizable`, `minWidth`, `maxWidth`
- [ ] 触发 `resizeColumn` 事件

### 5.6 验证

- [ ] 固定列：左右固定列 + 横向滚动 + 阴影效果
- [ ] 展开行：点击展开/收起，受控模式正常
- [ ] 声明式列：`<VTableColumn>` 与 `columns` prop 效果一致
- [ ] 列宽拖拽：拖拽调整宽度，约束生效

**阶段产出**：功能丰富的 Table 组件，覆盖绝大多数 ant-design-vue Table 场景。

---

## 阶段六：树形数据与虚拟滚动（肌肉 — 第四批）

> 目标：实现树形数据和大数据量场景支持。

### 6.1 树形数据

- [ ] `useTreeData` composable：树形数据展开/折叠/缩进
- [ ] 支持 `childrenColumnName`, `indentSize`
- [ ] 行选择与树形数据联动（`checkStrictly`）

### 6.2 虚拟滚动

- [ ] `useVirtual` composable：虚拟列表核心逻辑
- [ ] 支持 `virtual` prop + `scroll.y`
- [ ] 仅渲染可视区域行，支持动态行高

### 6.3 验证

- [ ] 树形数据：多级嵌套展开/折叠，缩进正确
- [ ] 虚拟滚动：10000+ 行数据流畅滚动，内存占用合理

**阶段产出**：支持树形数据和大数据量的完整 Table 组件。

---

## 阶段七：测试与文档（皮肤）

> 目标：补全测试覆盖和文档站，为发布做准备。

### 7.1 测试框架搭建

- [ ] 安装 vitest + @vue/test-utils + happy-dom
- [ ] 配置 vitest workspace 模式（各子包独立测试）
- [ ] 根 scripts 添加 `test`, `test:coverage`

### 7.2 单元测试

- [ ] `@vtable-guild/core`：useTheme 合并逻辑、tv 封装、plugin 注入
- [ ] `@vtable-guild/theme`：主题对象结构校验
- [ ] `@vtable-guild/table`：各 composable 的状态管理逻辑
- [ ] `@vtable-guild/pagination`：分页计算逻辑

### 7.3 组件测试

- [ ] 基础渲染：dataSource + columns → 正确的 DOM 结构
- [ ] 排序/筛选/分页/选择：交互行为 + 事件触发
- [ ] 固定列/展开行：DOM 结构 + class 正确
- [ ] 主题覆盖：三层合并后 class 正确

### 7.4 VitePress 文档站

- [ ] `site/` 初始化 VitePress
- [ ] 配置 sidebar/nav 结构
- [ ] 支持 Vue 组件 demo 嵌入
- [ ] 编写各功能的文档页（API + 示例）

### 7.5 验证

- [ ] `pnpm test` 全部通过，覆盖率达标
- [ ] `pnpm site:dev` 文档站正常运行，demo 可交互

**阶段产出**：完整的测试套件 + 可部署的文档站。

---

## 阶段八：发布准备（上线）

> 目标：建立版本管理和 CI/CD 流程，完成首次发布。

### 8.1 Changesets 版本管理

- [ ] 安装 `@changesets/cli`
- [ ] 配置 `.changeset/config.json`
- [ ] 根 scripts 添加 `changeset`, `version`, `release`

### 8.2 CI/CD

- [ ] `.github/workflows/ci.yml`：PR 触发 lint + type-check + test + build
- [ ] `.github/workflows/release.yml`：main 合并后 changeset version + publish

### 8.3 ESLint/Stylelint monorepo 适配

- [ ] 确认 lint 规则覆盖 `packages/**`
- [ ] lint-staged 在子包变更时正确触发

### 8.4 发布前检查

- [ ] 各包 `package.json` 的 `exports`, `main`, `module`, `types` 字段正确
- [ ] `pnpm build` 产物结构正确（ESM + CJS + .d.ts）
- [ ] `npm pack` 预览发布内容，确认无多余文件
- [ ] README 更新

### 8.5 验证

- [ ] 在一个全新项目中 `pnpm add @vtable-guild/vtable-guild`，功能正常
- [ ] CI pipeline 全部绿色
- [ ] changeset 发布流程走通

**阶段产出**：首个可发布版本 + 自动化 CI/CD 流程。

---

## 阶段依赖总览

```
阶段一 Monorepo 基建
  └──→ 阶段二 核心层实现
         └──→ 阶段三 基础 Table
                └──→ 阶段四 交互功能
                       └──→ 阶段五 高级功能
                              └──→ 阶段六 树形 & 虚拟滚动
  └──→ 阶段七 测试与文档（可从阶段三开始并行）
  └──→ 阶段八 发布准备（阶段七完成后）
```

> 阶段七（测试与文档）建议从阶段三开始并行推进——每完成一个功能模块就补上对应的测试和文档，而非最后集中补。
