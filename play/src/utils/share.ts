/**
 * 文档站 → Playground 的源码传递。
 *
 * 文档站只通过 `?demo=<id>` 传 demo 标识，源码由 Playground 在构建时一并打包。
 * 避免把完整 SFC 放进请求 URL，触发服务器或代理的请求行长度限制。
 * repl 自己的 `#` hash 留给 Playground 内部的「复制分享链接」，两者互不冲突。
 */

const demoSources = import.meta.glob('../../../site/demos/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getDemoSource(demoId: string): string | null {
  return demoSources[`../../../site/demos/${demoId}.vue`] ?? null
}

/** 读取并消费 `?demo=`，读到后把它从地址栏抹掉，避免和后续 hash 分享链接混在一起 */
export function takeDemoSourceFromUrl(): string | null {
  const url = new URL(window.location.href)
  const demoId = url.searchParams.get('demo')
  if (!demoId) return null

  const source = getDemoSource(demoId)
  url.searchParams.delete('demo')
  window.history.replaceState({}, '', url)
  return source
}
