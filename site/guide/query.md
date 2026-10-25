# 查询提交与重置

`useTableQuery` 为已有表单提供草稿、提交快照、字段转换与展开收起状态。输入框、日期范围和布局继续使用项目已经集成的 Ant Design Vue 或 Element Plus；组合式函数不会从 columns 自动生成表单。

查询交互对齐 [Ant Design ProTable 搜索表单](https://github.com/ant-design/pro-components/blob/master/site/components/table.md)：输入变化不会自行查询，每次点击搜索或重置均发起请求；字段转换对应 `search.transform`，整体请求转换继续使用 `useTableRequest.beforeSearchSubmit`，展开状态对应 `collapsed / onCollapse`。这里将表单状态拆成 Vue 组合式函数，控件和表单校验交给宿主 UI 库。

下例为避免文档站额外依赖整套 UI 库，使用原生输入框。实际项目可将 `input` 替换成 `a-input` / `el-input`、将范围字段替换成宿主 DatePicker；绑定相同的 `draft` 和提交方法即可，两套预设不需要不同的数据协议。

<Demo src="query/basic">

<<< @/demos/query/basic.vue

</Demo>

## 草稿与已提交参数

将控件绑定到 `draft`。编辑草稿、切换 `collapsed`、调用 `resetFields()` 都不会发请求。只有 `submit()` / `reset()` 调用回调，且每次只调用一个回调。

```ts
const table = useTableRequest<Row, Params>({
  request,
  manualRequest: true,
})
const query = useTableQuery<FormValues, Params>({
  defaultValues: { keyword: '', range: undefined },
  fieldTransforms: {
    range: (range) => range && { start: range[0], end: range[1] },
  },
  transform: (params) => ({ ...params, keyword: params.keyword?.trim() }),
  onSubmit: (params) => table.submit(params),
  onReset: (params) => table.reset(params),
})
```

`submitted` 保存最近一次转换成功的表单值快照，`params` 保存对应的请求字段快照；两者在调用 `onSubmit` / `onReset` 前发布，首次转换成功前均为 `undefined`。草稿、默认值、回调参数之间会对普通对象、数组和 Date 做独立快照。不要将带内部可变状态的自定义类实例用作表单值。

提交失败不会自动回滚草稿。转换抛错时保留上一次的 `submitted` / `params`；回调抛错或返回的 Promise 拒绝时，不回滚本次已经发布的快照，通过 `error` 读取错误并重试。`submit()` / `reset()` 返回 `Promise<boolean>`，当前调用成功完成为 `true`，转换或回调失败、被更新的提交取代或作用域已经销毁时为 `false`。旧回调的失败不会覆盖新提交的错误状态。

`onSubmit` / `onReset` 只接收转换参数和表单快照，不提供 `AbortSignal`。独立请求回调的取消由业务管理；连接 `useTableRequest` 后，请求管理器负责新请求替代旧请求时的取消。

`useTableRequest` 自身通过 `error` 报告网络错误并正常结束 Promise，因此组合后的请求结果仍应读取 `table.error`；查询返回值只表示查询转换与回调执行情况。

## 字段参数转换

1. 未配置 `fieldTransforms` 的字段保留原键和值。
2. 配置了转换的字段移除原键；函数可以返回多个请求字段，或返回 `undefined` 以省略该字段。
3. 所有字段转换按配置中的键顺序合并，覆盖同名的未转换字段；后面的转换覆盖前面的结果。
4. 最后调用整体 `transform(params, values)`，适合 trim、剔除空值等统一处理。

字段转换只在提交和重置时执行。收起表单仅改变布局状态，收起区域的字段仍参与提交；是否清空或省略由业务的字段转换决定。

连接 `useTableRequest` 后，其参数合并仍依次为 `defaultParams`、本次提交参数、额外 `params`，然后执行 `beforeSearchSubmit`。分页字段由请求管理器写入。避免把同一个参数同时放在响应式额外 `params` 和草稿中，否则额外参数的变化仍会按请求管理器协议触发请求。

## 重置约定

| 操作            | 草稿           | 已提交参数   | 请求与表格状态                                                                                 |
| --------------- | -------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `resetFields()` | 恢复初始默认值 | 保留         | 不请求                                                                                         |
| `submit()`      | 保留           | 转换当前草稿 | 调用 `onSubmit`；连接 `table.submit` 后回第一页，保留排序和筛选                                |
| `reset()`       | 恢复初始默认值 | 转换默认值   | 调用 `onReset`，未提供时调用 `onSubmit`；连接 `table.reset(params)` 后回第一页并清空排序、筛选 |

`reset()` 不改变展开状态、行选择、树节点展开或列偏好，这些由业务按场景处理。`defaultValues` 在创建时取快照，后续外部修改不会改变重置基线。

`useTableQuery` 本身不会首次请求。需要首次加载默认查询时，可使用 `manualRequest: true` 并在初始化后调用一次 `query.submit()`；避免同时让请求管理器自动加载与手动提交默认值。

在组件 `setup` 或 `effectScope` 内创建时，作用域销毁会停止展开状态监听、清除提交中状态并忽略旧回调的完成结果，之后的提交和重置返回 `false`。查询协议不负责取消回调中的业务请求；连接 `useTableRequest` 后由请求管理器在同一作用域销毁时取消。不要在无作用域的模块顶层创建需要随页面释放的查询状态。

## API

| 选项                       | 说明                                                   |
| -------------------------- | ------------------------------------------------------ |
| `defaultValues`            | 必填，表单默认值与重置基线                             |
| `fieldTransforms`          | 按表单字段配置转换，返回请求参数片段                   |
| `transform`                | 字段转换后的整体参数转换                               |
| `onSubmit` / `onReset`     | 接收转换参数与本次表单快照，可返回 Promise             |
| `defaultCollapsed`         | 默认 `true`                                            |
| `collapsed` / `onCollapse` | 可选的共享 Ref 与状态变化回调；传入 Ref 时优先于默认值 |

返回 `draft`、`submitted`、`params`、`collapsed`、`submitting`、`error`，以及 `submit()`、`reset()`、`resetFields()`、`toggleCollapsed()`。需要校验时，先调用宿主表单的 validate，成功后再调用 `submit()`。
