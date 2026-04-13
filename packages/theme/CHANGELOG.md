# @vtable-guild/theme

## 2.0.0

### Minor Changes

- [`f3f1eae`](https://github.com/parade0393/vtable-guild/commit/f3f1eaed310ab6c6d77b4bd9bc4d0149aba05d29) Thanks [@parade0393](https://github.com/parade0393)! - Bundle all theme presets in main CSS entry

  `@import '@vtable-guild/theme/css'` now includes both `antdv` (default) and `element-plus` presets. The element-plus preset no longer has a `:where(:root)` fallback — it only activates via `[data-vtg-preset='element-plus']`, which `createVTableGuild({ themePreset: 'element-plus' })` sets automatically. No extra CSS import is needed when switching presets.

## 1.0.2

### Patch Changes

- 4e5951f: Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

  Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.

## 1.0.0

### Minor Changes

- c24a498: initial release of vtable-guild packages
