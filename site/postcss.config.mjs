import prefixSelector from 'postcss-prefix-selector'

/*
 * VitePress 1.6 的 vp-doc.css 里，表格样式是无条件的：
 *
 *   .vp-doc table { display: block; border-collapse: collapse; ... }
 *   .vp-doc th, .vp-doc td { border: 1px solid ...; padding: 8px 16px }
 *   .vp-doc tr:nth-child(2n) { background-color: ... }
 *
 * 这些选择器特异性是 (0,1,1)，而 vtable-guild 的 utility class 是 (0,1,0)，
 * 所以文档站里的 <VTable> 会被 VitePress 的 markdown 表格样式整个盖掉——
 * 不只是难看：display:block + border-collapse:collapse 会直接搞坏固定列和虚拟滚动。
 *
 * 这个问题**不能**靠「写一条更高特异性的规则覆盖回去」解决：那样赢的是我们这条规则，
 * 组件库自己的 utility class 同样会输，等于把主题系统一起废掉。
 * 唯一正确的做法是让 VitePress 的规则**不匹配**。
 *
 * 于是按 VitePress 官方给 `vp-raw` 的方案，构建期给 vp-doc.css 的每条选择器追加
 * `:not(:where(.vp-raw, .vp-raw *))`。`:where()` 特异性为 0，`:not(:where(...))` 也是 0，
 * 所以原有 markdown 排版一点没变，只是 .vp-raw 子树被排除在外。
 * Demo.vue 的预览区带 vp-raw class。
 */
const EXCLUDE_RAW = ':not(:where(.vp-raw, .vp-raw *))'

export default {
  plugins: [
    prefixSelector({
      prefix: EXCLUDE_RAW,
      includeFiles: [/vp-doc\.css/],
      transform(prefix, selector) {
        // 伪元素必须留在最后：.vp-doc a::before → .vp-doc a:not(...)::before
        const [base, pseudoElement = ''] = selector.split(/(?=::)/)
        return `${base}${prefix}${pseudoElement}`
      },
    }),
  ],
}
