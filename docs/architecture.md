# vtable-guild 架构设计文档

> 这份文档描述**当前实现**的结构与设计取舍，面向维护者和二次开发者。
> 面向使用者的说明在文档站：[指南](../site/guide/index.md)、[API Reference](../site/guide/api-reference.md)。
> 性能设计与实测看 [performance.md](./performance.md)。

## 1. 项目定位

vtable-guild 是一个 Vue 3 Table 组件库，目标：

- **API 对齐** ant-design-vue Table（排序、筛选、选择、展开、树形、固定列、虚拟滚动等）。
  明确**不做分页**——由使用方自带，`change` 事件签名为 `(filters, sorter, extra)`。
- **样式系统** 基于 tailwind-variants，参考 Nuxt UI 的三层主题覆盖机制
- **多预设** 同一套表格逻辑贴合不同 UI 体系的视觉，当前内置 `antdv`（默认）与 `element-plus`
- **多包架构** pnpm workspace monorepo，按职责拆分

---

## 2. 工程基建

| 类别     | 内容                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 包管理   | pnpm workspace（`packages/*` + `site` / `play` / `perf` / `playground`）                                         |
| 任务编排 | Turborepo，`build` 依赖上游 `^build`；`dev` / `lint` / `type-check` 同理                                         |
| 引擎锁定 | node `^20.19.0 \|\| >=22.12.0`，pnpm `>=10.28.0`，`preinstall` 强制 pnpm                                         |
| 构建     | Vite 7 library mode，仅输出 ESM；`vite-plugin-dts` 生成声明                                                      |
| 类型     | TypeScript project references，各包 `composite: true` 继承 `tsconfig.base.json`                                  |
| 测试     | Vitest 多 project workspace（根 `vitest.config.ts`）+ happy-dom，26 个测试/基准文件                              |
| 代码规范 | ESLint 9 flat config + Prettier（无分号、单引号、100 字宽）+ Stylelint                                           |
| Git 规范 | husky pre-commit(lint-staged) + commit-msg(commitlint) + commitizen                                              |
| 版本发布 | Changesets；CI（lint / type-check / test / build）、Release（npm trusted publishing）、Deploy Site 三条 workflow |
| JSX      | `@vitejs/plugin-vue-jsx`                                                                                         |

---

## 3. packages 目录结构

五个包。只有聚合入口 `@vtable-guild/vtable-guild` 是公开发布的，其余四个当前均为 `private`，
仅通过聚合入口对外。

