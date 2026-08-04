# 编辑

vtable-guild 通过 `bodyCell` 插槽支持单元格编辑和整行编辑。表格负责稳定地渲染列、行与单元格，业务代码负责草稿、校验和提交，这样编辑器可以直接使用项目里已有的表单控件。

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

## 实现原则

- 始终设置 `row-key="key"`，并按稳定行键保存编辑状态，不要使用渲染时的行索引。
- 用 `dataIndex` 标识字段；提交时用行键查找记录，即使数据重排或替换也不会写到另一行。
- 单元格输入先写本地 draft，只在 Enter 或 blur 时提交到 `dataSource`。
- Enter 事件同时检查 `event.isComposing` 和 composition 状态，避免中文输入法选词时提前保存。
- 整行编辑复制记录形成草稿，Save 时整体提交，Cancel 时直接丢弃。

## 能力边界

`bodyCell` 已经能承载单元格编辑和整行编辑，但 vtable-guild 当前不内置以下能力：

- 编辑状态管理和表单校验协议。
- 事务提交、撤销历史或服务端保存流程。
- Excel 式方向键、Tab 连续编辑和单元格选区。

如果这些能力是核心需求，建议在 `bodyCell` 上组合项目现有的表单方案；需要完整电子表格式编辑引擎时，vxe-table 等功能更完整的方案会更合适。

## 虚拟滚动

虚拟滚动只保留可视区附近的行。编辑中的单元格离开可视区后，编辑器组件可能被卸载；草稿只要按稳定行键存储就不会串到其他记录，但业务仍需明确离屏时是自动提交、取消，还是保留草稿等待该行再次出现。

## 相关页面

- [自定义行与插槽](/guide/api-wiring-and-slots)
- [虚拟滚动](/guide/virtualization)
- [API Reference](/guide/api-reference)
