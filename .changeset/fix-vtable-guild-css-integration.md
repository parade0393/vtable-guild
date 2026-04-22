---
'@vtable-guild/vtable-guild': patch
---

fix: ensure single-package CSS integration works in both workspace dev and published usage

- keep @vtable-guild/vtable-guild/css as the canonical CSS entry and package-level published asset
- align playground integration with documented usage by importing package CSS from the CSS entry file
- fix aggregated CSS copy/rewrite flow so style resolution does not break after packaging
- normalize table-related arbitrary utility color classes for reliable Tailwind generation