```
packages/
├── core/                              # @vtable-guild/core
│   ├── src/
│   │   ├── components/                # 与表格无关的基础 UI（全部 TSX）
│   │   │   ├── Button.tsx  Checkbox.tsx  Input.tsx  Radio.tsx  Tooltip.tsx
│   │   │   ├── Scrollbar.tsx  ScrollbarBar.tsx      # 跨预设自绘滚动条
│   │   │   ├── VTableGuildConfigProvider.tsx        # 子树级预设/语言覆盖
│   │   │   └── VirtualList/                         # vendored 虚拟列表
│   │   │       ├── VirtualList.tsx  Filler.tsx  Item.tsx  VirtualScrollBar.tsx
│   │   │       ├── hooks/            # useHeights / useScrollTo / useFrameWheel ...
│   │   │       └── utils/            # PrefixSums（前缀和 + 二分位置表）、CacheMap ...
│   │   ├── composables/
│   │   │   ├── useTheme.ts           # 三层主题合并（default → global → instance）
│   │   │   └── useScrollbar.ts
│   │   ├── utils/
│   │   │   ├── tv.ts                 # tv() 封装 + cn()（tailwind-merge）统一配置
│   │   │   ├── classPrefix.ts        # prebuilt 模式的 vtg- 前缀处理
│   │   │   ├── props.ts  mergeDeep.ts  devWarn.ts  types.ts
│   │   ├── plugin/index.ts           # createVTableGuild()
│   │   └── index.ts
│   └── vite.config.ts
│
├── icons/                             # @vtable-guild/icons
│   └── src/                           # 按预设分组的 SVG 图标 + createSvgIcon.tsx
│
├── theme/                             # @vtable-guild/theme（纯数据，无 Vue 依赖）
│   ├── src/
│   │   ├── table.ts  button.ts  checkbox.ts  input.ts  radio.ts
│   │   ├── scrollbar.ts  tooltip.ts   # ↑ 均为薄 re-export，指向当前默认 preset
│   │   ├── presets/
│   │   │   ├── antdv/                 # table.ts / table-locale.ts / button.ts / ...
│   │   │   ├── element-plus/          # 同名同结构
│   │   │   ├── index.ts               # resolveThemePreset / resolveBuiltInLocale ...
│   │   │   └── types.ts
│   │   ├── compat/antdv-table.ts      # compatClass 的 ant-table-* 类名表
│   │   ├── augment.ts                 # VTableGuildThemeOverridesMap 模块增强
│   │   └── index.ts
│   └── css/
│       ├── index.css  tokens.css  transitions.css
│       └── presets/antdv.css  element-plus.css
│
├── table/                             # @vtable-guild/table
│   ├── src/
│   │   ├── components/
│   │   │   ├── VTable.vue             # 唯一的 SFC：泛型桥接层（见 §5）
│   │   │   ├── Table.tsx              # 主实现
│   │   │   ├── TableHeader.tsx  TableHeaderCell.tsx  TableBody.tsx
│   │   │   ├── TableRow.tsx  TableCell.tsx  ColGroup.tsx
│   │   │   ├── TableEmpty.tsx  TableLoading.tsx
│   │   │   ├── VirtualTableBody.tsx   # 虚拟滚动下的表体
│   │   │   ├── SortButton.tsx  FilterIcon.tsx  FilterDropdown.tsx
│   │   │   ├── SelectionCheckbox.tsx  SelectionRadio.tsx  SelectionDropdown.tsx
│   │   │   ├── ExpandIcon.tsx  ResizeHandle.tsx
│   │   │   └── VTableSummary.tsx  VTableSummaryRow.tsx  VTableSummaryCell.tsx
│   │   ├── composables/
│   │   │   ├── useColumns.ts          # 列解析、扁平化、占位常量展开
│   │   │   ├── useSorter.ts  useFilter.ts  useSelection.ts  useExpand.ts
│   │   │   ├── useTreeData.ts         # 树 → 可见行扁平化
│   │   │   ├── useScroll.ts  useFixedColumnStyle.ts  useResize.ts
│   │   │   ├── useVirtual.ts          # 纵向虚拟化
│   │   │   ├── useColumnWindow.ts  useColumnMetrics.ts   # 横向虚拟化
│   │   │   ├── useControlledColumnState.ts  useHoverState.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── column.ts              # ColumnType / ColumnGroupType / ColumnsType ...
│   │   │   ├── table.ts               # TableProps / RowSelection / Expandable / 事件类型
│   │   │   └── index.ts
│   │   ├── utils/                     # cell.ts  compat.ts  popupPosition.ts  vnode.ts
│   │   ├── constants.ts               # SELECTION_* / EXPAND_COLUMN / SELECTION_COLUMN 哨兵
│   │   ├── context.ts                 # TABLE_CONTEXT_KEY
│   │   ├── preset-config.ts
│   │   └── index.ts
│   └── vite.config.ts
│
└── vtable-guild/                      # @vtable-guild/vtable-guild（唯一公开包）
    ├── src/index.ts                   # re-export core + theme + table
    ├── src/tailwind3-preset.ts
    ├── css/                           # 从 theme/css 拷贝生成（prepare 钩子）
    └── vite.config.ts / vite.browser.config.ts / vite.preset-cjs.config.ts
```

### 3.1 包依赖关系

```
@vtable-guild/vtable-guild (聚合入口，用户唯一需要安装的包)
  ├── @vtable-guild/table
  ├── @vtable-guild/theme
  ├── @vtable-guild/icons
  └── @vtable-guild/core

@vtable-guild/table
  ├── @vtable-guild/core       (peer)
  ├── @vtable-guild/icons      (peer)
  ├── @vtable-guild/theme      (peer)
  └── vue ^3.5.0               (peer)

@vtable-guild/theme
  └── @vtable-guild/core       (devDependency —— 只用类型，产物里没有运行时引用)

@vtable-guild/icons
  └── vue ^3.5.0               (peer)

@vtable-guild/core
  ├── tailwind-variants        (dependency)
  ├── tailwind-merge           (dependency)
  └── vue ^3.5.0               (peer)
```

运行时依赖只有 `tailwind-variants` 和 `tailwind-merge`，peer 只有 `vue`。

### 3.2 各包职责

| 包名                         | 职责                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| `@vtable-guild/core`         | `tv()` / `cn()` 封装、主题合并、Vue 插件、基础 UI 组件、虚拟列表、公共类型 |
| `@vtable-guild/icons`        | SVG 图标组件，按预设分组                                                   |
| `@vtable-guild/theme`        | 各组件的 tailwind-variants 主题定义与 CSS token（纯数据）                  |
| `@vtable-guild/table`        | Table 及其子组件（TSX）+ composables + 类型                                |
| `@vtable-guild/vtable-guild` | 聚合入口，re-export 全部；用户默认安装这个                                 |

---

## 4. 主题系统设计

### 4.1 三层覆盖机制

