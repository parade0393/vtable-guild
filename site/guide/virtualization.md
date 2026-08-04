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

## 什么时候用

- 列表行数很多，滚动明显卡顿
- 你希望在同一张表里保留列定义、主题和交互能力，而不是切换到另一种列表组件
- 当前页面的主要瓶颈来自 DOM 数量，而不是接口本身

## 自己量一遍

不必相信这里的任何说法——[性能对照页](/perf/)可以在你自己的机器上，把 vtable-guild、
ant-design-vue Table 与 el-table-v2 放在**同一批数据、同一套列配置**下跑一遍，
给出渲染耗时、DOM 节点数与内存，并一键导出结果。采集方法与已知的不对等之处都写在页面上。

## 相关页面

- [固定列](/guide/fixed-columns)
- [功能对比总览](/comparison/)
