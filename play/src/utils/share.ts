/**
 * 文档站 → Playground 的源码传递。
 *
 * 走 `?demo=` 查询参数而不是复用 @vue/repl 自己的 hash 格式：
 * 编码逻辑完全由我们两边控制，不会因为 repl 内部换压缩实现而失效。
 * repl 自己的 `#` hash 留给 Playground 内部的「复制分享链接」，两者互不冲突。
 */

/** 与 site/.vitepress/theme/components/Demo.vue 的 encodeDemoSource 对应 */
export function decodeDemoSource(encoded: string): string | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/** 读取并消费 `?demo=`，读到后把它从地址栏抹掉，避免和后续 hash 分享链接混在一起 */
export function takeDemoSourceFromUrl(): string | null {
  const url = new URL(window.location.href)
  const encoded = url.searchParams.get('demo')
  if (!encoded) return null

  const source = decodeDemoSource(encoded)
  url.searchParams.delete('demo')
  window.history.replaceState({}, '', url)
  return source
}
