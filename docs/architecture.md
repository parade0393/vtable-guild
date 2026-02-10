# vtable-guild 架构设计文档

## 1. 项目定位

vtable-guild 是一个 Vue 3 Table 组件库，目标：

- **功能对齐** ant-design-vue Table（排序、筛选、分页、选择、展开、固定列、虚拟滚动等）
- **样式系统** 基于 tailwind-variants，参考 Nuxt UI 的三层主题覆盖机制，用户可高度自定义
- **多包架构** pnpm workspace monorepo，按职责拆分为独立 npm 包

---

## 2. 基建现状审查

### 2.1 已完成（状态良好）

| 类别 | 内容 |
|------|------|
| 包管理 | pnpm + `pnpm-workspace.yaml`（声明 `packages/*` 和 `site`） |
| 引擎锁定 | node ^20.19.0 \|\| >=22.12.0, pnpm >=10.28.0, `preinstall` 强制 pnpm |
| 代码规范 | ESLint 9 flat config + vue-ts + prettier skip-formatting |
| 样式规范 | Stylelint + BEM pattern + Vue deep/global 支持 |
| 格式化 | Prettier（无分号、单引号、100 字宽） |
| 编辑器 | EditorConfig + VSCode settings/extensions |
| Git 规范 | husky pre-commit(lint-staged) + commit-msg(commitlint) + commitizen |
| 换行符 | `.gitattributes` 强制 LF |
| 核心依赖 | Vue 3.5, Tailwind CSS 4, tailwind-variants 3, @tailwindcss/vite |
| JSX | @vitejs/plugin-vue-jsx |

### 2.2 欠缺项

| # | 项目 | 优先级 | 说明 |
|---|------|--------|------|
| 1 | Monorepo 任务编排 | P0 | 需安装 turborepo，配置 `turbo.json`，根 scripts 改为 turbo 命令 |
| 2 | 子包结构与构建 | P0 | `packages/` 为空，需创建各子包的 package.json + vite.config.ts (lib mode) |
| 3 | TypeScript monorepo 适配 | P0 | 需创建 `tsconfig.base.json`，各子包独立 tsconfig 继承 base |
| 4 | 测试框架 | P0 | 需安装 vitest + @vue/test-utils + happy-dom，配置 workspace 模式 |
| 5 | VitePress 文档站 | P1 | `site/` 为空，需初始化 VitePress，支持组件 demo 嵌入 |
| 6 | Changesets 版本管理 | P1 | 多包独立版本管理与发布流程 |
| 7 | Playground 开发环境 | P1 | 根目录 Vite 应用改造为 playground，引用本地 packages 调试 |
| 8 | tailwind-variants 依赖位置 | P1 | 应从根 devDeps 移至 `@vtable-guild/core` 的 dependencies |
| 9 | ESLint/Stylelint monorepo 适配 | P2 | 确认 lint 规则覆盖 `packages/**` |
| 10 | CI/CD | P2 | GitHub Actions: PR 触发 lint+test+build，main 合并后自动发布 |

---

## 3. packages 目录结构

