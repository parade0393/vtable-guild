# antdv 兼容类名（compat class）实施计划

> 目标：让 antdv 时期写的覆盖 CSS 在迁移到 vtable-guild 后继续生效。
> 全局 opt-in、默认关闭，不改动 DOM 结构。

---

## 背景

vtable-guild 的定位是「给已经在用 antdv 的团队做表格替换件」，但目前组件**完全不输出任何语义类名**
——实测 `packages/table/src` 内无任何 `ant-` / `vtg-table-` 语义 class，只有 Tailwind 原子类和
`data-vtg-*` 属性。

这让迁移出现一道隐性门槛：团队在 antdv 时期写的 `.ant-table-thead > tr > th { ... }`、
`:deep(.ant-table-cell)` 这类覆盖 CSS，换过来后全部失效，必须逐条重写成 Tailwind 或 `ui` prop。
对「零迁移成本替换件」这个价值主张是直接削弱。

---

## 可行性前提（决定这件事能不能做）

antdv 4.2.6 的表格样式全部嵌套在 `.ant-table-wrapper` 下，且 cssinjs 会把 hash 类注入到**根选择器**
上——见 `ant-design-vue/es/_util/cssinjs/hooks/useStyleRegister/index.js:29` 的 `injectSelectorHash`，
实际产出形如：

```css
.css-dev-only-do-not-override-<hash>.ant-table-wrapper .ant-table-thead > tr > th { ... }
```

**所以即使我们输出全套 `ant-table-*`，antdv 自己的样式表也匹配不到我们的元素**（我们不带那个 hash
类），而用户手写的 `.ant-table-thead > tr > th` 能正常命中。这正是需要的效果。

唯一例外：团队使用 `StyleProvider hashed={false}` 时 antdv 不生成 hash 类，选择器退化为
`.ant-table-wrapper .ant-table-cell`，此时会真串味。**这是默认关闭的核心理由，必须写进文档。**

---

## 已定决策

| 项       | 决定                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 开启方式 | 全局 opt-in，`createVTableGuild({ compatClass: true })`，默认关；boolean 而非枚举（当前只有 antdv 一种，将来若需 element-plus 可无破坏地拓宽为 `boolean \| 'element-plus'`）；只读——安装时读取一次，不支持运行时切换 |
| 前缀范围 | 只做 antdv 一套；**element-plus 等其他预设也用这一套**，不随 preset 切换                                                                                                                                             |
| 组件范围 | 只 Table 及其子结构，不动 core 基础组件                                                                                                                                                                              |
| DOM 结构 | 不补 `.ant-table-container` 等中间层，只给现有元素加 class                                                                                                                                                           |

---

## 设计

### 1. 注入点：slot 函数，且绕开 tailwind-merge

`useTheme` 的 slot 函数是全库唯一的 class 出口（`packages/core/src/composables/useTheme.ts:85-99`），
主题有约 95 个 slot，`fixedCell` / `tdSelected` / `expandedRow` / `title` / `footer` / `summary` /
`headerWrapper` / `bodyWrapper` 都已存在。**在这一处注入即可覆盖绝大部分表面，不必改 24 个子组件。**

关键约束：**兼容类名不是 Tailwind utility，绝不能进入 tailwind-merge 管道。**

原因是 `cnByCssMode`（`packages/core/src/utils/classPrefix.ts:97`）在 prebuilt 模式下会按
`classPrefix` 把 class 分成「内部 utility」和「普通」两桶。默认 `classPrefix: 'vtg'` 时
`ant-table-cell` 落入普通桶、原样穿过 tailwind-merge，没问题；但 `classPrefix` 是用户可配的，
一旦有人配了 `classPrefix: 'ant'`，`ant-table-cell` 会被误判为内部 utility → 反前缀成 `table-cell`
（**这是真实的 Tailwind display 工具类**）→ 与其它 display 类冲突时被 tailwind-merge 丢弃。

因此在 `cnByCssMode` **之外**追加，并放在最前面（devtools 可读性更好）：

```ts
return [
  compatClassesFor(slotName),
  cnByCssMode(cssMode.value, classPrefix.value, base, uiClass, extraClass),
]
  .filter(Boolean)
  .join(' ')
```

### 2. 映射表的数据结构与存放位置

映射表是纯数据 → 放 `@vtable-guild/theme`（该包定位就是纯数据），新增
`packages/theme/src/compat/antdv-table.ts`。

