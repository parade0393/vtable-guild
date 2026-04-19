# @vtable-guild/vtable-guild

Single public package for vtable-guild. Install one package, import one runtime entry, and use one CSS entry.

## Installation

```bash
pnpm add @vtable-guild/vtable-guild
```

## Quick Start

```ts
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css'

const app = createApp(App)
app.use(createVTableGuild())
```

```vue
<template>
  <VTable :columns="columns" :data-source="data" />
</template>
```

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme).

## License

MIT
