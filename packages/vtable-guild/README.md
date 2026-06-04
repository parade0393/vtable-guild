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

If your project does not use Tailwind CSS, or you do not want the host project to generate this package's styles, import the complete prebuilt CSS instead:

```ts
import '@vtable-guild/vtable-guild/css/style'
```

This entry works without installing Tailwind CSS or configuring `@tailwindcss/vite`. `@vtable-guild/vtable-guild/css/tailwind3` is kept as a legacy compatibility alias for existing projects.

```vue
<template>
  <VTable :columns="columns" :data-source="data" />
</template>
```

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme).

## License

MIT
