# 分页

通过 `:pagination="{}"` 启用。默认关闭，不传或传 `false` 时继续展示全量数据。配置参考 ant-design-vue 4.2.6，`change` 保留本库的三参数签名。

## 本地分页

组件先筛选、排序，再按根记录分页，最后展开树节点。子节点和展开内容不占额外分页名额。请配置稳定的 `rowKey`，以保持跨页选择和展开状态。

示例同时开启行选择：表头复选框选择当页，“全选所有”菜单选择筛选后全部已加载的可选记录。翻页后可通过已选数量和复选框状态检查选择范围。

<Demo src="pagination/basic">

<<< @/demos/pagination/basic.vue

</Demo>

## 受控分页

`current`、`pageSize` 分别可控。未传时使用内部状态，`defaultCurrent` 和 `defaultPageSize` 只初始化一次。父组件需要在回调中接受新状态；组件不会修改配置对象。上下分页器共享同一状态。

<Demo src="pagination/controlled">

<<< @/demos/pagination/controlled.vue

</Demo>

## 远程分页

传入当前页记录和完整 `total`。当处理后记录数小于 `total` 且不超过 `pageSize` 时，不再切片。记录数大于 `pageSize` 却小于 `total` 时，会告警并按本地方式切片。未提供正整数 `total` 时，回退到筛选、排序后的根记录数。

请求由业务代码管理；加载时保留总数，使用请求序号或 AbortController 防止旧响应覆盖新页。服务端排序使用 `sorter: true`，服务端筛选不配置本地 `onFilter`，并在 `change` 中处理相应 action。

下面的示例启用 `preserveSelectedRowKeys`，展示跨页已选数量和记录名称。可先选中一条记录，翻页继续选择，再返回原页检查勾选状态。“全选所有”仅作用于已加载数据，不会请求其他页。

<Demo src="pagination/remote">

<<< @/demos/pagination/remote.vue

</Demo>

## 配置参考

| 配置                                         | 类型 / 默认值                                     | 说明                                                              |
| -------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `current` / `defaultCurrent`                 | `number` / `1`                                    | 受控页码 / 初始页码                                               |
| `pageSize` / `defaultPageSize`               | `number` / `10`                                   | 受控页大小 / 初始页大小                                           |
| `total`                                      | `number`                                          | 正整数时指定总数，否则使用处理后根记录数                          |
| `disabled`                                   | `boolean` / `false`                               | 禁用分页交互，仍进行数据切片                                      |
| `hideOnSinglePage`                           | `boolean` / `false`                               | 单页时隐藏控件；总数为 0 时不显示分页器                           |
| `showSizeChanger`                            | `boolean`                                         | 默认总数大于 50 时显示                                            |
| `totalBoundaryShowSizeChanger`               | `number` / `50`                                   | 自动显示页大小切换器的阈值                                        |
| `pageSizeOptions`                            | `(string \| number)[]` / `['10','20','50','100']` | 页大小选项；当前值不在其中时仍显示当前值                          |
| `buildOptionText`                            | `({ value }) => VNodeChild`                       | 自定义页大小选项                                                  |
| `showQuickJumper`                            | `boolean \| { goButton?: VNodeChild }`            | Enter 或失焦提交；提供 Go 按钮时失焦不提交                        |
| `showTotal`                                  | `(total, [start, end]) => VNodeChild`             | 范围从 1 开始；空数据范围为 `[0, 0]`                              |
| `size`                                       | `'default' \| 'small'`                            | 未传时跟随表格尺寸                                                |
| `simple` / `showLessItems`                   | `boolean` / `false`                               | 简洁输入模式 / 缩小页码窗口                                       |
| `responsive`                                 | `boolean` / `false`                               | 未指定尺寸时，小于 576px 使用紧凑尺寸                             |
| `itemRender`                                 | `({ page, type, originalElement }) => VNodeChild` | type 为 `page / prev / next / jump-prev / jump-next`              |
| `position`                                   | `TablePaginationPosition[]` / `['bottomRight']`   | 顶部或底部的 Left / Center / Right；`['none']` 隐藏控件但保留分页 |
| `locale`                                     | `Partial<VTableGuildPaginationLocale>`            | 分页文案覆盖                                                      |
| `class` / `style`                            | `string` / `CSSProperties`                        | 分页区域样式                                                      |
| `onChange`                                   | `(current, pageSize) => void`                     | 翻页、页大小改变、筛选重置时调用                                  |
| `onShowSizeChange`                           | `(current, pageSize) => void`                     | 页大小改变时调用                                                  |
| `'onUpdate:current'` / `'onUpdate:pageSize'` | `(value: number) => void`                         | 受控字段更新通知                                                  |

