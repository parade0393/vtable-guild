# 展开行

展开行覆盖两类用法：由组件内部维护展开状态的非受控模式，以及外部通过 `expandedRowKeys` 接管状态的受控模式。除了额外内容渲染，当前还支持点击整行展开和自定义展开图标。

## 基础配置

```vue
<script setup lang="ts">
import { VTable, type ColumnsType, type Expandable } from '@vtable-guild/vtable-guild'

interface DemoRow {
  key: string
  name: string
  role: string
  city: string
}

const columns: ColumnsType<DemoRow> = [{ title: 'Name', dataIndex: 'name', key: 'name' }]

const expandable: Expandable<DemoRow> = {
  expandRowByClick: true,
  expandedRowRender: (record) => `${record.name} works as ${record.role} in ${record.city}.`,
}
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :expandable="expandable" />
</template>
```

## 受控模式

```ts
const expandedRowKeys = ref<Key[]>(['1'])

const expandable = computed<Expandable<DemoRow>>(() => ({
  expandedRowKeys: expandedRowKeys.value,
  expandedRowRender: (record) => record.name,
  onExpandedRowsChange: (keys) => {
    expandedRowKeys.value = [...keys]
  },
}))
```

这种模式下，组件只负责发出下一组 key，不会直接改写本地状态。

## 常用扩展点

- `expandRowByClick`：点击整行切换展开状态。
- `rowExpandable(record)`：按记录决定该行是否可展开。
- `expandIcon(props)`：替换默认展开图标，适合对齐设计系统按钮样式。
- `showExpandColumn: false`：隐藏展开列，只保留行点击展开。

## 对照示例来源

- playground 入口：playground/src/pages/AdvancedPage.vue
- 当前测试覆盖：packages/table/src/composables/useExpand.test.ts、packages/table/src/components/VTable.test.ts

<PlaygroundDemo
  title="展开行对照页"
  route="/advanced"
  note="该页覆盖受控 expandedRowKeys、整行点击展开、自定义 expandIcon，以及隐藏展开列的用法。"
  :height="760"
/>
