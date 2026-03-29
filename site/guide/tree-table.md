# 树形表格

树形表格通过 `childrenColumnName`、`indentSize` 和展开状态控制来处理多级数据。它与展开行是两套能力：树形表格是数据本身有层级，展开行则是行外附加内容。

## 基础示例

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="treeData"
  children-column-name="children"
  :indent-size="20"
/>
```

## 可控制的点

- `childrenColumnName`：定义子节点字段名。
- `indentSize`：控制缩进宽度。
- `defaultExpandedRowKeys`：初始化默认展开节点。
- `expandedRowKeys`：受控展开状态。
- `rowSelection.checkStrictly = false`：开启树形级联选择。

## 与选择联动

树形数据下，选择逻辑与普通平铺表格不同：

- 严格模式下，父子节点互不影响。
- 非严格模式下，父节点选中状态由子节点计算而来，支持半选。

## 对照示例来源

- playground 入口：`playground/src/pages/TreePage.vue`
- 当前测试覆盖：`packages/table/src/composables/useTreeData.test.ts`、`packages/table/src/composables/useSelection.test.ts`

<PlaygroundDemo
  title="树形数据对照页"
  route="/tree"
  note="这个页面覆盖基础树形展开、默认展开、树形选择、级联选择和缩进表现。"
  :height="600"
/>
