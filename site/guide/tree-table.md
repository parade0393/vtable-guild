# 树形表格

当你的数据天然带有父子层级时，应该使用树形表格，而不是展开行。树形表格会基于 `childrenColumnName`、缩进宽度和展开状态来管理多级节点的展示方式。

## 在线示例

三层组织树，受控展开（`expandedRowKeys` + `onExpandedRowsChange`），勾选父节点会联动子节点。

<Demo src="tree-table/basic">

<<< @/demos/tree-table/basic.vue

</Demo>

## 基础示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VTable,
  type Key,
  type TableColumnsType,
  type TableProps,
} from '@vtable-guild/vtable-guild'

interface OrgNode {
  key: string
  name: string
  children?: OrgNode[]
}

const columns: TableColumnsType<OrgNode> = [{ title: '部门', key: 'name', dataIndex: 'name' }]
const treeData: OrgNode[] = [
  { key: 'team', name: '产品团队', children: [{ key: 'design', name: '设计组' }] },
]
const expandedRowKeys = ref<Key[]>(['team'])
const handleExpandedRowsChange: NonNullable<TableProps<OrgNode>['onExpandedRowsChange']> = (
  keys,
) => {
  expandedRowKeys.value = keys
}
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="treeData"
    children-column-name="children"
    :indent-size="20"
    :expanded-row-keys="expandedRowKeys"
    @expanded-rows-change="handleExpandedRowsChange"
  />
</template>
```

`TableProps<OrgNode>` 中的 `onExpand` 签名为 `(expanded: boolean, record: OrgNode) => void`，`onExpandedRowsChange` 接收 `Key[]`。在单独声明回调时使用 `NonNullable<TableProps<OrgNode>['onExpandedRowsChange']>`，可以保留接口类型并去掉可选属性的 `undefined`。

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
- `virtual`
  树形数据可以开虚拟滚动，展开状态由组件维护，见[虚拟滚动](/guide/virtualization)

## 什么时候用

- 数据本身有父子层级，而不是附加详情
- 你需要统一处理节点展开、缩进和父子选择关系
- 页面里既有树结构，又希望保留普通表格的列定义和交互方式

## 懒加载、失败和重试

配置 `loadData(record, { signal }) => Promise<TRecord[]>` 与 `isLeaf(record)`。交互保持 Ant Design 树形表格的展开模式：点击展开后显示行内加载态；失败保留错误图标，再点击重试。`onTreeLoadError(error, record)` 可接业务消息提示。

<Demo src="tree-table/lazy">

<<< @/demos/tree-table/lazy.vue

</Demo>

- 同一节点的并发加载合并为一个请求；成功结果按稳定 key 与原记录身份缓存。
- 折叠不取消请求，响应缓存但不重新展开。受控 `expandedRowKeys` 仍由业务更新；默认展开的节点也会加载。
- 返回空数组后节点成为叶子。已有 children 直接使用；组件不会修改输入 dataSource。
- 删除节点、替换同 key 的记录、改变加载器或子节点字段、卸载组件时旧请求失效并中止 signal。替换记录后需要时重新加载。
- 业务在同一记录上补入 children 数组时，以业务数据为准并清理该节点的旧请求、缓存和错误；移除该数组后不会恢复旧缓存。响应式数据的深层 children 替换遵守相同规则。
- 失效和卸载会立即让待完成的加载 / 重试返回 `false`，即使底层客户端忽略 signal。错误通知回调自身抛错或异步拒绝不覆盖原始加载错误，也不会让重试 Promise 变成拒绝。
- 加载后的子节点与普通 children 一样参与父子选择和虚拟化；父节点选择状态会根据当前已经加载的子节点重新计算，不代表选择服务端尚未加载的所有后代。
- 筛选和排序继续只处理顶层。分页只对根节点分页，子节点跟随父节点。
- 实例 `retryTreeLoad(key)` 提供程序化重试；`getTreeLoadError(key)` 读取错误。

## 已知限制

- **懒加载需要稳定 key**：不要使用行索引。已声明 `children: []` 的记录视为叶子；未提供 children 的记录由 `isLeaf(record)` 判定，未声明叶子时可继续加载。
- **筛选与排序只作用于顶层记录**：数据管线是 `dataSource → 筛选 → 排序 → 展开`，`onFilter` 不会递归 `children`。父节点命中时，它的全部子节点都保留（即使子节点本身不匹配）；父节点不命中时，整棵子树一起被移除（即使有子节点匹配）。排序同理，只重排根节点，子节点之间的顺序不变。需要按层级筛选或排序时，在业务层先处理再传入。

## 相关页面

- [行选择](/guide/selection)
- [展开行](/guide/expandable-rows)
- [表格实例与定位](/guide/table-instance)

## Type Declarations

树形配置直接属于 `TableProps<TRecord>`，父子选择属于 `RowSelection<TRecord>`。记录中的子节点字段由业务类型声明，默认字段名是 `children`。props 为相关字段节选；`TreeFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/features.ts#TreeFields

<<< @/.vitepress/type-declarations/table.ts#RowSelection

:::
