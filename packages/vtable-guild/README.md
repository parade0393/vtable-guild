# @vtable-guild/vtable-guild

Single public package for vtable-guild. Install one package, import one runtime entry, and use one CSS entry.

## Installation

```bash
pnpm add @vtable-guild/vtable-guild
```

## Quick Start

Default prebuilt CSS mode:

```ts
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style'

const app = createApp(App)
app.use(createVTableGuild())
```

This works without installing Tailwind CSS or configuring `@tailwindcss/vite`. Internal utility
classes are emitted with the `vtg-` prefix. If you need to override an internal utility in `ui` or
`theme`, use the same prefix, for example `vtg-px-2`.

If your project uses Tailwind CSS 4 and you want unprefixed utilities, use the Tailwind 4 CSS entry
and runtime mode:

```ts
import '@vtable-guild/vtable-guild/css/tailwind4'

app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

`@vtable-guild/vtable-guild/css/tailwind3` is kept as a legacy compatibility alias for existing
prebuilt CSS projects.

```vue
<template>
  <VTable :columns="columns" :data-source="data" />
</template>
```

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme).

## License

MIT
