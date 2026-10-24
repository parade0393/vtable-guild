# 展开行

展开行适合在不跳转详情页的前提下，直接在当前表格里展示补充信息。它和树形表格不是同一类能力：树形表格处理的是数据天然分层，展开行处理的是“当前行需要额外展开一块内容”。

## 在线示例

`defaultExpandedRowKeys` 预展开第一行；第三行被 `rowExpandable` 判定为不可展开，不显示展开图标。

<Demo src="expandable-rows/basic">

<<< @/demos/expandable-rows/basic.vue

</Demo>

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType, type Expandable } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  role: string
  city: string
}

const columns: TableColumnsType<UserRow> = [{ title: '姓名', dataIndex: 'name', key: 'name' }]

const expandable: Expandable<UserRow> = {
  expandRowByClick: true,
  expandedRowRender: (record) => `${record.name} 负责 ${record.role}，所在城市为 ${record.city}`,
}

const dataSource: UserRow[] = [{ key: '1', name: 'Ada', role: '产品设计', city: 'Shanghai' }]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :expandable="expandable" />
</template>
```

## 常见扩展点

- `expandRowByClick`
  整行点击展开
- `rowExpandable: (record: TRecord) => boolean`
  按业务条件决定哪些行可展开
- `expandIcon: NonNullable<Expandable<TRecord>['expandIcon']>`
  自定义展开图标
- `showExpandColumn: false`
  隐藏独立展开列，只保留行点击展开

`TRecord` 由 `Expandable<UserRow>` 中的 `UserRow` 指定；展开图标的参数对象包含 `expanded`、`record`、`expandable` 和 `onExpand`，完整字段与回调签名见页末声明。

## 什么时候用

- 行内详情预览
- 补充说明、标签、备注信息
- 内容明显超出单元格承载范围，但又不值得单独跳转详情页

## 已知限制

- **不支持 preserve-expanded-content**：收起行时，展开内容会从 DOM 中销毁，再次展开时重新渲染。element-plus 原版 Table（2.9.7+）提供了 `preserve-expanded-content` 属性来保留已展开内容的 DOM 状态，当前 vtable-guild 尚未实现该能力。如果展开内容包含表单或有状态组件，收起后状态会丢失。

## 相关页面

- [树形表格](/guide/tree-table)
- [自定义行与插槽](/guide/api-wiring-and-slots)
- [API Reference](/guide/api-reference)
- [类型参考](/guide/type-reference)

## Type Declarations

以下声明包含展开状态、详情渲染、图标参数和展开回调。`VNodeChild` 是 Vue 的可渲染内容类型；其他依赖类型见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#Expandable

<<< @/.vitepress/type-declarations/table.ts#RowClassName

:::

## 展开列位置与标题

`expandable.expandIconColumnIndex` 指定展开列在业务列中的位置，从 0 开始；选择列仍保留在前。负数和越界值会收敛到有效范围。显式的 `EXPAND_COLUMN` 占位优先于该位置配置。

`expandable.columnTitle` 支持文本或数字标题。复杂内容使用 `#expandColumnTitle`，其优先级高于 columnTitle；选择列的标题仍由 `rowSelection.columnTitle` 配置。树形缩进图标也可使用 expandIconColumnIndex 选择业务列。
