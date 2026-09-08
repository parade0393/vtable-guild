---
'@vtable-guild/vtable-guild': minor
---

VTable 新增列显示、列顺序与行拖拽排序三项能力:

- `ColumnType.visible`:受控控制列是否显示,隐藏只作用于显示层,列上的排序/筛选状态不会丢失;分组列整组隐藏,子列全部隐藏时空组自动移除
- `TableProps.columnOrder`:按列 key 数组重排顶层列,未匹配的列保持原相对顺序,选择列/展开列固定行首
- `TableProps.rowDraggable` + `rowDragEnd` 事件:原生 HTML5 整行拖拽,拖放结束返回重排后的 dataSource 与 `{ draggedKey, targetKey, orderedKeys }`(受控模式,虚拟滚动下可用;orderedKeys 树形数据按数据顺序递归含子节点;customRow 返回 draggable: false 的行退出拖拽)。树形数据采用跨父移动语义:拖到目标行前/后即插入目标行的同级位置,节点自带子树,带环防护
- 新增 ui slot `trDragging` / `trDropAbove` / `trDropBelow` 与 CSS token `--vtg-table-row-drop-indicator-color`(两套预设同步)
