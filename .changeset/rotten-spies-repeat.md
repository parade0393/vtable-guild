---
'@vtable-guild/vtable-guild': patch
---

fix(table): 修复虚拟滚动滚不到最后一行

`virtual` 开启后，滚到底时末尾若干行落在可滚动范围之外，看不见也滚不到。行实际高度越是超出估算值，
丢掉的行越多——站点 10 万行示例上缺口达 80 万 px。三个独立缺陷叠加所致：

- **行高测量整个失效**：`useChildren` 把 `renderFunc` 已经返回的 `VNode[]` 又包了一层数组，Vue 的
  `normalizeSlotValue` 会把内层数组归一成 Fragment，`Item` 于是把测量 `ref` 挂到了 Fragment 上，
  而 Vue 给 Fragment 的 ref 值是它的起始文本锚点、不是元素节点。`useHeights` 拿到 Text 直接跳过，
  **没有任何一行被测量过**，可视区计算永远走估算分支，`scrollHeight` 恒等于 `行数 × itemHeight`。
- **`offsetHeight` 取整丢小数**：每行的小数部分在可视窗口内累加（实测 9 行约 1.9px），表现为滚到底
  时最后一行被裁掉一截。改用 `getBoundingClientRect().height`；祖先存在 transform 缩放时仍回退
  `offsetHeight`，避免测量值脱离 `scroll.y` 所在的布局像素坐标系。同时把「量到 0」视作「没量到」，
  防止未布局完或折叠中的瞬时状态把位置表压小。
- **默认行高估算值不匹配主题**：`useVirtual` 兜底用 `'middle'`（47px），而主题
  `defaultVariants.size` 是 `'large'`（55px），且 `size` prop 默认为 `undefined`——即**所有未显式
  传 `size` 的表格**都在按错误行高估算。

不定行高（含换行文本、动态内容）下的滚动范围现在会随实测收敛；定高快路径（`rowHeight`）不受影响。
