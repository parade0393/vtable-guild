---
'@vtable-guild/vtable-guild': minor
---

Make explicit leaf-column `minWidth` a layout lower bound in auto and fixed layouts, including fixed headers, fixed columns, summaries and virtual tables. Resizing a column preserves every visible column's minimum, including non-resizable columns; insufficient container space produces horizontal scrolling.

Existing `minWidth` configurations can now produce wider columns or earlier horizontal overflow. A `width` or resizing `maxWidth` below `minWidth` no longer overrides the lower bound. Unset or invalid minimums add no default layout constraint; resizing retains its 50px fallback. Resize events remain `(column, width)` on release and report the constrained target, which auto content may exceed.
