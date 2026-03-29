# 虚拟滚动

虚拟滚动用于处理大数据量场景。当前实现以 `virtual` 和 `scroll.y` 组合启用，只渲染可视区域，并兼容基础列配置和固定列场景。

## 启用方式

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ y: 400 }"
  :virtual="true"
/>
```

## 当前约束

- 需要同时提供 `virtual` 和 `scroll.y`。
- 使用虚拟滚动时，不建议依赖会跨行合并的复杂 `customCell` / `customRender` 场景。
- 固定列和虚拟滚动可以组合，但更适合先在 playground 页面里观察滚动与阴影行为。

## 适用场景

- 1,000 到 10,000 行的大表格滚动。
- 需要保留统一表头和主题系统，而不是切换成完全不同的列表组件。

## 对照示例来源

- playground 入口：`playground/src/pages/VirtualPage.vue`
- 当前测试覆盖：`packages/table/src/composables/useVirtual.test.ts`、`packages/table/src/composables/useScroll.test.ts`

<PlaygroundDemo
  title="虚拟滚动验证页"
  route="/virtual"
  note="这个页面覆盖基础虚拟滚动、虚拟滚动加固定列，以及非虚拟滚动基线对照。"
  :height="560"
/>
