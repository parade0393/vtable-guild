import type { TableContext } from '../context'

export interface PopupAnchorRect {
  top: number
  left: number
  right: number
  bottom: number
}

/**
 * 解析下拉层挂载容器：优先表级 getPopupContainer，回退 document.body。
 */
export function resolvePopupContainer(
  tableContext: TableContext,
  triggerNode: HTMLElement | null,
): HTMLElement | string {
  if (!triggerNode || typeof document === 'undefined') {
    return 'body'
  }

  return tableContext.getPopupContainer?.(triggerNode) ?? document.body
}

/**
 * 计算下拉层定位样式（TableHeaderCell / FilterDropdown / SelectionDropdown 共享）。
 *
 * - 挂载 body（或字符串容器）：fixed 定位，按视口宽度决定左右对齐
 * - 挂载自定义容器：absolute 定位，按容器滚动偏移换算
 * - 右侧放不下 minimumWidth 时改为右对齐锚点
 */
export function getPopupPositionStyle(
  anchorRect: PopupAnchorRect,
  container: HTMLElement | string,
  minimumWidth: number,
): Record<string, string> {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth

  if (
    typeof container === 'string' ||
    (typeof document !== 'undefined' && container === document.body)
  ) {
    const overflowRight = anchorRect.left + minimumWidth > viewportWidth
    const style: Record<string, string> = {
      position: 'fixed',
      top: `${anchorRect.bottom + 4}px`,
      zIndex: '1050',
    }

    if (overflowRight) {
      style.right = `${viewportWidth - anchorRect.right}px`
    } else {
      style.left = `${anchorRect.left}px`
    }

    return style
  }

  const containerRect = container.getBoundingClientRect()
  const overflowRight = anchorRect.left - containerRect.left + minimumWidth > container.clientWidth
  const style: Record<string, string> = {
    position: 'absolute',
    top: `${anchorRect.bottom - containerRect.top + container.scrollTop + 4}px`,
    zIndex: '1050',
  }

  if (overflowRight) {
    style.right = `${containerRect.right - anchorRect.right + container.scrollLeft}px`
  } else {
    style.left = `${anchorRect.left - containerRect.left + container.scrollLeft}px`
  }

  return style
}
