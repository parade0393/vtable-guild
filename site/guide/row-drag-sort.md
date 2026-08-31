# 行拖拽排序

给表格开启 `rowDraggable`，行本身即可拖拽（原生 HTML5 拖放，无需引入第三方拖拽库）。
拖拽遵循受控数据流：组件不改动数据，拖放结束时通过 `rowDragEnd` 事件返回排好序的
新数组，由你更新 `dataSource`——数据始终只有一份来源。

## 在线示例

按住任意一行上下拖动，放到目标行上半部分插入其上方、下半部分插入其下方。

<Demo src="row-drag-sort/basic">

<<< @/demos/row-drag-sort/basic.vue

</Demo>

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type RowDragSortInfo, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface TaskRow {
  key: string
  task: string
  owner: string
}

const columns: TableColumnsType<TaskRow> = [
  { title: '任务', dataIndex: 'task', key: 'task' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
]

const dataSource = ref<TaskRow[]>([
  /* ... */
])

function handleRowDragEnd(newData: TaskRow[], info: RowDragSortInfo) {
  dataSource.value = newData
}
</script>

<template>
  <VTable
    row-key="key"
    row-draggable
    :columns="columns"
    :data-source="dataSource"
    @row-drag-end="handleRowDragEnd"
  />
</template>
```

`rowDragEnd` 的参数：

- `newData`：拖拽完成后的全量数据数组（基于当前 `dataSource` 搬移拖拽行得出）。
- `info`：`{ draggedKey, targetKey, orderedKeys }`，分别为拖拽行 key、放置目标行 key、
  以及与 `newData` 对应的全量 key 顺序（树形数据按数据顺序递归包含子节点）。

## 关键行为

- 顺序没有变化时（例如把行拖回原位）**不会**触发 `rowDragEnd`。
- 行级退出：`customRow` 返回 `draggable: false` 的行不参与拖拽——不可拖起、也不会成为
  放置目标，其余行不受影响（适合置顶行、汇总行等固定行）。
- `rowKey` 必须能稳定取到行标识；未配置时会回退为行索引并触发 dev 告警，拖拽结果不可靠。
- 虚拟滚动（`virtual`）下同样可用：拖拽事件挂在每行上，与滚动不冲突。搬移结果按 rowKey 在
  `dataSource` 上计算，不依赖可视窗口下标。注意**没有拖到容器边缘的自动滚动**——目标行尚未
  渲染进窗口时拖不到它，需要先滚动到位再放置。
- 建议在没有激活排序/筛选时使用：显示顺序由 `dataSource → 筛选 → 排序` 管线推导,
  拖拽改写的是数据源顺序，激活的排序会在下次渲染时重新生效。
- 树形数据采用**跨父移动**语义：拖到目标行前 / 后，插入到目标行的**同级位置**——目标是
  根行就回到顶层，目标是某个父的子节点就成为该父的子节点；被拖节点自带整棵子树，
  展开 / 选中状态按 rowKey 记录、重排后保留。带环防护：把节点拖进它自己的子树里
  不会触发事件、不改动数据。
- 展开行内容（`expandedRowRender` 渲染出的 `<tr>`）不可拖拽。
- 拖拽期间行 hover 高亮自动抑制，避免干扰放置指示线。

## 样式定制

拖拽态通过三个 ui slot 与一个 token 定制（两套预设均提供）：

```vue
<template>
  <VTable
    row-draggable
    :columns="columns"
    :data-source="dataSource"
    :ui="{ trDragging: 'opacity-30' }"
  />
</template>
```

- `trDragging`：拖拽中的行（默认半透明）。
- `trDropAbove` / `trDropBelow`：放置目标行上/下边缘的指示线。
- `--vtg-table-row-drop-indicator-color`：指示线颜色。

## 相关页面

- [排序](/guide/sorting)
- [ui Slot 参考](/guide/ui-slots-reference)
- [API 参考](/guide/api-reference)
