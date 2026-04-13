# @vtable-guild/table

A highly customizable Vue 3 Table component powered by tailwind-variants. API compatible with ant-design-vue Table, with support for multiple UI preset themes (ant-design-vue, element-plus).

## Installation

```bash
pnpm add @vtable-guild/table @vtable-guild/core @vtable-guild/icons @vtable-guild/theme
```

## Quick Start

```ts
import { createVTableGuild } from '@vtable-guild/core'
import { VTable } from '@vtable-guild/table'
import '@vtable-guild/theme/css'

const app = createApp(App)
app.use(createVTableGuild())
app.component('VTable', VTable)
```

```vue
<template>
  <VTable :columns="columns" :data-source="data" />
</template>
```

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme) for all features: sorting, filtering, fixed columns, row selection, expandable rows, tree table, virtualization, and more.

## License

MIT
