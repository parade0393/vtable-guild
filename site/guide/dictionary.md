---
title: 远程字典与选项复用
description: 共享远程枚举、选项搜索和依赖参数，区分完整筛选集合与局部候选项。
---

# 远程字典与选项复用

`createTableDictionary` 创建显式共享的字典实例，`useTableDictionary` 将它接到 Vue 状态。
一份结果可用于单元格 `valueEnum`、表头 `filters` 和项目已有的 Select 控件。
字典请求独立于 `useTableRequest` 的行数据请求，不会为每个单元格创建请求或监听。

<Demo src="dictionary/basic">

<<< @/demos/dictionary/basic.vue

</Demo>

## 定义与接入

```ts
const dictionary = createTableDictionary<{ region: string }>({
  key: 'owners',
  request: async (params, { keyword, signal }) => {
    const response = await fetch(
      `/api/owners?region=${encodeURIComponent(params.region ?? '')}&q=${encodeURIComponent(keyword)}`,
      { signal },
    )
    if (!response.ok) throw new Error('负责人加载失败')
    // 返回 { options: [{ value: 1, label: '陈嘉' }], complete: false }
    return response.json()
  },
})
const owners = useTableDictionary({
  dictionary,
  params: () => ({ region: region.value }),
  selectedOptions: () => selectedOwners.value,
  debounceTime: 200,
})
// 在 computed columns 中读取；可直接把 options 接到 a-select / el-select。
const columns = computed(() => [
  {
    dataIndex: 'ownerId',
    valueEnum: owners.valueEnum.value,
    filters: owners.filters.value,
  },
])
```

`options` 的元素是 `{ value, label, status?, disabled? }`；label 为字符串，value 支持字符串、有限数字、布尔值。
通过 Map 提供的 `valueEnum` 保留 `1`、`'1'`、`false` 的区别；未知值继续使用表格原值回退。
自定义复杂标签由宿主控件插槽或单元格 renderer 处理。

## 完整字典与搜索结果

请求必须返回 `complete`。只有 `complete: true` 且关键词为空的成功结果才会生成 `filters`；其他情况下为 `[]`。
**不要对远程搜索结果使用 `filters: true`**：已知的标签不代表完整的筛选集合。
需要同时展示完整表头筛选与远程搜索时，像示例一样用两个 composable，共享同一个 dictionary。

`options` 是本次请求的候选项，不会混入已选项；`valueEnum` 保留当前依赖参数下已知标签，
并合并 `selectedOptions`，完整结果会替换先前搜索积累的标签。当前已加载标签优先于外部提供的旧标签。
宿主 Select 若需要已选项出现在选项数组中，由业务将当前选中项与 `options` 合并。

`params` 变化会取消当前订阅、清空关键词/旧候选项/已知标签，然后重新加载；
它不会修改业务的选择值。级联场景可在业务中显式清空下级选择；希望保留旧选择显示时传入 `selectedOptions`。

## 共享、缓存与取消

- 同一个 dictionary 实例按依赖参数和关键词合并进行中的请求，成功结果默认缓存 5 分钟，最多保留 50 个条目。
- `key` 是稳定的业务标识；同名的两个独立实例仍隔离。共享依赖显式传递实例，不使用进程级全局注册表；SSR 中在每次请求的 setup/provider 内创建实例。
- 每个订阅有独立 signal；一个控件取消或卸载不会取消其他订阅，最后一个订阅离开才中止底层请求。旧响应即使忽略 signal 也不会写入新状态。
- `reload()` 立即跳过已完成缓存，但仍复用相同的进行中请求；错误不会缓存。`dictionary.invalidate()` 忘记所有缓存，不主动刷新控件；已有订阅可完成，其结果不会重新进入缓存。
- 刷新更新当前 composable 的状态；其他已完成的订阅不会被广播改写，需要刷新时对相关订阅调用 `reload()`，同一时刻的请求会合并。

## API

宿主 Select 的值类型以其自身协议为准。例如 Ant Design Vue Select 不接受布尔 value；布尔字典接入时，业务应使用可逆的控件值映射，提交时恢复原始类型。不要将 `false` 与 `'false'`、`1` 与 `'1'` 合并成同一个字典 key。

### createTableDictionary 选项

`createTableDictionary(options)` 创建一个字典实例。

<!-- @api: reference dictionary-create-options -->

### 字典实例

<!-- @api: reference dictionary-instance -->

### useTableDictionary 选项

<!-- @api: reference dictionary-use-options -->

### useTableDictionary 返回值

<!-- @api: reference dictionary-return -->

### TableDictionaryOption

`options` 和 `selectedOptions` 的元素。

<!-- @api: reference dictionary-option -->

composable 的 search/reload 在成功时返回 true，失败、取消或卸载时返回 false；失败同时更新 error 并调用 onError。onError 自身抛错时将该异常存入 error，返回的 Promise 仍正常结束。
`manualRequest` 只跳过首次请求，后续依赖参数变化仍加载。请在 setup 或 effectScope 中创建以便自动清理。

公开类型包括 `TableDictionaryOption`、`TableDictionaryResult`、`TableDictionaryContext`、`TableDictionaryRequest`、
`CreateTableDictionaryOptions`、`TableDictionary`、`UseTableDictionaryOptions`、`UseTableDictionaryReturn`。

### VTable Column 字段

<!-- @api: columns dictionary -->

## 主题

字典提供选项和标签数据。字典标签在表格中以枚举状态展示时，使用下列 table slots 和 CSS 变量；查询区和编辑控件的外观由对应组件决定。

### ui slots

<!-- @api: ui dictionary -->

### 预设默认值

<!-- @api: theme dictionary -->

### CSS 变量

<!-- @api: css-vars dictionary -->

## Type Declarations

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#DictionaryProtocol

:::
