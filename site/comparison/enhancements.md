# 增强与独有能力

这一页只聚焦“相对原表格方案额外得到什么”，不重复完整教程。需要具体使用方式时，请跳到对应指南页。

## 更顺手的 API

### 尺寸命名与 ant-design-vue 一致

表格尺寸沿用 `small`、`middle`、`large`，和 ant-design-vue 完全相同——从 antdv 迁过来时这一项不用改。默认值是 `large`。

### TypeScript 使用链路更完整

VTable 提供明确的列类型、行数据类型、事件参数类型，以及主题 key 和 slot key 的类型边界，适合在业务代码里长期维护。

### 样式覆盖路径更清晰

除了 Vue slot，本库把样式覆盖拆成三层：

- `themePreset`
  切换整体视觉基线
- 全局 `theme`
  统一应用级规则
- 实例级 `ui`
  处理单表例外

对应说明见 [三层主题覆盖](/guide/theme-overrides)。

## 更直接的表格能力

### 虚拟滚动

通过 `virtual` 配合 `scroll.y` 直接启用，适合长列表和性能敏感页面。详见 [虚拟滚动](/guide/virtualization)。

### 更直接的视觉状态开关

- `striped`
  条纹行
- `hoverable`
  行 hover 高亮
- `bordered`
  边框模式

这些状态都可以直接通过 props 或主题配置开启，不需要再拆散到业务 CSS 里。

### 多预设支持

当前内置 `antdv` 和 `element-plus` 两套预设，可让同一套表格逻辑接入不同 Vue UI 体系。详见 [预设与语言](/guide/presets-and-locales)。

## 继续阅读

- [功能对比总览](/comparison/)
- [虚拟滚动](/guide/virtualization)
- [列宽拖拽](/guide/column-resize)
- [三层主题覆盖](/guide/theme-overrides)
