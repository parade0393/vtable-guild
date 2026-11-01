---
'@vtable-guild/vtable-guild': patch
---

Fix dynamic table slots and callbacks so empty, body, header and filter content update without remounting the table. Keep custom filter dismissal working when its slot changes, and apply replacement cell transformers and popup containers immediately.

Export the seven column settings, toolbar and progress icons from the aggregate package root. Internal workspace packages remain private and are not published separately.
