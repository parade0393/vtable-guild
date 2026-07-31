---
'@vtable-guild/vtable-guild': minor
---

新增浏览器单文件产物 `dist/index.full.mjs`，通过 `@vtable-guild/vtable-guild/full` 导出。

该产物只把 `vue` 保留为 external，`tailwind-variants` 及其依赖全部内联，可以直接被 import map 或
`<script type="module">` 指向，无需打包器参与：

```html
<script type="importmap">
  {
    "imports": {
      "@vtable-guild/vtable-guild": "https://cdn.jsdelivr.net/npm/@vtable-guild/vtable-guild/dist/index.full.mjs"
    }
  }
</script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@vtable-guild/vtable-guild/css/style.css"
/>
```

主入口 `.` 仍是 `preserveModules` 产物，打包器场景不受影响，也不应改用 `./full`——那份产物无法 tree-shake。