```
Layer 1: preset 默认主题（packages/theme/src/presets/<preset>/*.ts）
    ↓ deep merge
Layer 2: createVTableGuild({ theme: { table: { ... } } }) 全局配置
    ↓ deep merge
Layer 3: <VTable :ui="{ th: '...' }" class="..." /> 实例级
```

| 层级            | 作用域               | 机制                                                       |
| --------------- | -------------------- | ---------------------------------------------------------- |
| preset 默认主题 | 组件默认样式         | `slots` + `variants` + `compoundSlots` + `defaultVariants` |
| 全局配置        | 应用级覆盖           | 同结构对象，provide/inject 注入，`cn()` 做冲突消解         |
| `ui` prop       | 实例级，任意 slot    | 对象，key 为 slot 名                                       |
| `class` prop    | 实例级，仅 root slot | class 字符串                                               |

合并在 `packages/core/src/composables/useTheme.ts`，冲突消解靠 `cn()`（tailwind-merge）。

### 4.2 主题文件规范

每个 preset 主题文件导出一个 tailwind-variants 结构的纯对象，并以 `as const satisfies ThemeConfig`
收口——`as const` 保留字面量 slot key，`satisfies` 保证结构合法，两者一起让 `ui` prop 有精确补全。

Table 主题的尺寸靠 **`compoundSlots`** 而非 `compoundVariants`：同一份 padding 要同时作用于
`th` / `td` / `title` / `footer` / `summaryCell` 五个 slot，`compoundSlots` 正是为这种「一组 slot 共享
一条规则」设计的，写成 `compoundVariants` 要重复五次。

```typescript
// packages/theme/src/presets/antdv/table.ts（节选）
export const antdvTableTheme = {
  slots: {
    root: 'relative w-full min-w-0 ...',
    table: 'w-full border-separate border-spacing-0 bg-[color:var(--vtg-table-bg)] ...',
    th: 'relative text-left font-semibold bg-[color:var(--vtg-table-header-bg)] ...',
    td: 'align-middle bg-[color:var(--vtg-table-bg)] ...',
    // ... 共 94 个 slot，完整列表见文档站的「ui Slot 参考」
  },
  variants: {
    size: { large: {}, middle: {}, small: {} },
    bordered: { true: { root: '...', th: '...', td: '...' } },
    striped: { true: { td: 'group-even/row:bg-[rgba(0,0,0,0.02)]' } },
    hoverable: { true: {} },
    loading: { true: { table: 'opacity-50 pointer-events-none select-none' } },
  },
  compoundSlots: [
    {
      slots: ['th', 'td', 'title', 'footer', 'summaryCell'],
      size: 'large',
      class:
        'px-[var(--vtg-table-cell-padding-inline-lg)] py-[var(--vtg-table-cell-padding-block-lg)]',
    },
    // middle / small 同构
  ],
  defaultVariants: { size: 'large', bordered: false, striped: false, hoverable: true },
} as const satisfies ThemeConfig

export type AntdvTableSlots = keyof typeof antdvTableTheme.slots
```

两套 preset 的 slot key 必须**完全一致**（当前各 94 个），`TableSlots` 类型从 antdv 推导。
新增 slot 时两边都要加，否则切预设会掉样式。

### 4.3 CSS 变量与样式模式

视觉 token 走 CSS 自定义属性（`packages/theme/css/`），slot class 只引用变量、不写死颜色，
这样切预设 = 换一组变量值 + 换一份 slot 定义，而覆盖单个颜色不必重写 class。

样式分发有三种模式，由 `createVTableGuild({ cssMode })` 与引入的 CSS 入口共同决定：

| 模式               | CSS 入口        | 库内部 utility |
| ------------------ | --------------- | -------------- |
| `prebuilt`（默认） | `css/style`     | 带 `vtg-` 前缀 |
| `tailwind3`        | `css/tailwind3` | 无前缀         |
| `tailwind4`        | `css/tailwind4` | 无前缀         |

`prebuilt` 的前缀由 `utils/classPrefix.ts` 在运行时处理，前缀可通过 `classPrefix` 配置。

### 4.4 兼容类名

`createVTableGuild({ compatClass: true })` 会在既有元素上**额外**输出一套 `ant-table-*` 类，
供旧项目的覆盖 CSS 继续命中。类名表在 `packages/theme/src/compat/antdv-table.ts`，
运行时拼装在 `packages/table/src/utils/compat.ts`。它不改 DOM 结构、不引入样式。

> 新增全局配置字段时要同步四处：`VTableGuildOptions`、`VTableGuildContext`、`createVTableGuild`
> 的默认值、以及 `VTableGuildConfigProvider` 的透传白名单。

---

## 5. Table 组件设计

### 5.1 为什么只有 VTable 是 SFC

