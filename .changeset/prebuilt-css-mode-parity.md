---
'@vtable-guild/vtable-guild': patch
---

fix(table): prebuilt 模式列对齐失效、子组件预设掉样式与固定列表格宽度异常

三处 `cssMode: 'prebuilt'` 管道缺陷，以及一处与 ant-design-vue 的布局行为偏差：

- **列 `align` 在 prebuilt 下失效**：`align` 生成的 `text-center` 等工具类没有经过 `vtg-` 前缀
  管道，而预构建 CSS 只有 `.vtg-text-*` 规则，表头更被基类 `vtg-text-left` 明确压成左对齐。现在
  表体、表头与汇总单元格的 align 类统一经 `tableContext.vtgClass` 输出；`tailwind3` / `tailwind4`
  模式行为不变。
- **注入核心子组件的预设主题未加前缀**：Table 通过 context 向 Button / Checkbox / Input / Radio /
  Scrollbar / Tooltip 注入的预设主题（如 element-plus）是裸类名，而 `useTheme` 只对内置默认主题做
  前缀处理——element-plus + prebuilt 下这些子组件的预设结构类全部落空，视觉退化为 antdv；antdv
  下也会产生一份冗余的裸类副本。现在仅在 Table 的 provide 侧对预设调用 `prefixThemeConfig`，用户
  经 ConfigProvider 传入的自定义主题保持原样不前缀。
- **有固定列且未设 `scroll.x` 时表格宽度异常**：表格被内联 `width: max-content`（ant-design-vue
  不会这样做），导致表格不撑满容器、固定列不贴容器边缘、未声明宽度的列按内容撑开，双表模式下
  表头表与表体表宽度口径不一致而错位。现在未声明 `scroll.x` 时恒定 `width: 100%`；
  `scroll={{ x: 'max-content' }}` 的显式 opt-in 不受影响。
