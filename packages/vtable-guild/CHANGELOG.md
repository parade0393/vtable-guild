# @vtable-guild/vtable-guild

## 2.5.0

### Minor Changes

- [`c88f935`](https://github.com/parade0393/vtable-guild/commit/c88f935f03b3a5923eef4ca05dad09c7e8f90e3a) Thanks [@parade0393](https://github.com/parade0393)! - virtual: 横向虚拟化 `virtualColumn` + 虚拟滚动内核优化

  **新增 API**
  - `virtualColumn`：横向虚拟化，只渲染视口内的列。严格 opt-in、默认 `false`，仅在 `virtual` 下生效。
    实测 1 万行 × 200 列：可视列数 200 → 13，连续滚动 longtask 4,391ms → **0**，DOM 节点数 3,659 → 1,415。
    6 列基准档开与不开完全持平，所以列不多时不必开。
    列宽不要求声明数字（`auto`、百分比都支持），因为宽度是从表头实测的。
    已知边界：列滚出窗口时挂在该列表头上的筛选面板 / tooltip 会随之卸载；
    列上有 `customCell` / `customRender`、固定列未分列两端等情况下会被忽略并回落到渲染全部列（dev 期给出原因）。
  - `rowHeight`：定高快路径。传入时跳过 ResizeObserver 与行高实测，滚动期每帧成本减半。
    仅在每行实际高度确实等于该值时使用；有换行文本或自定义高度渲染时不要传。

  **性能**
  - 消除虚拟滚动路径上三处无条件 O(n)：非树数据不再触发全量树展平；滚动不再每帧重建全表前缀和；
    删除返回值未被使用的 `useDiffItem`。另修非虚拟路径 `TableBody` 缺守卫的 O(n²) `find()`。
    10 万行挂载不再随行数增长（1k 11ms → 10 万 13ms，DOM 节点数两档恒为 167）。
  - 行位置表改为 `PrefixSums`（`Float64Array` 持久化 + 增量更新 + 二分），滚动从 O(n) 降到 O(log n)，
    与 TanStack Virtual / el-table-v2 同一算法复杂度。
  - 虚拟行不再各自渲染 `<colgroup>`，6 列档 DOM 节点数 −33%、200 列档 −40%。

  **修复**
  - `auto` / 百分比列宽在虚拟模式下被当作 0 计入 `scrollWidth`，导致横向滚动范围不足、滚不到最后几列。
  - 拖拽列宽时 `table-layout: fixed` 下画面要到松手才跳变，现在实时跟随。

  **内部注意**：`ColGroup` 改为读 `columnWidths`（与 `TableCell` / `TableHeaderCell` 同源）；
  core 的 `PrefixHeights` 更名为 `PrefixSums` 并同时服务行高与列宽两条轴。

## 2.4.1

### Patch Changes

- [#26](https://github.com/parade0393/vtable-guild/pull/26) [`b6b6f85`](https://github.com/parade0393/vtable-guild/commit/b6b6f850c06dd88dcb29855d01f375a03cdd4074) Thanks [@parade0393](https://github.com/parade0393)! - 补全 npm 包元信息，让包在 npm 上能被搜到、点得进文档站：
  - `homepage` 从 GitHub README 锚点改为文档站 https://parade0393.github.io/vtable-guild/
  - `keywords` 补 `virtual-scroll`、`datatable`、`data-grid`、`vue-table`、`tailwind-variants`、
    `component-library`、`typescript`
  - `description` 写明虚拟滚动与 antdv / element-plus 预设切换

  仅元信息变更，不涉及任何运行时行为。

## 2.4.0

### Minor Changes

- [#24](https://github.com/parade0393/vtable-guild/pull/24) [`0b4eb49`](https://github.com/parade0393/vtable-guild/commit/0b4eb490efead22162ba1f2621fd925f1f60722a) Thanks [@parade0393](https://github.com/parade0393)! - 新增浏览器单文件产物 `dist/index.full.mjs`，通过 `@vtable-guild/vtable-guild/full` 导出。

  该产物只把 `vue` 保留为 external，`tailwind-variants` 及其依赖全部内联，可以直接被 import map 或
  `<script type="module">` 指向，无需打包器参与：

  ```html
  <script type="importmap">
    {
      "imports": {
        "@vtable-guild/vtable-guild": "https://cdn.jsdelivr.net/npm/@vtable-guild/vtable-guild/dist/index.full.mjs"
      }
    }
  </script>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@vtable-guild/vtable-guild/css/style.css"
  />
  ```

  主入口 `.` 仍是 `preserveModules` 产物，打包器场景不受影响，也不应改用 `./full`——那份产物无法 tree-shake。

## 2.3.0

### Minor Changes

- [#22](https://github.com/parade0393/vtable-guild/pull/22) [`62d44d8`](https://github.com/parade0393/vtable-guild/commit/62d44d8e80e5927d4790e3093e229f46465f13b8) Thanks [@parade0393](https://github.com/parade0393)! - perf & build: round-2 optimizations

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

## 2.2.2

### Patch Changes

- [`47056f4`](https://github.com/parade0393/vtable-guild/commit/47056f48144b2ee8d6404966b64602cbd1100b00) Thanks [@parade0393](https://github.com/parade0393)! - Improve virtual scrolling performance, table state synchronization, and playground coverage for large-data scenarios.

## 2.2.1

### Patch Changes

- [`4e3f1d2`](https://github.com/parade0393/vtable-guild/commit/4e3f1d2900e23434a7a0f667075b85e187d9c393) Thanks [@parade0393](https://github.com/parade0393)! - Fix Tailwind 3 preset package output and consumption support.

## 2.2.0

### Minor Changes

- [#15](https://github.com/parade0393/vtable-guild/pull/15) [`9670141`](https://github.com/parade0393/vtable-guild/commit/96701417b34bebd255e83006e82fc2ba8f6fa748) Thanks [@parade0393](https://github.com/parade0393)! - Prefix internal prebuilt utility classes with `vtg-` by default, add configurable `classPrefix`, and add a Tailwind CSS 4 mode that keeps internal utilities unprefixed.

## 2.1.4

### Patch Changes

- [`4977c79`](https://github.com/parade0393/vtable-guild/commit/4977c791be18d3da33ed7f9e8a957fe009bcc8fc) Thanks [@parade0393](https://github.com/parade0393)! - Add `css/style` as the preferred prebuilt CSS entry and keep `css/tailwind3` as a compatibility alias.

## 2.1.3

### Patch Changes

- [`2acf06f`](https://github.com/parade0393/vtable-guild/commit/2acf06f749e1a1fb2fec652968fae9fcd5d8824a) Thanks [@parade0393](https://github.com/parade0393)! - Add type declarations for CSS subpath exports and document Ant Design Vue-aligned table column type aliases.

## 2.1.2

### Patch Changes

- [`dcac8da`](https://github.com/parade0393/vtable-guild/commit/dcac8daf01f26240a4fc5efd6ced8cf392995833) Thanks [@parade0393](https://github.com/parade0393)! - Fix Tailwind CSS 3 consumption by shipping a prebuilt `css/tailwind3` entry that includes the component theme CSS and generated utilities.

## 2.1.1

### Patch Changes

- [`b1be02b`](https://github.com/parade0393/vtable-guild/commit/b1be02bded36fe2686f92cecc07d08ef2bf79116) Thanks [@parade0393](https://github.com/parade0393)! - fix: align element-plus theme styles and add feature limitation docs
  - align element-plus filter dropdown styles with upstream
  - add min-w-0 to table root to constrain width in flex/grid parents
  - refine element-plus font stack and drop playground override
  - document tree table lazy loading and expand row preserve-expanded-content limitations

## 2.1.0

### Minor Changes

- [`e84a3a2`](https://github.com/parade0393/vtable-guild/commit/e84a3a268c85292605f74d20aa740c3f86d6ab6e) Thanks [@parade0393](https://github.com/parade0393)! - Align the table API more closely with ant-design-vue, including fixed columns,
  loading options, ellipsis behavior, and size naming.

  Add `EXPAND_COLUMN` and `SELECTION_COLUMN` sentinel support for controlling
  expand and selection column placement.

  Fix filter and sorter dropdown interactions, improve external CSS utility
  coverage, and update compatibility, installation, and type reference docs.

## 2.0.6

### Patch Changes

- [`fc0cc39`](https://github.com/parade0393/vtable-guild/commit/fc0cc39cba2f1beccfefb343c4c2e3a07104076b) Thanks [@parade0393](https://github.com/parade0393)! - fix(vtable-guild): restore type hints for createVTableGuild theme parameter

  Fixed missing type hints for the `theme` parameter in `createVTableGuild()` by adding module augmentation to the bundled type declarations. The `theme` object now correctly shows available keys (table, button, checkbox, radio, input, tooltip, scrollbar) with full IntelliSense support.

## 2.0.5

### Patch Changes

- [`b6b51d2`](https://github.com/parade0393/vtable-guild/commit/b6b51d2f005acd16a3e920b65649df06248f94a7) Thanks [@parade0393](https://github.com/parade0393)! - fix: ensure single-package CSS integration works in both workspace dev and published usage
  - keep @vtable-guild/vtable-guild/css as the canonical CSS entry and package-level published asset
  - align playground integration with documented usage by importing package CSS from the CSS entry file
  - fix aggregated CSS copy/rewrite flow so style resolution does not break after packaging
  - normalize table-related arbitrary utility color classes for reliable Tailwind generation

## 2.0.4

### Patch Changes

- [`af327e4`](https://github.com/parade0393/vtable-guild/commit/af327e4cb9ef44c09cc85e8f3dd3a2f240ee45a8) Thanks [@parade0393](https://github.com/parade0393)! - chore: 收敛为单包发布，刷新安装文档与类型校验
  - 将 core/icons/theme/table 源码内联到 `@vtable-guild/vtable-guild` 产物，发布包不再引用 workspace 依赖
  - 新增 `./css`、`./css/tokens`、`./css/presets/*` 导出，构建时通过 `scripts/copy-theme-css.mjs` 拷贝主题样式
  - 使用独立 `tsconfig.build.json` 做 `vue-tsc --noEmit`，避免污染其他包
  - 补充 `theme-overrides.typecheck.spec.ts` 固化主题覆写类型面
  - 文档：`package-consumption.md` 重命名为 `installation.md` 并同步安装指引

## 2.0.3

### Patch Changes

- [`4e7ff0e`](https://github.com/parade0393/vtable-guild/commit/4e7ff0ed7803c48cbf52c49717d00f5103f00307) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目的 theme 类型提示与模块增强导出
  - core: 收紧 `VTableGuildThemeOverrides`，改为通过 `VTableGuildThemeOverridesMap` 做类型扩展
  - theme: 将模块增强内联到入口声明，确保生成的 `dist/index.d.ts` 保留组件主题类型
  - vtable-guild: 同步发布聚合包，带出类型修复

- Updated dependencies [[`4e7ff0e`](https://github.com/parade0393/vtable-guild/commit/4e7ff0ed7803c48cbf52c49717d00f5103f00307)]:
  - @vtable-guild/core@2.0.3
  - @vtable-guild/theme@2.0.3
  - @vtable-guild/table@2.0.3

## 2.0.2

### Patch Changes

- [`6649ca7`](https://github.com/parade0393/vtable-guild/commit/6649ca7d762d443cc122f8348bddd723d96a825c) Thanks [@parade0393](https://github.com/parade0393)! - fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 接口支持 module augmentation
  - theme: 通过 augment.ts 注入所有组件的精确 ThemeConfig 类型
  - table: 修复生成的 .d.ts 中 import 路径为工作区相对路径的问题
  - docs: 新增 ui Slot 参考页，列出所有 60+ theme slot

- Updated dependencies [[`6649ca7`](https://github.com/parade0393/vtable-guild/commit/6649ca7d762d443cc122f8348bddd723d96a825c)]:
  - @vtable-guild/core@2.0.2
  - @vtable-guild/theme@2.0.2
  - @vtable-guild/table@2.0.2

## 2.0.1

### Patch Changes

- fix: 修复外部项目类型提示缺失，增强 theme 配置类型推导
  - core: 新增 VTableGuildThemeOverridesMap 可增强接口，createVTableGuild 的 theme 参数现在有完整的 key 和 slot 级别类型补全
  - theme: 通过 module augmentation 注入内置组件的精确 ThemeConfig 类型
  - table: 修复 .d.ts 中 import 路径为工作区相对路径的问题，新增 tsconfig.build.json
  - theme/table: dts 构建配置添加 paths 清空，防止 workspace paths 泄漏到声明文件
  - docs: 新增 ui Slot 参考页，列出全部 60+ theme slot 及使用示例

- Updated dependencies []:
  - @vtable-guild/core@2.0.1
  - @vtable-guild/theme@2.0.1
  - @vtable-guild/table@2.0.1

## 2.0.0

### Patch Changes

- Updated dependencies [[`f3f1eae`](https://github.com/parade0393/vtable-guild/commit/f3f1eaed310ab6c6d77b4bd9bc4d0149aba05d29)]:
  - @vtable-guild/theme@2.0.0
  - @vtable-guild/table@2.0.0

## 1.0.2

### Patch Changes

- 4e5951f: Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

  Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.

- Updated dependencies [4e5951f]
  - @vtable-guild/core@1.0.2
  - @vtable-guild/table@1.0.2
  - @vtable-guild/theme@1.0.2

## 1.0.1

### Patch Changes

- 59da816: fix: resolve vite-plugin-dts path alias issue causing broken `.d.ts` exports

  The generated `dist/index.d.ts` was resolving `@vtable-guild/*` package names to relative
  source paths (e.g. `../../core/src/index.ts`) due to `tsconfig.base.json` `paths` aliases
  being followed by vite-plugin-dts. Added `compilerOptions: { paths: {} }` override to
  preserve bare package identifiers in declaration output.

## 1.0.0

### Minor Changes

- c24a498: initial release of vtable-guild packages

### Patch Changes

- Updated dependencies [c24a498]
  - @vtable-guild/core@1.0.0
  - @vtable-guild/icons@1.0.0
  - @vtable-guild/table@1.0.0
  - @vtable-guild/theme@1.0.0
