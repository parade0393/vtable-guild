---
'@vtable-guild/vtable-guild': minor
---

- 工具栏全屏只需 `options.fullScreen`：`VTableToolbar` 位于 `VTable` 的 `title` / `footer` 插槽内时默认以表格根元素为全屏目标，`fullscreenTarget` 仍可指定其他元素并优先生效。表格根元素全屏时自带背景与滚动。
- 浏览器全屏时，筛选菜单、选择菜单、页大小菜单、列设置面板与 Tooltip 默认挂载到全屏元素内，不再被全屏层遮住；显式的 `getPopupContainer` 不受影响。
- Tooltip 在首选方向空间不足、对侧放得下时自动翻转。
- 工具栏搜索草稿改为可选受控：不绑定 `v-model:search-value` 时由组件持有草稿，`search` 事件始终带上提交的关键词。
- 行为变化：点击搜索清空图标在 `clearSearch` 之后额外触发 `search('')`。同时在两个事件里发起请求的业务，保留 `search` 中的处理即可。
