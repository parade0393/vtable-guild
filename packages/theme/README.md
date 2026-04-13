# @vtable-guild/theme

Default theme definitions for vtable-guild. Provides tailwind-variants slot configs and CSS variable tokens for multiple UI presets (ant-design-vue, element-plus).

## Installation

```bash
pnpm add @vtable-guild/theme
```

## Usage

Import the CSS entry (all presets are included):

```ts
import '@vtable-guild/theme/css'
```

Set `themePreset` at runtime with `createVTableGuild({ themePreset })` to switch between `antdv` (default) and `element-plus`. You do not need to manually add `data-vtg-preset` attributes.

## Documentation

See the [full documentation](https://github.com/parade0393/vtable-guild#readme) for theme customization details.

## License

MIT
