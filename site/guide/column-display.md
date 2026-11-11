---
title: 列显示与列顺序
description: 使用 VTableColumnSettings 配置列显隐、固定与顺序，通过 useColumnState 保存用户偏好。
---

# 列显示与列顺序

`VTableColumnSettings` 为表格提供列显隐、固定、拖拽排序和密度切换。面板与表格绑定同一份 `columns` 和 `size`：面板只发出更新，生效状态由你的应用持有。

## 列设置面板

<Demo src="column-display/settings">

<<< @/demos/column-display/settings.vue

</Demo>

`v-model:columns` 接收新的列数组；`v-model:size` 接收 `'large' | 'middle' | 'small'`，未传时跟随表格主题的默认密度。两者都要同时传给表格才会生效。面板可放进表格的 `title` 插槽或外部工具栏；需要标题、导出、刷新和全屏时，使用 [VTableToolbar 工具栏](/guide/toolbar)。

面板只调整顶层列：拖动可在同一固定区域内换序，跨区域使用固定按钮，分组整体移动。顺序直接写回 `columns`，不要再给表格传 [`columnOrder`](#列顺序-columnorder)，否则它会覆盖面板的顺序。“重置”只恢复显隐；要同时恢复顺序和固定，使用 [`useColumnState().reset()`](#保存用户偏好)。

### 列配置

- 为列和分组设置稳定、同级唯一的 `key`，缺省时依次使用 `dataIndex`、位置。没有稳定标识的列重排后，重置可能对应到错误的列。
- 函数式 `title` 不会被面板调用，默认显示 `key` / `dataIndex`；可通过 `#columnLabel="{ column }"` 提供标签。
- `hideInSetting: true` 让列及其子列不出现在面板中，也不参与全选和重置，不影响表格显示。
- `disable: true` 锁定显隐、固定与顺序；对象形式可分别锁定 `checkbox`、`fixed`、`order`。锁定顺序的列是拖拽边界，其他列不能越过它。

::: details 更多行为细节

- 隐藏分组时，子项暂时禁用，子列原有的显隐状态保留；分组中有锁定显隐的子列时，整组不能隐藏。面板允许隐藏全部业务列。
- 固定分组会同步所有叶子列；子列中有禁止固定的列时，整组不能固定。固定后的列会移到对应一端。
- `EXPAND_COLUMN` / `SELECTION_COLUMN` 不出现在面板中，位置保持不变。
- 勾选表示 `visible !== false`；带 `responsive` 的列在当前断点下仍可能不显示。
- 重置的基线是面板首次接收到的显隐，在面板挂载前载入的偏好也会成为基线。动态新增的列以首次出现时为准，已删除的列不会被重新加入。需要重建基线时，改变面板的 Vue `key` 重新挂载。
- 列宽、排序和筛选不受面板操作影响。
- 可用键盘操作按钮与复选框，Escape 关闭并回到入口，Tab 移出面板时关闭。

:::

### 操作没有生效？

| 现象                               | 原因                                              | 处理                                                   |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| 切换密度后，选中项和行高都不变     | 密度是受控的，没有绑定 `size`                     | 面板使用 `v-model:size`，并把同一个值传给表格的 `size` |
| 勾选、固定或拖拽后，面板没有变化   | 没有接收面板发出的 `columns` 更新                 | 面板使用 `v-model:columns`，并把同一份列传给表格       |
| 拖拽后面板顺序变了，表格顺序没有变 | 同时传了 `columnOrder`，它会覆盖 `columns` 的顺序 | 移除 `columnOrder`，把初始顺序写在 `columns` 里        |
| 固定后，滚动时看不出效果           | 表格没有横向滚动                                  | 让 `scroll.x` 大于容器宽度，或缩小容器后再看           |
| 点击“重置”后，顺序和固定没有恢复   | “重置”只恢复显隐                                  | 使用 `useColumnState().reset()`                        |

### 面板 API

`VTableColumnSettings` 的属性、事件和插槽。`TRecord` 表示业务行类型。

#### Props {#column-settings-props}

<!-- @api: reference column-settings-props -->

#### options {#column-settings-options}

<!-- @api: reference column-settings-options -->

#### Events {#column-settings-events}

面板不会触发表格的 `change` 事件。

<!-- @api: reference column-settings-events -->

#### Slots {#column-settings-slots}

<!-- @api: reference column-settings-slots -->

## 保存用户偏好

只在当前页面调整列时，用 `ref` 持有列即可。需要刷新后保留偏好、按用户[保存到服务端](#保存到服务端)，或列定义会随语言、权限变化时，使用 `useColumnState`：它把源列定义和用户偏好合成可写的 `columns`，同时绑定给表格和面板。源定义更新后，已记录的偏好会叠加到新定义上。

<Demo src="column-display/preferences">

<<< @/demos/column-display/preferences.vue

</Demo>

```ts
const { columns, state, setState, reset, restore, save } = useColumnState(baseColumns, {
  storageKey: 'members:columns',
  storageType: 'localStorage',
  version: 1,
})
```

- `baseColumns` 接受数组、ref 或 getter。对 `columns` 的赋值只记录偏好，不回写源定义；renderer、sorter 等始终来自源定义。
- `state` 是只读的生效偏好，按列 `key` / `dataIndex` 生成的路径索引，可原样保存，再通过 `setState` 恢复。不要依赖路径字符串的拼接格式。
- `setState` 替换偏好并忽略非法字段；新增列使用源定义，已删除的列不会被恢复。
- `defaultValue` 是业务给定的默认偏好，`reset` 会恢复到它，因此不要用它载入用户已保存的偏好。
- `reset` 恢复首次记录的显隐、固定、顺序和 `defaultValue`，不恢复列宽、密度、排序和筛选。
- 锁定规则同样约束恢复的偏好，旧存储不能隐藏或移动受保护的列。

### 存储、版本与恢复

- 配置 `storageKey` 后，偏好变化时自动写入存储，并在 `onMounted` 时读取，服务端渲染时不读取。`storageType` 可选 `localStorage` / `sessionStorage`，也可传入实现同步 `getItem / setItem / removeItem` 的 `storage`。未配置 `storageKey` 时不读写任何存储。
- `version` 默认为 `1`，随偏好一起写入。读取时版本不一致，会忽略已保存的偏好，按源定义和 `defaultValue` 显示。
- 源定义增删列不需要升级 `version`：新增列使用源定义，删除的列被忽略。但已保存偏好的用户会看到新增列排在所在固定区域的末尾。希望新列出现在定义的位置，或修改了默认的显隐、固定、顺序并希望所有人看到新默认时，再升级 `version`；升级会丢弃所有用户已保存的偏好。
- `restore` 从存储重新读取偏好，挂载时已自动调用一次；没有存储或版本不一致时保持当前偏好。其他标签页修改了同一份偏好时，可在 `window` 的 `storage` 事件中调用它同步。
- `save` 把当前偏好写入存储。偏好变化和 `reset` 都会自动保存，通常不需要手动调用；升级 `version` 后，旧数据要等到用户下次修改偏好才会被覆盖，想立即覆盖时可调用一次。
- 存储不可用或 JSON 错误通过 `onError(error)` 报告，不影响渲染。

### 保存到服务端

`storage` 适配器是同步接口，不适合异步请求。保存到服务端时不配置 `storageKey`，用 `setState` 载入、监听 `state` 保存，版本由业务自行携带：

```ts
const COLUMN_VERSION = 1
const { columns, state, setState, reset } = useColumnState(baseColumns)

let stop: (() => void) | undefined
onMounted(async () => {
  try {
    const saved = await api.getColumnPreference('system-user')
    if (saved?.version === COLUMN_VERSION) setState(saved.state)
  } finally {
    // 载入后再开始监听，避免把刚读到的偏好原样写回
    stop = watch(
      state,
      debounce((value) => {
        api.saveColumnPreference('system-user', { version: COLUMN_VERSION, state: value })
      }, 500),
      { deep: true },
    )
  }
})
onUnmounted(() => stop?.())
```

偏好载入前表格按源定义显示；不希望出现切换时，可在载入完成后再渲染表格。面板的“重置”和 `reset()` 都会改变 `state`，同样会被保存。

### 由业务自行保存

不使用 `useColumnState` 时，只保存列 key、显隐和密度等可序列化的值，不要序列化整个列配置，否则函数式 renderer、sorter 会丢失。读取时先校验结构、列 key 和密度值，再合并回列定义；分组、固定、顺序和版本需要自行处理。

::: details 平铺列的显隐保存示例

```ts
watch([columns, size], ([currentColumns, currentSize]) => {
  const visibility = currentColumns.flatMap((column) =>
    typeof column !== 'symbol' && column.key !== undefined
      ? [{ key: column.key, visible: column.visible !== false }]
      : [],
  )
  try {
    localStorage.setItem('members-table:v1', JSON.stringify({ size: currentSize, visibility }))
  } catch {
    // 存储不可用时仍允许正常使用表格。
  }
})
```

:::

## 不使用面板时

面板基于两个表格属性：列级 `visible` 控制是否显示，表级 `columnOrder` 控制显示顺序。也可以直接使用它们自行实现列管理，下面用勾选框切换显隐，用 ‹ › 按钮调整顺序：

<Demo src="column-display/basic">

<<< @/demos/column-display/basic.vue

</Demo>

### 列显示 visible

在列上设置 `visible: false`，该列从表头和表体中移除。它是受控属性：需要恢复显示时把 `visible` 改回来，或删掉这个字段。

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180 },
  // 用户在「列设置」里取消勾选了这一列
  { title: '年龄', dataIndex: 'age', key: 'age', width: 96, visible: false },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
]
```

- 隐藏只作用于显示层。列上已激活的排序 / 筛选状态**不会**被丢弃：隐藏一个正在排序的列，行序仍受它影响；重新显示后排序依旧生效。
- 分组列 `visible: false` 时整组隐藏；组内子列全部被隐藏时，整个空组也会被移除。
- 可以与 `responsive` 组合：两者任一不满足，列都不显示。

### 列顺序 columnOrder

`columnOrder` 的类型是 `Key[]`，其中 `Key = string | number`。与列设置面板一起使用时不要传它。

```vue
<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :column-order="['status', 'name']"
  />
