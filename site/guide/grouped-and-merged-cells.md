# 多级表头与单元格合并

这一组能力主要服务于报表类页面。简单数据表一般不需要它，但一旦表格开始承载指标分组、结构化汇总或复杂横向布局，它就会变得很重要。

## 在线示例

三层嵌套表头，配合 `customCell` 返回的 `rowSpan` 纵向合并「区域」列。

<Demo src="grouped-and-merged-cells/basic">

<<< @/demos/grouped-and-merged-cells/basic.vue

</Demo>

## 多级表头

多级表头通过 children 形成层级结构。

```ts
const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: '画像信息',
    key: 'profile',
    children: [
      { title: '年龄', dataIndex: 'age', key: 'age', width: 96 },
      { title: '区域', dataIndex: 'region', key: 'region', width: 150 },
    ],
  },
]
```

## 表体合并

表体合并主要通过两种方式完成：

- customCell 返回 rowSpan 或 colSpan。
- customRender 返回带 props 的 RenderedCell。

```ts
const columns = [
  {
    title: '组别',
    dataIndex: 'group',
    key: 'group',
    customCell: (_record, index) => {
      if (index === 0) return { rowSpan: 2 }
      if (index === 1) return { rowSpan: 0 }
      return {}
    },
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ text, record, index }) =>
      index === 4
        ? {
            children: `${String(text)} / ${record.score}`,
            props: { colSpan: 2 },
          }
        : String(text),
  },
]
```

## 使用边界

- 多级表头依赖相对稳定的列结构，建议提供清晰的 width。
- 单元格合并更适合静态报表和明确分组结构。
- 开启 virtual 后，不适合再做跨行合并，因为虚拟滚动只渲染可视区域行节点。

## 使用建议

- 表格一旦同时叠加固定列、多级表头和合并单元格，先保证布局稳定，再叠加其他交互。
- 如果只是想强调某些单元格样式，不要急着用合并，优先考虑 ui、customRender 或 summary。

## 合并单元格的 hover 行为

当表格开启 `hoverable`（默认为 `true`）时，hover 高亮会正确处理跨行合并的情况：

- hover 任意一行时，该行所有单元格高亮，包括跨行合并单元格（即使它的起始行不在当前行）。
- hover 跨行合并单元格本身时，它所跨越的所有行都会整体高亮。

这与 ant-design-vue 的行为一致，通过 JS 区间重叠判断实现，不依赖 CSS group-hover。

## 相关页面

- [标题与摘要行](/guide/title-footer-summary)
- [固定列](/guide/fixed-columns)