位置支持 `topLeft`、`topCenter`、`topRight`、`bottomLeft`、`bottomCenter`、`bottomRight` 和 `none`。每个区域最多一个分页器，使用数组中首个匹配项。

## 高级配置与主题

<Demo src="pagination/advanced">

<<< @/demos/pagination/advanced.vue

</Demo>

使用 `theme.pagination.slots` / `variants` 和 `--vtg-pagination-*` tokens 定制，两套预设均支持。全局语言包可包含可选的 `pagination` 分组，也可以使用 `localeOverrides.pagination`；实例 `pagination.locale` 最后覆盖。旧语言包无需新增字段。

### Element Plus 预设

分页配置与事件继续使用上述 Ant 风格 API，两套预设的默认显隐规则和页大小选项一致。切换到 `element-plus` 后，分页视觉与交互跟随 Element Plus：

- 页码相邻无间隙，当前页加粗且无边框；总数、页大小选择、页码和跳页依次排列。
- 默认使用原生 7 页窗口，`showLessItems: true` 对应 5 页窗口；省略号分别前后跳 5 / 3 页。
- 快捷跳页输入显示当前页，Enter 或失焦提交并恢复有效页码，小数取整数部分；配置 Go 按钮时仍由按钮或 Enter 提交。
- 中文跳页文案为“前往”，英文不显示输入后的 `Page`；实例语言覆盖继续生效。
- 默认分页按钮为 32px，`size: 'small'` 为 24px / 12px 字号；未指定分页尺寸时，表格 `small` 对应紧凑分页，`middle` / `large` 对应默认分页。

`simple`、Go 按钮、`itemRender` 等统一扩展仍可使用，不要求 Element Plus 用户改写为 `layout` / `currentPage` / `pageSizes`。

不支持 Ant 内部的 `selectComponentClass`、`selectPrefixCls` 和 `prefixCls`；使用本项目的主题、`classPrefix` 与表级 `getPopupContainer`。首版不导出独立 Pagination 组件。

## 事件与其他功能

```ts
function handleChange(filters, sorter, extra) {
  if (extra.action === 'paginate' && extra.pagination) {
    const { current, pageSize, total } = extra.pagination
  }
}
```

- `change(filters, sorter, extra)` 参数顺序不变。开启分页时所有 action 附带 `extra.pagination`；未开启时不添加字段。新增 `'paginate'`，穷尽检查需补此分支。
- 翻页及修改页大小各触发一次表格事件；筛选回到第 1 页，仅触发 `'filter'`。排序保留页码；页大小变化保留页码，必要时收敛到末页。
- 排序、筛选、分页的 `currentDataSource` 是分页前处理后的数据；远程场景仅包含已加载记录。`select` 保留现有展示数据语义。
- 数据缩短时有效页码收敛到末页，外部属性更新不反向触发事件。远程总数缩短后如需重新请求，由业务代码负责。
- 表头全选、反选和 Shift 连选限定当前页；“全选所有”菜单选择全部已加载记录。远程跨页选择使用 `preserveSelectedRowKeys`，不会请求未加载页。
- `title` / `footer` 接收当前页展示数据。拖拽仅发生在当前页，但返回完整输入 `dataSource`。
- 分页器不随表体横向滚动。`scroll.y: 'auto'` 自动为上下分页器留出空间，兼容虚拟滚动。
- 开启分页后，分页／筛选／排序默认滚回表体顶部，保留横向位置。通过 `scroll.scrollToFirstRowOnChange: false` 关闭；未开启分页时默认保持既有滚动行为。

从 Ant 迁移时，把原四参数回调的第一个参数改为从 `extra.pagination` 读取；显式传入分页对象以启用功能。