表格子组件全部是 TSX——单元格渲染要处理 `customRender` 返回值、`RenderedCell`、slot 转发和
colSpan/rowSpan 合并，用渲染函数比模板直观得多。

唯一的例外是 `VTable.vue`：它是一层**泛型桥接**。内部实现 `Table.tsx` 以
`Record<string, unknown>` 单态运行（TSX 拿不到调用方的 `TRecord`），SFC 层用
`generic="TRecord extends object"` 持有调用方的真实行类型，把 props、事件和 slot 参数的类型还原回去。
`withRecordType()` 是全局唯一的类型断言点，运行时对象本就是调用方传入的数据，无成本。

### 5.2 状态管理

每块能力一个 composable，统一支持受控 / 非受控双轨（`sortOrder` vs `defaultSortOrder`、
`filteredValue` vs `defaultFilteredValue`、`selectedRowKeys` vs `defaultSelectedRowKeys`）。
跨组件数据通过 `provide/inject` + `TABLE_CONTEXT_KEY` 传递，不逐层透传 props。

### 5.3 数据管线

```
dataSource
  → filterData()    useFilter
  → sortData()      useSorter
  = processedData   ← change 事件的 extra.currentDataSource、title / footer 的入参
  → flattenTree()   useTreeData（仅树形数据；非树形时直接透传）
  = displayData     ← 实际渲染的行
```

### 5.4 虚拟化

纵向与横向共用同一份位置表实现 `PrefixSums`（前缀和 + 二分），纵向存行高、横向存列宽。

- 纵向（`virtual` + `scroll.y`）：默认实测行高，支持不定行高；传 `rowHeight` 走定高快路径，
  跳过全部测量，可视区计算恒为 O(1)
- 横向（`virtualColumn`，默认关闭）：只渲染视口内的列。有前置条件（无 `customCell` /
  `customRender`、固定列分列两端等），不满足时回落到渲染全部列并在 dev 构建告警

细节与实测数据见 [performance.md](./performance.md)。

---

## 6. ant-design-vue Table 功能对照

| 功能                  | 对应 API                                                                        | 状态                                      |
| --------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| 基础渲染              | `dataSource` + `columns`                                                        | 已实现                                    |
| 列定义                | `title` / `dataIndex` / `key` / `width` / `align` / `ellipsis`                  | 已实现                                    |
| 自定义渲染            | `bodyCell` / `headerCell` slot、`customRender`                                  | 已实现                                    |
| 排序                  | `sorter` / `sortOrder` / `defaultSortOrder` / `sortDirections`，含多列          | 已实现                                    |
| 筛选                  | `filters` / `onFilter` / `filterMode` / `filterSearch` / `customFilterDropdown` | 已实现                                    |
| 行选择                | `rowSelection`（checkbox / radio / 批量菜单 / `checkStrictly`）                 | 已实现                                    |
| 加载状态              | `loading`（`boolean` 或 `{ spinning, indicator, tip }`）                        | 已实现                                    |
| 空状态                | `empty` slot                                                                    | 已实现                                    |
| 固定表头 / 固定列     | `scroll.y`、column `fixed` + `scroll.x`                                         | 已实现                                    |
| 展开行                | `expandable`                                                                    | 已实现                                    |
| 树形数据              | `childrenColumnName` / `indentSize` / `expandedRowKeys`                         | 已实现（不支持懒加载）                    |
| 多级表头 / 单元格合并 | `ColumnGroupType.children`、`customCell` 返回 colSpan/rowSpan                   | 已实现                                    |
| 汇总行                | `VTableSummary` / `.Row` / `.Cell`                                              | 已实现                                    |
| 表头 / 表尾           | `title` / `footer`（props 或 slot）                                             | 已实现                                    |
| 列宽拖拽              | `resizable` / `minWidth` / `maxWidth` + `resizeColumn` 事件                     | 已实现                                    |
| 虚拟滚动              | `virtual` + `scroll.y`，可选 `rowHeight` / `virtualColumn`                      | 已实现                                    |
| 响应式列              | column `responsive: Breakpoint[]`                                               | 已实现                                    |
| 粘性表头              | `sticky`                                                                        | 已实现                                    |
| 自定义行 / 单元格属性 | `customRow` / `customHeaderRow` / `customCell` / `customHeaderCell`             | 已实现                                    |
| 列占位常量            | `EXPAND_COLUMN` / `SELECTION_COLUMN`                                            | 已实现                                    |
| 分页                  | —                                                                               | **明确不做**，由使用方自带                |
| 声明式列              | `<VTableColumn>` / `<VTableColumnGroup>`                                        | **未实现**，列只能通过 `columns` 数组配置 |
| 键盘可达性            | `tabindex` / `keydown`                                                          | **未实现**                                |