因为 `theme` 依赖 `core`（反向不成立），映射表由 `Table.tsx` 传入 `useTheme`，`core` 保持对 antdv
无感知：

```ts
// packages/table/src/components/Table.tsx
const { slots: themeSlots } = useTheme('table', defaultTheme, props, {
  compatClasses: antdvTableCompatClasses,
})
```

`useTheme` 在 setup 阶段读一次 `globalContext?.compatClass`（布尔开关，只读非响应式），
为 false / 未配置就整段跳过（零开销）。

映射表形状复用 `ThemeConfig` 的心智（slots + variants），但**自己解析、不进 `tv()`**：

```ts
export const antdvTableCompatClasses = {
  slots: { root: 'ant-table-wrapper ant-table', th: 'ant-table-cell' /* ... */ },
  variants: {
    size: { small: { root: 'ant-table-small' }, middle: { root: 'ant-table-middle' } },
    bordered: { true: { root: 'ant-table-bordered' } },
  },
}
```

variant 解析约 15 行：遍历 `variants` 的 key，读 `props[key]`（缺省回落
`defaultTheme.defaultVariants[key]`），命中则并入。

**去重**：slot 函数内部 join 前做一次 `Set` 去重（同一 slot 的 slots + variants 命中同名类时）。
**已知限制**：调用点在 slot 函数之外二次合并的场景（如 `Table.tsx:734` 的
`cn(themeSlots.th(), groupedHeaderThemeClasses.value.th)`）无法在 `useTheme` 内去重——
tailwind-merge 对未知类名不去重，`ant-table-cell` 可能在最终 class 字符串中出现两次。
浏览器对重复 class 无感，无功能影响，接受不处理。

### 3. 第一层 · slot 驱动（本次主体）

| 我们的 slot                                               | antdv class                                                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `root`                                                    | `ant-table-wrapper ant-table`                                                                               |
| `wrapper`                                                 | `ant-table-container ant-table-content`                                                                     |
| `thead` / `tbody` / `tr`                                  | `ant-table-thead` / `ant-table-tbody` / `ant-table-row`                                                     |
| `th` / `td`                                               | `ant-table-cell`                                                                                            |
| `empty`                                                   | `ant-table-placeholder`                                                                                     |
| `thSortable` / `thSorted` / `tdSorted`                    | `ant-table-column-has-sorters` / `ant-table-column-sort` / `ant-table-column-sort`                          |
| `sortButton` / `sortAreaWrapper` / `sortAreaTitle`        | `ant-table-column-sorter` / `ant-table-column-sorters` / `ant-table-column-title`                           |
| `filterIcon` / `filterDropdown` / `filterDropdownActions` | `ant-table-filter-trigger` / `ant-table-filter-dropdown` / `ant-table-filter-dropdown-btns`                 |
| `title` / `footer` / `summary`                            | `ant-table-title` / `ant-table-footer` / `ant-table-summary`                                                |
| `headerWrapper` / `bodyWrapper`                           | `ant-table-header` / `ant-table-body`                                                                       |
| `expandedRow`                                             | `ant-table-expanded-row`                                                                                    |
| `expandIcon` / `…Expanded` / `…Collapsed` / `…Spaced`     | `ant-table-row-expand-icon` / `ant-table-row-expanded` / `ant-table-row-collapsed` / `ant-table-row-spaced` |
| `treeExpandIcon*`                                         | 同上                                                                                                        |
| `resizeHandle`                                            | `ant-table-resize-handle`                                                                                   |
| `selectionDropdown` / `selectionExtra`                    | `ant-table-selection` / `ant-table-selection-extra`                                                         |
| `bodyCellEllipsis`                                        | `ant-table-cell-content`                                                                                    |
| variants                                                  | `size: small→ant-table-small, middle→ant-table-middle`；`bordered: true→ant-table-bordered`                 |

> ⚠️ **类名以 antdv 4.2.6 源码为准，不可凭印象。**
> 已核对修正：展开图标是 `ant-table-row-expand-icon` + `ant-table-row-expanded` /
> `-collapsed` / `-spaced`（`vc-table/utils/expandUtil.js:10-25`），**不是** `-row-expand-icon-expanded`。
> 权威清单：从 `es/table/style/*.js` 提取出 58 个类名，再用 `es/vc-table/**` 补状态类。

### 4. 第二层 · 状态驱动（slot 覆盖不到，需在调用点补）

