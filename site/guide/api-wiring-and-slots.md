# 自定义行与插槽

这部分能力用于把表格接进更复杂的业务界面。

当默认列渲染已经不够，但你又不想放弃排序、筛选、对齐和主题系统时，customRow、customHeaderRow、headerCell、bodyCell 和 summary 这些入口会更合适。

## 在线示例

`headerCell` 改表头文案、`bodyCell` 把状态换成徽标、`customRow` 给整行挂点击事件。

<Demo src="api-wiring-and-slots/basic">

<<< @/demos/api-wiring-and-slots/basic.vue

</Demo>

## 常见入口

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :row-class-name="rowClassName"
  :custom-row="customRow"
  :custom-header-row="customHeaderRow"
>
  <template #headerCell="{ title, column }">
    <span v-if="column.key === 'score'">{{ title }} 指标</span>
    <template v-else>{{ title }}</template>
  </template>

  <template #bodyCell="{ text, column }">
    <span v-if="column.key === 'status'" class="badge">{{ text }}</span>
    <template v-else>{{ text }}</template>
  </template>

  <template #summary>
    <tr>
      <td colspan="2">汇总信息</td>
    </tr>
  </template>
</VTable>
```

## 每个入口适合做什么

- rowClassName，根据行数据返回 class。
- customRow，给某一行注入属性、事件和 style。
- customHeaderRow，给表头行注入属性。
- customHeaderCell，给表头单元格补充属性。
- headerCell / bodyCell，替换单元格内部内容，同时保留表格内部交互能力。
- summary，在表体后追加摘要区域。
- paginationItem，在分页布局指定的位置显示选择数量、刷新按钮等业务内容。

## 分页行中的业务内容

用 `pagination.layout` 安排 `{ slot: '名称' }`，再通过 `#paginationItem` 的 `name` 区分内容。选择状态继续由父组件维护：

```vue
<VTable
  :columns="columns"
  :data-source="dataSource"
  :row-selection="rowSelection"
  :pagination="{
    layout: {
      left: [{ slot: 'selection' }],
      right: ['prev', 'pager', 'next'],
    },
  }"
>
  <template #paginationItem="{ name }">
    <span v-if="name === 'selection'">已选 {{ selectedRowKeys.length }} 条</span>
  </template>
</VTable>
```

插槽同时接收 `current`、`pageSize`、`total`、`pageCount`、`range`、`disabled`、`position` 和 `region`，类型为 `TablePaginationSlotProps`。业务按钮自行绑定禁用状态并调用加载函数。分页隐藏时扩展内容也隐藏；需要在空数据时保留的操作放在 `title`、`footer` 或外部工具栏。完整示例见[分页布局与内容插槽](/guide/pagination#可组合布局与内容插槽)。

## 什么时候该用 ui，什么时候该用 slot

- 只是改样式，优先用 ui 和主题覆盖。
- 需要改内容结构或注入业务事件，再使用插槽和 customRow。
- 需要按记录动态附加属性时，优先用 customRow，而不是操作 DOM。

## 使用建议

- 结构级扩展尽量通过组件提供的入口完成，不要在 mounted 后再手动查 DOM 改写。
- bodyCell 更适合做状态标签、图标、补充文案等内容级增强。
- 单元格或整行编辑也通过 bodyCell 组合；草稿、校验和提交由业务管理，完整示例见[编辑](/guide/editing)。
- 如果同一类样式会反复出现，优先沉淀到主题和 ui，而不是在每张表里重复写 slot 模板。

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [标题、页脚与摘要行](/guide/title-footer-summary)
- [编辑](/guide/editing)
- [分页](/guide/pagination)
