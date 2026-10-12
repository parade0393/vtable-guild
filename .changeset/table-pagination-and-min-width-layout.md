---
'@vtable-guild/vtable-guild': minor
---

新增 opt-in 分页 `pagination`，叶子列 `minWidth` 同时成为布局下限。

**分页 `pagination`（默认关闭）**

`:pagination="{}"` 开启，不传或传 `false` 时行为不变。按「筛选 → 排序 → 按根记录分页 → 展开树」切分数据，
子节点不占名额；`total` 缺省时取筛选排序后的根记录数，远程场景传当前页数据与完整 `total`。配置参考
ant-design-vue 4.2.6，两套预设均可用。

- **事件**：`change(filters, sorter, extra)` 三参数签名不变，开启后所有 action 附带 `extra.pagination`，
  `extra.action` 新增 `'paginate'`（穷尽检查需补此分支）
- **`layout` + `#paginationItem`**：`layout` 用有序数组或 `{ left, right }` 排列 `total` / `sizes` /
  `prev` / `pager` / `next` / `jumper`，`{ slot: '名称' }` 处渲染业务内容
- **主题**：`paginationTheme` / `elementPlusPaginationTheme` + `--vtg-pagination-*` tokens 与中英文语言包
- 其余配置（受控 `current` / `pageSize`、`pagerCount`、`simple`、`showSizeChanger`、`showQuickJumper`、
  `itemRender` 等）见[分页](/guide/pagination)；开启后排序 / 筛选 / 分页默认滚回表体顶部，可用
  `scroll.scrollToFirstRowOnChange: false` 关闭；表头全选限定当前页，跨页选择用
  `preserveSelectedRowKeys: true`

**`minWidth` 成为布局下限（行为变更）**

显式 `minWidth` 现在同时约束布局与拖拽，fixed / auto 布局、固定表头、固定列与虚拟表共用同一组宽度；
下限之和超过容器时产生横向滚动。已有 `minWidth` 配置可能使列更宽或更早横向溢出，`width` / `maxWidth`
小于 `minWidth` 时不再覆盖下限。未配置或非法值不新增布局约束，拖拽仍保留 50px 兜底。

**修复**

- 选择列下拉菜单点击触发器不再被立即关闭
- 分页页大小弹层遵循裁剪祖先的纵向边界
- 补全 `compatClass` 在虚拟滚动表体与分页上的输出，新增 `antdvPaginationCompatClasses`