| antdv class                                                           | 落点                                        | 现有可复用钩子                                             |
| --------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `ant-table-row-selected`                                              | `<tr>`                                      | `tableContext.getRowClassName`（`TableBody.tsx:114`）      |
| `ant-table-row-level-{n}`                                             | `<tr>`                                      | 同上 + `treeRowMetaMap`（`Table.tsx` 内已有 level）        |
| `ant-table-selection-column`                                          | 选择列 th/td                                | `displayColumns` 里的 `__vtg_selection__` key              |
| `ant-table-row-expand-icon-cell`                                      | 展开列 cell                                 | 同上                                                       |
| `ant-table-cell-fix-left` / `-right` / `-left-last` / `-right-first`  | 固定列 cell                                 | `useFixedColumnStyle` + 已有 `fixedDividerLeft/Right` slot |
| `ant-table-cell-ellipsis`                                             | `<td>`（antdv 放 td 上，我们放在内层 span） | `TableCell.tsx`                                            |
| `ant-table-ping-left` / `-right`、`ant-table-has-fix-left` / `-right` | root                                        | `useScroll` 已有的滚动边界布尔值                           |

第二层可作为独立提交，不阻塞第一层落地。

---

## 实施步骤

1. **`packages/core/src/utils/types.ts` 与 `packages/core/src/index.ts`** — `VTableGuildOptions` 与
   `VTableGuildContext` 各加 `compatClass?: boolean`（context 上可选，未配置即 `undefined`）。
   ⚠️ 这两个接口在 core 里有**两份平行定义**（index.ts 一份、utils/types.ts 一份，
   plugin 用 index.ts 的，Scrollbar 等用 utils/types.ts 的），两处都要改，漏一处类型检查即失败。
2. **`packages/core/src/plugin/index.ts:47`** — reactive context 增加 `compatClass: options.compatClass`。
3. **`packages/core/src/composables/useTheme.ts`** — 第 4 个可选参数
   `options?: { compatClasses?: CompatClassConfig }`（`CompatClassConfig` 定义在 core，
   theme 从 core 引入类型，避免双份定义）；setup 阶段读一次开关；新增 variant 解析与去重；
   在 slot 函数里按上文顺序拼接。**不改动 `_slotFns` 的 computed 缓存结构**
   （兼容类名与 variant props 同源，可一并缓存）。
4. **`packages/theme/src/compat/antdv-table.ts`（新建）** — 映射表数据（类型从 core 引入）；
   由 `packages/theme/src/index.ts` 导出。
5. **`packages/table/src/components/Table.tsx:419`** — 传入 `compatClasses`。
6. **第二层状态类** — 按上表逐项补到调用点。
7. **文档** — `site/` 新增迁移页：如何开启、命中/不命中的选择器对照、`hashed={false}` 的串味警告、
   以及「这不是 API 契约，DOM 结构可能变」的免责声明。

---

## 验证

1. **单测**（`packages/core/src/composables/useTheme.test.ts` 已有 prebuilt / tailwind3 / tailwind4
   三模式用例，照此扩展）：
   - `compatClass` 未配置时输出与现在**逐字符相同**（防回归，最重要的一条）
   - 三种 cssMode 下兼容类名都不被前缀污染
   - `classPrefix: 'ant'` 边界下 `ant-table-cell` 不被 tailwind-merge 吞掉
   - 同元素叠加多 slot 时 `ant-table-cell` 只出现一次
2. **`pnpm --filter @vtable-guild/table test`** — 确认既有用例全绿。
3. **视觉验证**（CLAUDE.md 强制要求）：`pnpm playground`，用 Chrome MCP 对比开启前后截图，
   确认**像素无变化**（只加 class 不加样式）。
4. **串味实测**：造一个同时加载 antdv CSS 的页面，确认默认 hash 模式下我们的表格不被 antdv 样式
   影响；再切 `hashed={false}` 复现串味，把结果写进文档。
5. **DOM 节点数不变** — 用 `/perf` 对照页确认本次改动只增加 class 字符串，不增加节点。

---

## 风险

- **DOM 契约固化**：一旦用户依赖 `ant-table-*` 写覆盖，我们改 DOM 结构就成了破坏性变更。
  文档必须显式声明「兼容类名是迁移辅助，不是稳定 API」。
- **`hashed={false}` 串味**：默认关闭 + 文档警告是主要缓解手段。
- **class 字符串变长**：每个 cell 多约 15 字符。10 万行虚拟滚动下只渲染十几行，影响可忽略，
  但仍需用 `/perf` 复核一次。
