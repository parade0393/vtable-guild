# 编辑

减少逐列控件绑定代码可使用 [列级编辑与控件](/guide/editable-columns)；主表单一次提交全部明细、虚拟离屏校验与受控新增见 [外部表单与明细](/guide/detail-form)。以下保留手写插槽与基础行草稿协议。

vtable-guild 通过 `bodyCell` 插槽支持单元格编辑和整行编辑。`useTableEdit` 管理按稳定行键保存的草稿、校验和异步保存；编辑器直接使用项目已有的 Ant Design Vue、Element Plus 或表单控件。

## 编辑状态与校验协议

`useTableEdit` 对齐 [EditableProTable 的编辑协议](https://procomponents.ant.design/components/editable-table/)：`editableKeys` 表示当前编辑行，保存完成后退出编辑，校验或保存失败保留草稿；`onCancel` 完成后丢弃草稿。`add()` 对应缓存新增行，取消后该行消失。新增按钮和操作列由业务组合。

<Demo src="editing/protocol">

<<< @/demos/editing/protocol.vue

</Demo>

```ts
const edit = useTableEdit<Member>({
  rowKey: 'key',
  mode: 'multiple',
  validate: (draft) => (draft.name.trim() ? undefined : { fields: { name: '请输入姓名' } }),
  onSave: async (draft, { key, original, isNew, signal }) => {
    const saved = await api.saveMember(draft, { signal })
    // 使用 key 定位已有记录，isNew 时插入；original 是进入编辑时的快照。
    updateDataSource(saved, { key, isNew, original })
    return saved // 也可返回 true / void 接受草稿，返回 false 保持编辑。
  },
})
```

| 配置                       | 说明                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `rowKey`                   | 必填，记录字段名或返回 `string / number` 的函数，不使用行索引                                   |
| `mode`                     | `'single'`（默认）或 `'multiple'`；单行模式已有草稿时 `start / add` 返回 `false`                |
| `clone`                    | 可选完整记录复制函数；默认复制普通对象、数组及 Date，含可变类实例时自行提供                     |
| `validate(draft, context)` | 同步或异步返回 `{ message?, fields? }`；返回 `void` 或空错误对象继续保存                        |
| `onSave(draft, context)`   | 校验通过后调用；可返回服务端规范化记录或 `void`，由业务更新 `dataSource`；返回 `false` 保留草稿 |
| `onCancel(draft, context)` | 可选同步或异步取消处理；返回 `false` 保留草稿，拒绝时记录 `'cancel'` 错误                       |
| `onError(error, key)`      | 校验、保存和取消失败通知；同时可从 `errors` 读取行错误                                          |

`context` 包含 `key / original / isNew / signal`。新增行的 `original` 为 `undefined`；已有记录在输入和保存期间保持相同行键，新增行可在保存结果中使用服务端分配的新键。

| 状态或方法                       | 说明                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `editableKeys`                   | 只读编辑行键数组；通过 `start / add / cancel / save` 变更                               |
| `savingKeys / cancellingKeys`    | 保存（含校验）和取消中的行键集合，可用于禁用编辑器或显示 loading                        |
| `errors`                         | 行键到 `{ type, message, fields?, cause? }` 的映射                                      |
| `newRecords`                     | 未保存新增行的草稿副本，组合到 `dataSource` 的首部或尾部                                |
| `start(record) / add(record)`    | 创建已有记录或新增记录的草稿，重复行键返回 `false`                                      |
| `isEditing(key) / getDraft(key)` | 查询编辑状态及隔离的草稿副本                                                            |
| `setDraft(key, patch)`           | 合并部分字段，或通过 `(draft) => record` 更新嵌套字段；清除旧错误                       |
| `save(key)`                      | 返回 `Promise<Record \| undefined>`；成功返回记录并结束编辑，失败或失效返回 `undefined` |
| `cancel(key) / cancelAll()`      | 返回取消结果的 Promise；成功取消后清理草稿和错误                                        |

输入期间只调用 `setDraft()`，不要直接改写源数据或 `getDraft()` 的返回值。保存期间相同行的重复调用复用同一 Promise，不会重复调用 `onSave`。取消或更新草稿会中止旧任务，过期的成功或失败不能关闭新草稿；组件作用域销毁会清理全部任务。异步业务回调仍须传递并检查 `signal`，防止已经取消的请求写回业务数据。

编辑状态位于组合式函数中，虚拟行离屏卸载不会丢失草稿。分页、刷新、数据替换也不会自动取消草稿；业务需要在离开页面、切换数据集或删除记录时明确调用 `cancel / cancelAll`。

这个协议不包含 React Form 实例、自动编辑器生成、删除确认或整表事务；使用 `bodyCell` 将 `a-input / el-input` 等现有控件连接到同一草稿即可兼容两套预设。

## 单元格编辑

点击任意单元格进入编辑。输入内容先留在独立草稿中，按 Enter 或移开焦点提交，按 Escape 放弃。Enter 处理会避开输入法的候选词阶段。

<Demo src="editing/cell">

<<< @/demos/editing/cell.vue

</Demo>

示例里的编辑状态由稳定的 `rowKey` 和列的 `dataIndex` 共同定位。点击“倒序并替换数据”会创建新的记录对象并调整顺序，正在编辑的单元格仍会跟随同一条记录，不会因为行索引变化而串行。

输入框维护本地 draft，不会在每次输入时直接改写 `dataSource`。这对表格重渲染尤其重要，可以避免输入过程中编辑器反复更新导致光标跳动。

## 整行编辑

整行编辑在进入编辑时复制一份行级草稿。多个字段修改完成后由“保存”一次性写回；“取消”只清理草稿，不会污染源记录。

<Demo src="editing/row">

<<< @/demos/editing/row.vue

</Demo>

示例使用原生 `input` 和 `select`，因此可以同时运行在文档站和源码 Playground。实际项目里可原位替换成 `a-input`、`el-input`、Select、DatePicker 或已有的表单字段组件，表格不限制编辑器类型。

示例将列标注为 `TableColumnsType<MemberRow>`，`#bodyCell` 的上下文对应 `TableBodyCellSlotProps<MemberRow>`。其中 `record` 是 `MemberRow`，`text` 是 `unknown`，`column.dataIndex` 是 `DataIndex | undefined`；示例中的 `isEditableField` 会先检查字段名，再读取或写入草稿。草稿类型属于业务代码，表格的公开插槽类型见页末声明。

## 实现原则

- 始终设置 `row-key="key"`，并按稳定行键保存编辑状态，不要使用渲染时的行索引。
- 用 `dataIndex` 标识字段；提交时用行键查找记录，即使数据重排或替换也不会写到另一行。
- 单元格输入先写本地 draft，只在 Enter 或 blur 时提交到 `dataSource`。
- Enter 事件同时检查 `event.isComposing` 和 composition 状态，避免中文输入法选词时提前保存。
- 整行编辑复制记录形成草稿，Save 时整体提交，Cancel 时直接丢弃。

## 能力边界

`useTableEdit` 已提供行级状态、校验和保存协议，以下能力仍由业务组合：

- 自动查询或编辑表单生成、字段间依赖联动。
- 整表事务提交、撤销历史或具体 HTTP 服务。
- Excel 式方向键、Tab 连续编辑和单元格选区。

如果这些能力是核心需求，建议在 `bodyCell` 上组合项目现有的表单方案；需要完整电子表格式编辑引擎时，vxe-table 等功能更完整的方案会更合适。

## 虚拟滚动

虚拟滚动只保留可视区附近的行。编辑中的单元格离开可视区后，编辑器组件可能被卸载；草稿只要按稳定行键存储就不会串到其他记录，但业务仍需明确离屏时是自动提交、取消，还是保留草稿等待该行再次出现。

## 相关页面

- [自定义行与插槽](/guide/api-wiring-and-slots)
- [虚拟滚动](/guide/virtualization)
- [API Reference](/guide/api-reference)

## Type Declarations

编辑使用公开的 `bodyCell` 插槽及列字段路径类型，`TRecord` 表示业务行类型。列配置为相关字段节选；`MergedColumnFields` 是文档辅助接口，不是包导出，完整列配置和插槽声明见[类型参考](/guide/type-reference)。

::: details 查看类型声明

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#DataIndex

<<< @/.vitepress/type-declarations/features.ts#MergedColumnFields

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

:::
