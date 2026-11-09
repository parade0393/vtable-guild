# 筛选

筛选能力由列上的 filters、onFilter、filteredValue、defaultFilteredValue 以及筛选面板配置共同组成。

对使用者来说，最重要的是先区分两种模式：一类是组件内部维护状态，另一类是页面外部完全受控。

## 在线示例

多选筛选、单选筛选（`filterMultiple: false`）、带搜索框的筛选（`filterSearch`）和默认筛选值同时出现在一张表里。

<Demo src="filtering/basic">

<<< @/demos/filtering/basic.vue

</Demo>

## 基础示例

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  status: 'active' | 'paused'
}

const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada', status: 'active' },
  { key: '2', name: 'Grace', status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## 受控与非受控

- defaultFilteredValue 只在首次渲染时生效，适合简单默认筛选。
- filteredValue 表示当前列进入受控模式，筛选状态完全由外部管理。
- filterResetToDefaultFilteredValue 用于控制“重置”后是否回到默认值，而不是直接清空。

## 筛选组合规则

- 同一列里选中多个值时，是 OR 关系。
- 不同列之间是 AND 关系。
- change 事件会返回当前所有列的 filters 快照，适合做查询条件同步。
- 树形数据上只对顶层记录求值：`onFilter` 不递归 `children`，父节点命中会带上全部子节点，父节点不命中则整棵子树被移除，详见[树形表格](/guide/tree-table#已知限制)。

单独声明事件处理函数时，可以从公开的事件接口取得签名，参数会自动获得类型：

```ts
import { ref } from 'vue'
import type { TableFiltersInfo, VTableEventProps } from '@vtable-guild/vtable-guild'

// 沿用上面的 UserRow；给表格绑定 @change="handleChange"。
const activeFilters = ref<TableFiltersInfo>({})
const handleChange: NonNullable<VTableEventProps<UserRow>['onChange']> = (filters) => {
  activeFilters.value = filters
}
```

`filters` 是以列 key 为键的 `TableFiltersInfo`；每个值是 `(string | number | boolean)[] | null`，`null` 表示该列没有筛选值。`onFilter` 的第一个参数则是单个 `string | number | boolean` 值，第二个参数保留 `UserRow` 类型。

## 自定义筛选面板

如果默认筛选面板不够用，可以选择两种扩展方式：

- customFilterDropdown，走表级插槽统一接管。
- filterDropdown，在单列上直接定义自定义面板。

除此之外，你还可以使用：

- filterSearch，为筛选项增加搜索能力。
- filterMode: 'tree'，把筛选项渲染成树形结构。

自定义面板的参数使用 `CustomFilterDropdownSlotProps<UserRow>`：`setSelectedKeys` 接收筛选值数组，`confirm` 和 `clearFilters` 的可选参数分别控制确认与关闭行为。完整签名见页末声明。

### 面板里的下拉与日期选择

ant-design-vue / antdv-next 的 `a-select`、`a-date-picker`，以及 Element Plus 的 `el-select`、`el-date-picker`，默认把自己的下拉挂到 `document.body`。表格会把这些下拉里的点击当作面板外部点击，选中选项的同时筛选面板也会关闭。把嵌套弹层渲染到面板内部即可：ant-design-vue / antdv-next 设置 `getPopupContainer`，Element Plus 设置 `:teleported="false"`。

```vue
<script setup lang="ts">
// 沿用上面的 UserRow 与 dataSource，status 列改为 customFilterDropdown: true。
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]
// 下拉挂到触发器的父元素，也就是筛选面板内部。
const insidePanel = (trigger: HTMLElement) => trigger.parentElement ?? document.body
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource">
    <template #customFilterDropdown="{ selectedKeys, setSelectedKeys, confirm, clearFilters }">
      <!-- 嵌套下拉在面板内展开，min-height 为它预留空间 -->
      <div style="padding: 8px; width: 200px; min-height: 160px">
        <!-- Element Plus：<el-select :teleported="false" ...> -->
        <a-select
          :value="selectedKeys[0]"
          :options="statusOptions"
          :get-popup-container="insidePanel"
          style="width: 100%"
          @update:value="(value) => setSelectedKeys(value == null ? [] : [String(value)])"
        />
        <a-button size="small" @click="clearFilters()">重置</a-button>
        <a-button size="small" type="primary" @click="confirm()">确定</a-button>
      </div>
    </template>
  </VTable>
</template>
```

嵌套下拉随后在面板内定位，超出面板的部分会被面板的滚动区域裁剪，所以示例给面板内容设置了 `min-height`。请按选项数量调整高度，或减小下拉高度（如 `a-select` 的 `list-height`）。

### 外部点击的判定

筛选面板、行选择菜单、列设置与密度菜单、每页条数下拉共用同一套弹层逻辑。自 2.9.0-alpha.5 起，弹层在 `document` 的捕获阶段监听 `mousedown` / `touchstart` 来判断外部点击；外部控件里的 `stopPropagation()`（如 `@mousedown.stop`）发生在判定之后，拦不住它，打开的弹层照样关闭。更早的版本在冒泡阶段监听，阻止冒泡可以让弹层保持打开，升级时请留意这类写法。需要和面板配合操作的控件请放进面板内部；筛选面板也可以改用受控的 `filterDropdownOpen`：外部点击只会触发 `onFilterDropdownOpenChange(false)`，是否关闭由你决定。

## 什么时候用受控模式

以下场景建议直接用 filteredValue：

- 筛选条件需要同步到 URL。
- 页面查询由接口驱动，表格只负责展示当前结果。
- 多个筛选控件之间需要互相联动。

## 清空与受控状态

`filteredValue: undefined` 使用内部非受控状态；`null` 和 `[]` 都表示受控且无筛选值。受控时确认、重置或清空会通过 `change` 的 `filters` 参数提交本次请求的筛选值。父组件更新 `filteredValue` 后，表格才按新值筛选数据。

`filterResetToDefaultFilteredValue: true` 让重置恢复 `defaultFilteredValue`，否则清空。自定义面板调用 `clearFilters()` 时提交一次重置结果，并请求关闭面板。要仅重置草稿并保留面板，传入 `clearFilters({ confirm: false, closeDropdown: false })`。`confirm({ closeDropdown: false })` 可提交并保留面板。

列 `filters: true` 可从 valueEnum 生成筛选项；`onFilter: false` 或表格 `manual.filter` 可跳过本地计算，保留筛选 UI 和事件。完整示例见[单元格展示](./cell-display.md)。

## API

`TRecord` 表示业务行类型。下表只列与筛选相关的配置，全部 props 见 [API Reference](/guide/api-reference)。

### Props

<!-- @api: props filtering -->

### Column 字段

<!-- @api: columns filtering -->

### Events

<!-- @api: events filtering -->

筛选触发时 `extra.action` 为 `'filter'`，`filters` 是以列 key 为键的全部列筛选快照。

### Slots

<!-- @api: slots filtering -->

列级 `filterDropdown` 和 `filterIcon` 优先于表级 slot。

## 主题

只改颜色和尺寸时优先覆盖 [CSS 变量](#css-变量)；要改 class 时，用实例 `ui` 或全局 `theme.table.slots`。三种方式怎么选见[三层主题覆盖](/guide/theme-overrides)。

### ui slots

<!-- @api: ui filtering -->

### 预设默认值

两套预设在上述 slot 上的默认 class，按 `createVTableGuild({ theme })` 的结构给出，复制后修改即可；覆盖值会通过 `cn()` 与默认值合并。默认预编译模式下这些 utility 在运行时带 `vtg-` 前缀，覆盖规则见 [utility 前缀与覆盖规则](/guide/theme-overrides#utility-前缀与覆盖规则)。

<!-- @api: theme filtering -->

### CSS 变量

表中为亮色模式下的默认值，暗色模式在 `.dark` 下另行覆盖。弹层变量由筛选面板与批量选择菜单等表格弹层共用。

<!-- @api: css-vars filtering -->

## Type Declarations

筛选值支持 `string | number | boolean`。以下声明包含列配置、自定义面板与表格事件。列配置为相关字段节选；`FilteringColumnFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#ColumnFilterItem

<<< @/.vitepress/type-declarations/features.ts#FilteringColumnFields

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::

## 相关页面

- [排序](/guide/sorting)
- [API Reference](/guide/api-reference)
- [类型参考](/guide/type-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
