# @vtable-guild/theme

Default theme definitions for vtable-guild. Provides tailwind-variants slot configs and CSS variable tokens for multiple UI presets (ant-design-vue, element-plus).

## Installation

```bash
pnpm add @vtable-guild/theme
```

## Usage

Import the CSS that matches your target preset:

```ts
// ant-design-vue preset (default)
import '@vtable-guild/theme/css'

// element-plus preset
import '@vtable-guild/theme/css'
import '@vtable-guild/theme/css/presets/element-plus'
```

Set `themePreset` at runtime with `createVTableGuild({ themePreset })`. You do not need to manually add `data-vtg-preset` attributes.

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme) for theme customization details.

## License

MIT