```
packages/
├── core/                          # @vtable-guild/core
│   ├── src/
│   │   ├── composables/
│   │   │   ├── useTheme.ts        # 三层主题合并（default → global → instance）
│   │   │   ├── useLocale.ts       # 国际化
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── tv.ts              # tv() 封装，统一 tailwind-merge 配置
│   │   │   ├── props.ts           # prop 定义辅助函数
│   │   │   ├── types.ts           # 公共类型
│   │   │   └── index.ts
│   │   ├── plugin/
│   │   │   └── index.ts           # createVTableGuild({ theme, locale })
│   │   └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── theme/                         # @vtable-guild/theme
│   ├── src/
│   │   ├── table.ts               # Table 主题定义
│   │   ├── pagination.ts          # Pagination 主题
│   │   ├── checkbox.ts            # Checkbox 主题（row selection）
│   │   ├── radio.ts               # Radio 主题（row selection）
│   │   ├── dropdown.ts            # Dropdown 主题（filter）
│   │   ├── empty.ts               # Empty 空状态主题
│   │   ├── spinner.ts             # Loading 主题
│   │   ├── tooltip.ts             # Tooltip 主题（sorter tooltip）
│   │   └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── table/                         # @vtable-guild/table
│   ├── src/
│   │   ├── components/
│   │   │   ├── Table.vue          # 主组件 <VTable>
│   │   │   ├── TableHeader.vue    # <thead> 区域
│   │   │   ├── TableBody.vue      # <tbody> 区域
│   │   │   ├── TableRow.vue       # <tr> 行
│   │   │   ├── TableCell.vue      # <td> 单元格
│   │   │   ├── TableHeaderCell.vue # <th> 表头单元格
│   │   │   ├── TableColumn.vue    # 声明式列 <VTableColumn>
│   │   │   ├── TableColumnGroup.vue # 列分组 <VTableColumnGroup>
│   │   │   ├── TableSummary.vue   # 汇总行 <VTableSummary>
│   │   │   ├── TableEmpty.vue     # 空状态
│   │   │   ├── TableLoading.vue   # 加载状态
│   │   │   ├── sorter/
│   │   │   │   └── SortButton.vue
│   │   │   ├── filter/
│   │   │   │   ├── FilterDropdown.vue
│   │   │   │   └── FilterIcon.vue
│   │   │   ├── selection/
│   │   │   │   ├── SelectionCheckbox.vue
│   │   │   │   └── SelectionRadio.vue
│   │   │   ├── expand/
│   │   │   │   └── ExpandIcon.vue
│   │   │   └── resize/
│   │   │       └── ResizeHandle.vue
│   │   ├── composables/
│   │   │   ├── useColumns.ts      # 列定义解析、合并
│   │   │   ├── useSorter.ts       # 排序状态管理
│   │   │   ├── useFilter.ts       # 筛选状态管理
│   │   │   ├── usePagination.ts   # 分页状态管理
│   │   │   ├── useSelection.ts    # 行选择状态管理
│   │   │   ├── useExpand.ts       # 展开行状态管理
│   │   │   ├── useScroll.ts       # 滚动/固定列/固定表头
│   │   │   ├── useResize.ts       # 列宽拖拽调整
│   │   │   ├── useTreeData.ts     # 树形数据处理
│   │   │   ├── useVirtual.ts      # 虚拟滚动
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── column.ts          # ColumnType, ColumnGroupType
│   │   │   ├── table.ts           # TableProps, TableEmits
│   │   │   ├── sorter.ts          # SorterResult, CompareFn
│   │   │   ├── filter.ts          # FilterState, FilterDropdownProps
│   │   │   ├── selection.ts       # RowSelection, SelectionItem
│   │   │   ├── expand.ts          # ExpandableConfig
│   │   │   ├── scroll.ts          # ScrollConfig
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── pagination/                    # @vtable-guild/pagination
│   ├── src/
│   │   ├── components/
│   │   │   ├── Pagination.vue
│   │   │   ├── PaginationItem.vue
│   │   │   ├── PaginationPrev.vue
│   │   │   ├── PaginationNext.vue
│   │   │   ├── PaginationJumper.vue
│   │   │   └── PaginationSizeChanger.vue
│   │   ├── composables/
│   │   │   └── usePagination.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── vtable-guild/                  # @vtable-guild/vtable-guild（聚合入口）
    ├── src/
    │   └── index.ts               # re-export 所有子包
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

### 3.1 包依赖关系

```
@vtable-guild/vtable-guild (聚合入口，用户默认安装)
  ├── @vtable-guild/table
  ├── @vtable-guild/pagination
  ├── @vtable-guild/theme
  └── @vtable-guild/core

@vtable-guild/table
  ├── @vtable-guild/core       (peerDependency)
  ├── @vtable-guild/theme      (peerDependency)
  └── @vtable-guild/pagination (peerDependency)

@vtable-guild/pagination
  └── @vtable-guild/core       (peerDependency)

@vtable-guild/theme
  └── @vtable-guild/core       (peerDependency)

@vtable-guild/core
  ├── tailwind-variants        (dependency)
  └── vue                      (peerDependency)
```

### 3.2 各包职责

| 包名 | 职责 | 用户何时直接安装 |
|------|------|-----------------|
| `@vtable-guild/core` | tv() 封装、主题合并逻辑、Vue 插件、公共类型和工具 | 想自己组装或开发新组件时 |
| `@vtable-guild/theme` | 所有组件的默认 tailwind-variants 主题定义（纯数据，无 Vue 依赖） | 想 fork 主题做深度定制时 |
| `@vtable-guild/table` | Table 及其子组件的 Vue SFC + composables + 类型 | 只需要 Table 功能时 |
| `@vtable-guild/pagination` | Pagination 组件（Table 内部使用，也可独立使用） | 只需要分页功能时 |
| `@vtable-guild/vtable-guild` | 聚合入口，re-export 所有包 | 大多数用户的默认选择 |

---

## 4. 主题系统设计

### 4.1 三层覆盖机制

```
Layer 1: @vtable-guild/theme 默认主题文件（最低优先级）
    ↓ deep merge
Layer 2: createVTableGuild({ theme: { table: { ... } } }) 全局配置
    ↓ deep merge
