// packages/core/src/utils/fullscreen.ts

/**
 * 浏览器全屏时只渲染全屏元素及其后代，挂在 `document.body` 上的浮层不可见。
 *
 * 触发元素位于全屏元素内时返回该元素，供浮层作为默认挂载容器；否则返回 `null`。
 * 整个文档全屏（全屏元素是 `<html>` / `<body>`）时 body 仍然可见，同样返回 `null`。
 */
export function getFullscreenContainer(trigger: Element | null | undefined): HTMLElement | null {
  if (!trigger || typeof document === 'undefined') return null
  const element = document.fullscreenElement
  if (!(element instanceof HTMLElement)) return null
  if (element === document.documentElement || element === document.body) return null
  return element.contains(trigger) ? element : null
}
