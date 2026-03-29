# 多级表头与单元格合并

这一组能力主要解决复杂报表布局：表头可以通过 `children` 形成多级结构，表体可以通过 `customCell` 和 `customRender` 返回的 `colSpan` / `rowSpan` 做行列合并。

## 多级表头

```ts
const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: 'Profile',
    key: 'profile',
    children: [
      { title: 'Age', dataIndex: 'age', key: 'age', width: 90 },
      { title: 'Region', dataIndex: 'region', key: 'region', width: 150 },
    ],
  },
]
```

当前表头合并只走列配置上的 `children` 与 `colSpan`，不额外扩展 header rowSpan API。

## 表体单元格合并

```ts
const columns = [
  {
    title: 'Group',
    dataIndex: 'group',
    key: 'group',
    customCell: (_record, index) => {
      if (index === 0) return { rowSpan: 2 }
      if (index === 1) return { rowSpan: 0 }
      return {}
    },
  },
  {
    title: 'Name',
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

## 当前约束

- 表头分组依赖稳定列结构，建议同时提供明确 `width`。
- 表体合并能力依赖 `customCell` 或 `RenderedCell.props`，适合静态报表结构。
- `virtual=true` 时不支持跨行合并，因为虚拟列表只渲染可见区行节点。

## 组合场景

- 多级表头 + 表体合并：适合复杂统计报表。
- 多级表头 + 行选择：支持，但建议先在 playground 对照页观察布局结果。
- 多级表头 + 固定列：可组合，但需要更谨慎地控制列宽与滚动区宽度。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 相关测试覆盖：packages/table/src/composables/useColumns.test.ts、packages/table/src/components/VTable.test.ts

<PlaygroundDemo
  title="多级表头与单元格合并对照页"
  route="/advanced"
  note="Advanced 页面中的 Case 06 到 Case 08 覆盖了多级表头、rowSpan/colSpan 合并，以及它们与行选择组合时的表现。"
  :height="920"
/>
