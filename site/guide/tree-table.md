# 树形表格

当你的数据天然带有父子层级时，应该使用树形表格，而不是展开行。树形表格会基于 `childrenColumnName`、缩进宽度和展开状态来管理多级节点的展示方式。

## 在线示例

三层组织树，受控展开（`expandedRowKeys` + `onExpandedRowsChange`），勾选父节点会联动子节点。

<Demo src="tree-table/basic">

<<< @/demos/tree-table/basic.vue

</Demo>

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

## 常用控制项

- `childrenColumnName`
  指定子节点字段名
- `indentSize`
  控制层级缩进宽度
- `defaultExpandedRowKeys`
  设置默认展开节点
- `expandedRowKeys`
  改成完全受控的展开状态
- `rowSelection.checkStrictly`
  控制父子选择是否联动

## 什么时候用

- 数据本身有父子层级，而不是附加详情
- 你需要统一处理节点展开、缩进和父子选择关系
- 页面里既有树结构，又希望保留普通表格的列定义和交互方式

## 已知限制

- **不支持懒加载**：当前没有提供 `loadData` 等按需加载子节点的能力，所有子节点数据必须预先放在 `dataSource` 中。如果数据量较大，建议在业务层自行拉取完整树结构后再传入。

## 相关页面

- [行选择](/guide/selection)
- [展开行](/guide/expandable-rows)
