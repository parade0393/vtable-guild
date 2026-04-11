---
'@vtable-guild/core': patch
'@vtable-guild/table': patch
'@vtable-guild/theme': patch
'@vtable-guild/vtable-guild': patch
---

Fix preset CSS mounting so both built-in presets can apply from root without requiring users to manually add HTML attributes.

Update the element-plus usage guidance to keep the default theme CSS import, append the element-plus preset CSS, and rely on createVTableGuild to sync the active preset automatically.
