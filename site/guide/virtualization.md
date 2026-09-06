# 虚拟滚动

虚拟滚动是 vtable-guild 最值得优先关注的增强能力之一。对于长列表页面，它的价值不是“多一个开关”，而是让你不必再维护另一套大数据量表格方案。

## 在线示例：10 万行

下面这张表默认装载 **10 万行**真实数据（页面内运行时生成，不是分页假象）。滚动它，同时留意 DOM 里始终只有可视区的十几行。左侧两列仍然固定，「评分」列仍然可以排序。

<Demo src="virtualization/large" :min-height="480">

<<< @/demos/virtualization/large.vue

</Demo>

## 怎么开启

虚拟滚动需要同时满足两个条件：

- `virtual` 为 `true`
- `scroll.y` 提供一个有效高度

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ y: 400 }"
  :virtual="true"
/>
```

## 关键边界

- 只写 `virtual`，不写 `scroll.y`，不会真正启用虚拟滚动
- `rowKey` 需要保持稳定，否则滚动窗口复用时容易出现状态错位
- 虚拟滚动提升的是渲染性能，不会替代服务端分页、慢查询优化或大对象计算优化

## 定高快路径 `rowHeight`

默认路径支持**不定行高**：每行挂载后实测高度，再据此算可视区。代价是挂载和滚动都要维护一张位置表。

如果你的每一行高度确实相同，可以显式声明 `rowHeight`，跳过全部行高测量——可视区计算恒为 O(1)，
挂载与滚动开销不再随总行数增长。

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ y: 400 }"
  :virtual="true"
  :row-height="55"
/>
```

- 仅在 `virtual` 下生效，单位 px
- **前提是每行实际高度确实等于该值**。存在换行文本、`ellipsis: false` 的长内容或自定义高度渲染时，
  不要传这个 prop，交给默认的实测路径
- 我们刻意不做自动探测：从 `size` 预设猜行高在长文本换行时会静默算错，而错误表现为行错位或空隙，
  很难归因，所以要求你主动声明
- dev 构建会实测首行高度，与声明值相差超过 1px 时在控制台告警；生产构建跳过这次测量

## 自动高度 `scroll.y: 'auto'`

`scroll.y` 传数字表示**固定的**表体视口高度；传 `'auto'` 则表示**自动适应内容区**：
表格充满父容器，表体高度 = 父容器可用高度 − 表头 − 固定 summary，由组件内部测量扣减。
你不必再自己监听 resize、也不必去读表头高度来手工扣减——浏览器 Ctrl+滚轮缩放、
窗口拖拽、父布局变化都会自动跟随。

<Demo src="virtualization/auto-height" :min-height="440">

<<< @/demos/virtualization/auto-height.vue

</Demo>

### 父容器要求

`'auto'` 依赖一条**确定的高度链**：

- 普通块级父容器：父容器需要有确定高度（如 `height: 400px`），且 VTable 是它的专用填充子项
- flex 布局：允许存在兄弟节点，但高度链必须确定，且 VTable 的可收缩祖先需要 `min-height: 0`——
  否则高度链在那里断掉，测不到可用高度
- 内容自然撑高的父容器（高度不确定）不适用；dev 构建下连续测不到可用高度会在控制台提示

flex 布局 + 兄弟节点的写法（勾选框切掉 `min-height: 0` 后拖动高度滑杆，可以现场复现高度链
断裂——flex 子项默认 `min-height: auto` 会拒绝收缩，容器缩了表格却不跟随、撑破容器）：

<Demo src="virtualization/auto-height-flex" :min-height="420">

<<< @/demos/virtualization/auto-height-flex.vue

</Demo>

### 行为细节

- 少量数据按内容自然收缩（maxHeight 语义），超出可用区域后才出现纵向滚动
- 普通模式与虚拟模式都支持；虚拟模式下即使 `showHeader: false` 也保持可滚动的表体
- 数字 `scroll.y` 行为完全不变；非虚拟模式下其他 CSS 字符串（`'100%'`、`calc(...)`）仍原样生效
- **虚拟模式下的字符串约束**：仅兼容正数 px（如 `'480px'`，dev 会提示改用数字）；
  `'100%'`、`'50vh'`、`calc(...)`、负数等无法可靠解析的值会告警并回落 400px 视口——
  保持虚拟可用，而不是回落全量渲染的普通表体（万行宽表上那是秒级冻结）

## 横向虚拟化 `virtualColumn`

上面那个开关虚拟化的是**行**。列很多时（百列量级）瓶颈会换一个地方：每个可见单元格
都是一个组件实例，12 行 × 200 列就是 2,400 个，滚动时每帧都要重新走一遍。
`virtualColumn` 把可见单元格数从「行 × 总列数」降到「行 × 可视列数」。

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ x: 20000, y: 400 }"
  :virtual="true"
  :virtual-column="true"
/>
```

实测 1 万行 × 200 列：可视列数 200 → 13，连续滚动 longtask 4,391ms → **0**，
排序切换 126ms → 75ms，DOM 节点数 3,659 → 1,415。完整数字与方法见[性能文档](https://github.com/parade0393/vtable-guild/blob/master/docs/performance.md)。

**默认关闭，而且应该保持关闭**，除非你的列数真的很多：6 列时它既无收益也无代价
（实测完全持平），但会多一次表头测量。

### 在线示例：1 万行 × 200 列

下面这张表 200 个叶子列，两端各有固定列。左右滚动时留意「渲染列数」——开关一关，
它立刻从十几跳回 200，而这 200 个单元格每行都要重建一次。`C1` 列仍然可以排序。

<Demo src="virtualization/wide-columns" :min-height="520">

<<< @/demos/virtualization/wide-columns.vue

</Demo>

### 什么时候它会被忽略

不满足下列任一前提时，`virtualColumn` 会被忽略、表体回落到渲染全部列，
dev 构建会在控制台给出原因：

- 没有开启 `virtual`
- 列上有 `customCell` / `customRender`——它们可能返回 `colSpan` / `rowSpan`，
  单元格合并会让某个 `<td>` 缺席，进而破坏列宽对齐（虚拟模式本就不支持合并）
- 固定列没有分列两端：左固定必须连成前缀、右固定必须连成后缀
- `showHeader: false` 且存在非数字列宽——此时没有表头可供实测，也算不出来

### 已知边界

- 列宽不要求你声明数字：`auto`、百分比都支持，因为宽度是从表头**量**出来的
- 首帧会先渲染全部列，量到宽度后才收窄。所以它优化的是**滚动与更新**，
  首次渲染耗时基本不变
- 列滚出窗口时，挂在该列表头上的筛选面板 / tooltip 会随之卸载
- 表头本身不虚拟化：列数极多时仍会渲染全部表头单元格（一次性成本，非每行）

## 什么时候用

- 列表行数很多，滚动明显卡顿
- 你希望在同一张表里保留列定义、主题和交互能力，而不是切换到另一种列表组件
- 当前页面的主要瓶颈来自 DOM 数量，而不是接口本身

## 自己量一遍

不必相信这里的任何说法——[性能对照页](/perf/)可以在你自己的机器上，把 vtable-guild、
ant-design-vue Table、antdv-next、el-table-v2 与 vxe-table 放在**同一批数据、同一套列配置**
下跑一遍（1k / 1 万 / 10 万行 × 6 / 50 / 200 列），给出渲染耗时、DOM 节点数与内存，
并一键导出结果。采集方法与已知的不对等之处都写在页面上。

## 相关页面

- [固定列](/guide/fixed-columns)
- [功能对比总览](/comparison/)
