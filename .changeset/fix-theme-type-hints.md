---
'@vtable-guild/vtable-guild': patch
---

fix(vtable-guild): restore type hints for createVTableGuild theme parameter

Fixed missing type hints for the `theme` parameter in `createVTableGuild()` by adding module augmentation to the bundled type declarations. The `theme` object now correctly shows available keys (table, button, checkbox, radio, input, tooltip, scrollbar) with full IntelliSense support.
