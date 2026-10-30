# 外部表单与明细草稿

`useTableEdit` 与 `useTableEditable` 都可以连接受控明细数组。父表单保存已提交的源记录，行输入保留在表格草稿中；全量提交时可以收集尚未逐行保存的草稿，包含虚拟离屏行。

## 受控源与草稿

```ts
const details = ref<Row[]>(initialRows)
const edit = useTableEditable<Row>({
  rowKey: 'id',
  mode: 'multiple',
  columns,
  controls,
  dataSource: details,
  onChange: (value) => {
    details.value = value
  },
})
const { records, errors, validating } = edit
```

`records` 是源记录、行草稿和缓存新增行的组合快照，直接绑定到表格。`onChange` 只在成功逐行保存或 source 模式新增时通知一次；逐键输入不回写源数据。父表单回写或服务端刷新不会覆盖已打开的本地草稿。删除源记录时，未结束的草稿仍保留在 records 中，避免静默丢失输入；业务确认放弃后调用 cancel 或 reset。

配置受控适配时，onSave 返回服务端的标准记录，由 onChange 更新父源；避免在两个回调中重复回写同一份数据。未配置适配时仍沿用原先由业务更新 dataSource 的方式。

`getDraft(key) / getDrafts()` 读取隔离的编辑器值，`getOriginal(key)` 读取进入编辑时的源快照。`getValues()` 组合当前客户端持有的数据并转换草稿为提交值，不触发校验、保存或 onChange。请使用 `validateAll()` 的结果快照执行最终提交，避免校验后又读取一份变化的数据。

## 一次提交明细

```ts
async function submitMaster() {
  await masterForm.value.validate()
  const result = await edit.validateAll()
  if (!result.valid) {
    const key = result.errors.keys().next().value
    if (key !== undefined) await table.value.scrollTo({ key })
    return
  }
  await saveOrder({ ...masterValues, details: result.values })
  details.value = result.values!
  edit.reset()
}
```

外部提交的互斥、主表单校验与网络错误提示由业务控制。`validateAll()` 不调用 onSave / onChange，也不会关闭编辑或改变源数组；对未编辑源记录先临时转换为编辑器值再校验，提交结果仍保留其源值。发生输入、源数据变化、重置、保存或卸载时，旧校验返回 `{ valid: false, obsolete: true }`，不会覆盖新错误；相同进行中的校验合并。

错误保存在 `errors` 的行键和字段路径下，即使对应虚拟行已卸载仍可定位。`validating` 表示全量校验；逐行 `savingKeys` 表示保存，不能用循环 save 代替纯校验。校验失败或接口提交失败时保留用户草稿。

`reset()` 中止操作并清除草稿和错误，保留当前外部源数组；重置主表单时先替换 details，再调用 reset。它不执行取消回调，也不发送保存请求。

## 新增策略

```ts
const edit = useTableEditable<Row>({
  rowKey: 'id',
  mode: 'multiple',
  columns,
  controls,
  dataSource: details,
  onChange: (value) => {
    details.value = value
  },
  createRecord: () => ({ id: nextLocalId--, name: '', amount: 1 }),
  maxRows: 20,
})
edit.add(undefined, { position: 'top' })
edit.add(undefined, { position: 'bottom', mode: 'source' })
```

默认 `position: 'bottom' / mode: 'cache'`。cache 新增在保存前只存在于草稿，取消即移除；source 模式立即通过 onChange 插入源数组，之后作为已有源行编辑，取消只丢弃编辑内容并保留这条源记录。source 需要 dataSource 和 onChange 配对配置。

`createRecord` 工厂每次尝试创建一个稳定且不重复的键；`maxRows` 统计当前客户端源与缓存新增行。达到上限、重复键或 single 模式已有编辑行时返回 false。已有行保存不能改键；缓存新行可由服务端分配最终键，但不能与现有源冲突。

这些能力仅覆盖客户端持有的记录：远程分页未加载的行无法校验；嵌套树节点插入由业务处理；服务端批量原子性、撤销历史和电子表格导航不包含在此协议中。

双预设完整演示位于 playground 的 `/#/pro-schema`，包含主表单、校验错误定位、保存失败保留、首尾新增和虚拟表体。
