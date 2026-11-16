---
'@vtable-guild/vtable-guild': minor
---

Make `light` the default schema query layout. Fields use compact, configurable control widths, and the actions follow the fields. Set `layout="form"` to keep the responsive grid. Queries that already pass `autoSubmit` and omit `layout` now submit on field changes. Automatic submission still requires `autoSubmit`.

Export `TableBuiltinControlValueType` and `TableControlValueType` for built-in control suggestions and custom registry keys in schema queries and editable columns.
