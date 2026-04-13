# @vtable-guild/core

Core utilities and theme system for vtable-guild — includes `tv()` wrapper, `cn()` class merging, `useTheme()` composable, Vue plugin (`createVTableGuild`), and base UI components.

> 大多数项目直接使用聚合包 `@vtable-guild/vtable-guild` 即可。此包适合需要精确控制依赖边界的拆包用法。

## Installation

拆包使用时，需同时安装 core、table、theme：

```bash
pnpm add @vtable-guild/core @vtable-guild/table @vtable-guild/theme
```

## Usage

```ts
import { createVTableGuild } from '@vtable-guild/core'
import { VTable } from '@vtable-guild/table'
import '@vtable-guild/theme/css'

const app = createApp(App)
app.use(createVTableGuild())
```

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme) for usage details.

## License

MIT
