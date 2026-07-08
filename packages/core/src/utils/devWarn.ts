// packages/core/src/utils/devWarn.ts

/**
 * 开发期一次性警告工具。
 *
 * - 生产构建（`import.meta.env.PROD`）下为空操作，无运行时开销。
 * - 通过 `id` 去重：同一 id 只在开发期打印一次，避免在渲染/滚动等热路径刷屏。
 *
 * @example
 * ```ts
 * devWarn('rowKey-missing', '[VTable] rowKey 未配置，已回退到行索引，可能导致选择/展开错乱。')
 * ```
 */
const warnedIds = new Set<string>()

export function devWarn(id: string, message: string): void {
  if (import.meta.env?.PROD) return
  if (warnedIds.has(id)) return
  warnedIds.add(id)
  console.warn(message)
}

/** 仅供测试使用：清空去重记录 */
export function resetDevWarnedForTest(): void {
  warnedIds.clear()
}
