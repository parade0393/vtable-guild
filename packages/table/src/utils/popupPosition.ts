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
 * - 传入实测 popupHeight 时，底部空间不足则向上展开，并限制可用高度
 */
export function getPopupPositionStyle(
  anchorRect: PopupAnchorRect,
  container: HTMLElement | string,
  minimumWidth: number,
  popupHeight?: number,
): Record<string, string> {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
  const below = Math.max(0, viewportHeight - anchorRect.bottom - 4)
  const above = Math.max(0, anchorRect.top - 4)
  const flip = popupHeight !== undefined && popupHeight > below && above > below
  const height = Math.min(popupHeight ?? 0, flip ? above : below)
  const top = flip ? anchorRect.top - height - 4 : anchorRect.bottom + 4
  const verticalStyle: Record<string, string> =
    popupHeight === undefined
      ? {}
      : {
          maxHeight: `${flip ? above : below}px`,
          transformOrigin: flip ? 'bottom center' : 'top center',
        }

  if (
    typeof container === 'string' ||
    (typeof document !== 'undefined' && container === document.body)
  ) {
    const overflowRight = anchorRect.left + minimumWidth > viewportWidth
    const style: Record<string, string> = {
      position: 'fixed',
      top: `${top}px`,
      zIndex: '1050',
      ...verticalStyle,
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
    top: `${top - containerRect.top + container.scrollTop}px`,
    zIndex: '1050',
    ...verticalStyle,
  }

  if (overflowRight) {
    style.right = `${containerRect.right - anchorRect.right + container.scrollLeft}px`
  } else {
    style.left = `${anchorRect.left - containerRect.left + container.scrollLeft}px`
  }

  return style
}
