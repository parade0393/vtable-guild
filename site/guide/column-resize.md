# 列宽拖拽

列宽拖拽适合字段很多、内容长短差异大、用户希望现场微调布局的业务表格。它延续了接近 ant-design-vue 的字段心智，但作为内建能力提供。

## 在线示例

把鼠标移到表头分隔线上左右拖动。「分类」列限制在 100–280px 之间，`resizeColumn` 事件把新宽度回写到列配置。

<Demo src="column-resize/basic">

<<< @/demos/column-resize/basic.vue

</Demo>

## 基础示例

在列上设置 `resizable: true` 即可。`width` 可以是像素数值、`auto`、百分比等 CSS 宽度，也可以省略。`minWidth` 同时约束普通布局和拖拽，`maxWidth` 只限制拖拽目标。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { VTable, type ColumnType, type VTableEventProps } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns = shallowRef<ColumnType<UserRow>[]>([
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180, resizable: true, minWidth: 120 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, resizable: true, maxWidth: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140, resizable: true },
])

const dataSource: UserRow[] = [{ key: '1', name: 'Ada', age: 28, status: 'Active' }]

const handleResize: NonNullable<VTableEventProps<UserRow>['onResizeColumn']> = (column, width) => {
  columns.value = columns.value.map((item) => (item.key === column.key ? { ...item, width } : item))
}
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    @resize-column="handleResize"
  />
</template>
```

本例只有叶子列，使用 `ColumnType<UserRow>[]` 可以直接按 key 回写宽度。列配置用 `shallowRef` 保存并整体替换数组，避免对渲染函数等复杂配置做深层响应式解包。`TableColumnsType<UserRow>` 还包含分组列和哨兵，使用它时需要先区分列的种类。事件的精确签名是 `(column: ColumnType<UserRow>, width: number) => void`。

## 关键行为

- 只有 `resizable: true` 的列会显示拖拽手柄
- 拖拽优先从表头单元格的实际渲染宽度开始，包括数字 `width`，避免余量分配或最小宽度使实际列宽大于声明值时出现起点跳变
- 拖拽过程中会实时更新列宽
- 有效拖拽结束时会触发 `resizeColumn` 事件，参数顺序为 `(column: ColumnType<TRecord>, width: number)`；其中 `width` 是受约束后的像素目标，可回写到列配置，组件不会直接修改用户传入的 `columns`
- auto 布局中，内容可能把列撑得比拖拽目标更宽；事件值不承诺等于最终实测宽度
- 未配置有效 `minWidth` 时，仅拖拽交互使用 `50px` 默认下限，普通布局不新增默认下限

## 最小列宽与布局

叶子列的 `minWidth` 是有限、非负的 CSS 像素数值，显式 `0` 有效。负数、`NaN`、`Infinity` 按未配置处理，并在开发环境提示。宽度按可见单元格的布局轨道计算，包含 padding 和 border；内容可能使它更宽。

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface WidthRow {
  key: string
  a: string
  b: string
  c: string
}

const columns: TableColumnsType<WidthRow> = [
  { title: 'A', key: 'a', dataIndex: 'a', minWidth: 160, resizable: true },
  { title: 'B', key: 'b', dataIndex: 'b', width: 60, minWidth: 100 },
  { title: 'C', key: 'c', dataIndex: 'c', minWidth: 240, resizable: true },
]
```

在 400px 容器中，这三列至少占用 500px，并产生横向滚动，即使没有设置 `scroll.x`。B 不可拖拽，且声明了 `width: 60`，仍保留 100px 下限。A 拖到 300px 时，总宽至少为 640px；A 尝试拖到 80px 时，事件目标钳制为 160px。

| 配置                        | 行为                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `width < minWidth`          | `minWidth` 优先，`width` 作为目标宽度                        |
| `maxWidth < minWidth`       | 拖拽仍保留下限，并在开发环境提示冲突                         |
| `tableLayout="auto"`        | 保留浏览器内容布局，不因下限或拖拽切换到 fixed               |
| `tableLayout="fixed"`       | 统一分配像素宽度，再供表头、表体、固定列、合计行和虚拟列使用 |
| `minWidth` 调大、调小或移除 | 重新应用约束；已有拖拽目标也会重新钳制                       |

只计算最终可见的叶子列；隐藏列不占用下限，分组表头由子列宽度决定。其他弹性列在拖拽时可以回缩或吸收余量，但不能低于自己的下限。`maxWidth` 不限制普通布局，空间充足时目标宽度也可能被扩展以填满表格。

auto 配合固定表头、固定合计行或虚拟行时，会按表头和当前已渲染内容建立浏览器 auto 参考布局，再将同一组像素宽度同步到显示表格。显示表格使用 fixed 保证对齐，列宽仍由 auto 内容布局决定；未渲染的虚拟记录不会参与测量。

已有 `minWidth` 配置现在会同时影响布局，可能使列更宽或更早出现横向滚动；未配置下限的表格保留原有布局路径。

## 什么时候用

- 运维后台、报表页面或数据看板里字段很多
- 用户希望自己微调列宽，并把宽度持久化
- 你原本只能靠 CSS 或第三方拖拽库去拼列宽调整

## 相关页面

- [固定列](/guide/fixed-columns)
- [功能对比总览](/comparison/)

## Type Declarations

宽度、上下限和拖拽开关属于列配置，`resizeColumn` 的签名由 `VTableEventProps<TRecord>` 声明。列配置为相关字段节选；`ResizableColumnFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#ResizableColumnFields

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::