Layer 3: <VTable :ui="{ th: '...' }" class="..." /> 实例级（最高优先级）
```

| 层级 | 作用域 | 机制 |
|------|--------|------|
| 默认主题 (`theme/*.ts`) | 组件默认样式 | slots + variants + compoundVariants + defaultVariants |
| 全局配置 (Vue plugin) | 应用级覆盖 | 同结构对象，通过 provide/inject 注入，tailwind-merge 合并 |
| `ui` prop | 实例级，任意 slot | 对象，key 为 slot 名 |
| `class` prop | 实例级，仅 root slot | Tailwind class 字符串 |

### 4.2 主题文件规范

每个主题文件导出一个符合 tailwind-variants 结构的纯对象：

```typescript
// packages/theme/src/table.ts
export default {
  slots: {
    root: 'w-full',
    wrapper: 'overflow-auto',
    table: 'w-full border-collapse text-sm',
    thead: '',
    tbody: '',
    tr: 'border-b border-default transition-colors',
    th: 'px-4 py-3 text-left font-medium text-muted',
    td: 'px-4 py-3',
    empty: 'py-8 text-center text-muted',
    loading: 'absolute inset-0 flex items-center justify-center bg-white/60',
    sortIcon: 'ml-1 inline-block size-4 text-muted',
    filterIcon: 'ml-1 inline-block size-4 text-muted',
    selectionCell: 'w-12 px-4 py-3 text-center',
    expandIcon: 'inline-flex size-4 cursor-pointer text-muted',
    resizeHandle: 'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize',
  },
  variants: {
    size: {
      sm: { th: 'px-2 py-1.5 text-xs', td: 'px-2 py-1.5 text-xs' },
      md: { th: 'px-4 py-3 text-sm', td: 'px-4 py-3 text-sm' },
      lg: { th: 'px-6 py-4 text-base', td: 'px-6 py-4 text-base' },
    },
    bordered: {
      true: {
        table: 'border border-default',
        th: 'border border-default',
        td: 'border border-default',
      },
    },
    striped: {
      true: { tr: 'even:bg-elevated/50' },
    },
    hoverable: {
      true: { tr: 'hover:bg-elevated/30' },
    },
  },
  compoundVariants: [
    {
      bordered: true,
      size: 'sm',
      class: { th: 'px-2 py-1', td: 'px-2 py-1' },
    },
  ],
  defaultVariants: {
    size: 'md',
    bordered: false,
    striped: false,
    hoverable: true,
  },
}
```

### 4.3 组件中使用主题

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@vtable-guild/core'
import tableTheme from '@vtable-guild/theme/table'

const props = defineProps<{
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  striped?: boolean
  ui?: Partial<Record<string, string>>
  class?: string
}>()

const { slots } = useTheme('table', tableTheme, props)
// slots.root(), slots.table(), slots.th(), slots.td() ...
</script>

<template>
  <div :class="slots.root()">
    <div :class="slots.wrapper()">
      <table :class="slots.table()">
        <!-- ... -->
      </table>
    </div>
  </div>
</template>
```

---

## 5. ant-design-vue Table 功能对照清单

| 功能 | ant-design-vue 对应 | 优先级 |
|------|---------------------|--------|
| 基础表格渲染 | `dataSource` + `columns` | P0 |
| 列定义 | `title`, `dataIndex`, `key`, `width`, `align`, `ellipsis` | P0 |
| 自定义渲染 | `bodyCell`, `headerCell` slots / `customRender` | P0 |
| 排序 | `sorter`, `sortOrder`, `defaultSortOrder`, `sortDirections` | P0 |
| 筛选 | `filters`, `onFilter`, `filterMode`, `customFilterDropdown` | P0 |
| 分页 | `pagination` prop, 位置/隐藏/页码配置 | P0 |
| 行选择 | `rowSelection` (checkbox/radio), `selectedRowKeys` | P0 |
| 加载状态 | `loading` prop | P0 |
| 空状态 | `emptyText` slot | P0 |
| 固定表头 | `scroll.y` | P1 |
| 固定列 | column `fixed: 'left' \| 'right'` + `scroll.x` | P1 |
| 展开行 | `expandedRowRender`, `expandedRowKeys`, `expandRowByClick` | P1 |
| 声明式列 | `<VTableColumn>`, `<VTableColumnGroup>` | P1 |
| 汇总行 | `<VTableSummary>` | P1 |
| 表头/表尾 | `title`, `footer` slots | P1 |
| 树形数据 | `childrenColumnName`, `indentSize`, `checkStrictly` | P2 |
| 列拖拽调整宽度 | `resizable`, `minWidth`, `maxWidth`, `resizeColumn` event | P2 |
| 虚拟滚动 | `virtual` prop + `scroll.y` | P2 |
| 响应式列 | column `responsive: Breakpoint[]` | P2 |
| 粘性表头 | `sticky` prop | P2 |
| 自定义行属性 | `customRow` | P2 |
| 自定义单元格属性 | `customCell`, `customHeaderCell` | P2 |
