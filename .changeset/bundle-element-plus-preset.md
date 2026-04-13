---
'@vtable-guild/theme': minor
---

Bundle all theme presets in main CSS entry

`@import '@vtable-guild/theme/css'` now includes both `antdv` (default) and `element-plus` presets. The element-plus preset no longer has a `:where(:root)` fallback — it only activates via `[data-vtg-preset='element-plus']`, which `createVTableGuild({ themePreset: 'element-plus' })` sets automatically. No extra CSS import is needed when switching presets.
