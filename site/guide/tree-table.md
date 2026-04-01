# 树形表格

当你的数据天然带有父子层级时，应该使用树形表格，而不是展开行。

树形表格会基于 childrenColumnName、缩进宽度和展开状态来管理多级节点的展示方式。

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

## 你可以控制的部分

- childrenColumnName，指定子节点字段名。
- indentSize，控制层级缩进宽度。
- defaultExpandedRowKeys，设置默认展开节点。
- expandedRowKeys，改成完全受控的展开状态。
- rowSelection.checkStrictly，控制父子选择是否联动。

## 和行选择一起使用

树形数据下，选择行为通常有两种模式：

- checkStrictly 为 true，父子节点互不影响，更适合“每一项单独代表一个对象”的场景。
- checkStrictly 为 false，父子节点联动，并支持半选，更适合权限树、部门树和分类树。

## 使用建议

- rowKey 要稳定，尤其是在异步更新树节点时。
- 如果层级较深，建议适当提高 indentSize，避免视觉上挤在一起。
- 当树形数据同时叠加固定列和选择列时，先确认列宽与缩进不会互相挤压。

## 相关页面

- [行选择](/guide/selection)
- [展开行](/guide/expandable-rows)
