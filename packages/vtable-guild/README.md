# @vtable-guild/vtable-guild

All-in-one entry package for vtable-guild — re-exports everything from `@vtable-guild/table`, `@vtable-guild/core`, `@vtable-guild/icons`, and `@vtable-guild/theme`.

## Installation

```bash
pnpm add @vtable-guild/vtable-guild
```

## Quick Start

```ts
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/theme/css/presets/antdv'

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
