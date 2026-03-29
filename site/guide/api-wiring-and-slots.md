# 自定义行与插槽

这部分能力用于把表格接进更复杂的业务界面。除了列配置本身，`VTable` 还支持通过 `rowClassName`、`customRow`、`customHeaderRow`、`customHeaderCell` 以及 `headerCell` / `bodyCell` / `summary` 插槽，把额外标记、样式和结构注入到最终 DOM。

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
    <span v-if="column.key === 'score'">{{ title }} metric</span>
    <template v-else>{{ title }}</template>
  </template>

  <template #bodyCell="{ text, column }">
    <span v-if="column.key === 'status'" class="badge">{{ text }}</span>
    <template v-else>{{ text }}</template>
  </template>

  <template #summary>
    <tr>
      <td colspan="2">summary slot</td>
    </tr>
  </template>
</VTable>
```

## 各入口职责

- `rowClassName(record, index, indent)`：根据行数据返回 class。
- `customRow(record, index)`：向 `<tr>` 注入属性、事件和 style。
- `customHeaderRow(columns, index)`：向表头 `<tr>` 注入属性。
- `customHeaderCell`：向某个表头单元格补属性。
- `headerCell` / `bodyCell`：替换单元格内部内容，但仍复用表格的排序、筛选、对齐与主题系统。
- `summary`：在表体之后补一个摘要区域，适合统计值或说明文本。

## 使用建议

- 结构级扩展优先走 `customRow` / `customHeaderRow`，避免直接查 DOM 二次处理。
- 内容级扩展优先走 `headerCell` / `bodyCell`，这样能保留组件内部行为。
- 如果只是改样式，优先使用 `ui` 和主题覆盖，不要把所有变化都塞进 slot。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 当前测试覆盖：packages/table/src/components/VTable.test.ts

<PlaygroundDemo
  title="自定义 row / header / slot 对照页"
  route="/advanced"
  note="Advanced 页面中的 Case 10 把 rowClassName、customRow、customHeaderRow、headerCell、bodyCell 和 summary 放在同一张表里回归。"
  :height="920"
/>