</template>
```

上面的配置下，列的渲染顺序为 `status → name → age`（若 `columns` 里还有未提到的列）：

- 在 `columnOrder` 中出现的列按数组顺序排前；同一 key 重复出现时取首次位置。
- 未出现的列（含无 key 列）保持原相对顺序，排在已匹配列之后。
- 选择列 / 展开列不参与顺序匹配，固定在行首。
- 只重排顶层列：分组列整组移动，不支持把子列移出分组。

## 已知边界

- 重排可能破坏「左固定列连成前缀、右固定列连成后缀」的结构。非虚拟模式下 sticky 固定列
  仍正常工作，但穿插排列时固定列阴影可能出现异常；开启 `virtualColumn` 横向虚拟化时,
  不满足结构会有 dev 告警并回落为渲染全部列。
- 列宽拖拽的宽度覆写按列 key 记录，重排后自动保留。

## API

`TRecord` 表示业务行类型。表格的完整配置见 [API Reference](/guide/api-reference)。

### Props

<!-- @api: props column-display -->

### Column 字段

<!-- @api: columns column-display -->

## 主题

列设置面板可通过 `VTableColumnSettings` 的实例 `ui` 或全局 `theme.columnSettings.slots` 覆盖 class。调整颜色或尺寸时可使用下方 [CSS 变量](#css-变量)。覆盖顺序见[三层主题覆盖](/guide/theme-overrides)。

### ui slots

<!-- @api: ui column-display -->

### 预设默认值

两套预设的默认 class 可用下方标签切换。默认预编译模式下 utility 的覆盖方式见[前缀与覆盖规则](/guide/theme-overrides#utility-前缀与覆盖规则)。

<!-- @api: theme column-display -->

### CSS 变量

表中列出亮色模式的默认值。暗色模式可通过 `.dark` 单独覆盖。

<!-- @api: css-vars column-display -->

## Type Declarations

`visible` 和 `responsive` 属于列配置，`columnOrder` 属于表格配置。props / 列配置为相关字段节选；`DisplayColumnFields` 和 `ColumnOrderFields` 是文档辅助接口，不是包导出，完整声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSize

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsProps

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSlots

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#Breakpoint

<<< @/.vitepress/type-declarations/features.ts#DisplayColumnFields

<<< @/.vitepress/type-declarations/features.ts#ColumnOrderFields

:::

## 相关页面

- [列宽拖拽](/guide/column-resize)
- [固定列](/guide/fixed-columns)
- [API 参考](/guide/api-reference)
