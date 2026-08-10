---
'@vtable-guild/vtable-guild': minor
---

virtual: 横向虚拟化 `virtualColumn` + 虚拟滚动内核优化

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
