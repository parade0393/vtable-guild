# 列显示与列顺序

「列设置」是最常见的列管理诉求：让用户勾选想看的列、按自己的习惯排列字段顺序。VTable
把这两件事拆成两个受控属性——列级 `visible` 控制是否显示，表级 `columnOrder` 控制显示顺序，
显示状态本身由你的应用持有（便于持久化到 localStorage 或用户偏好）。

## 在线示例

用勾选框切换列的显隐，用 ‹ › 按钮调整列顺序。

<Demo src="column-display/basic">

<<< @/demos/column-display/basic.vue

</Demo>

## 列显示 visible

在列上设置 `visible: false`，该列从表头和表体中移除。它是受控属性：显示与否完全由外部
字段决定，需要恢复显示时把 `visible` 改回来（或删掉这个字段）即可。

```ts
const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180 },
  // 用户在「列设置」里取消勾选了这一列
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, visible: false },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
]
```

关键行为：

- 隐藏只作用于显示层。列上已激活的排序/筛选状态**不会**被丢弃——隐藏一个正在排序的列，
  行序仍受它影响；重新显示后排序依旧生效。
- 分组列 `visible: false` 时整组隐藏；组内子列全部被隐藏时，整个空组也会被移除。
- 可以与 `responsive` 组合：两者任一不满足，列都不显示。

## 列顺序 columnOrder

`columnOrder` 是一个 key 数组，表达列的显示顺序：

```vue
<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :column-order="['status', 'name']"
  />
</template>
```

上面的配置下，列的渲染顺序为 `status → name → age`（若 `columns` 里还有未提到的列）：

- 在 `columnOrder` 中出现的列按数组顺序排前；同一 key 重复出现时取首次位置。
- 未出现的列（含无 key 列）保持原相对顺序，排在已匹配列之后。
- 选择列 / 展开列不参与顺序匹配，固定在行首。
- 只重排顶层列：分组列整组移动，不支持把子列移出分组。

## 已知边界

- 重排可能破坏「左固定列连成前缀、右固定列连成后缀」的结构。非虚拟模式下 sticky 固定列
  仍正常工作，但穿插排列时固定列阴影可能出现异常；开启 `virtualColumn` 横向虚拟化时,
  不满足结构会有 dev 告警并回落为渲染全部列。
- 列宽拖拽的宽度覆写按列 key 记录，重排后自动保留。

## 相关页面

- [列宽拖拽](/guide/column-resize)
- [固定列](/guide/fixed-columns)
- [API 参考](/guide/api-reference)
