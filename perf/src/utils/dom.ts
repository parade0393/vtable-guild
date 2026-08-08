/**
 * 找到被测表格的可滚动容器。
 *
 * 三家的内部结构完全不同（vtable-guild 的 VirtualList holder、antdv 的
 * `.ant-table-body`、el-table-v2 的 grid 容器），但滚动动作必须是**同一个
 * DOM 操作**才谈得上对照，所以这里用结构无关的方式找：第一个真正能滚的
 * 后代元素。三家因此都走 `el.scrollTop = ...`，不使用各自的 scrollTo API。
 */
export function findScroller(host: Element | null): HTMLElement | null {
  if (!host) return null
  const candidates = host.querySelectorAll<HTMLElement>('div')
  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight + 4) {
      const overflow = getComputedStyle(el).overflowY
      if (overflow === 'auto' || overflow === 'scroll') return el
    }
  }
  // 兜底：不看 overflow，只看能不能滚。
  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight + 4) return el
  }
  return null
}

/** 量一行的实际高度——校准公平性契约用，三家必须一致。 */
export function measureRowHeight(host: Element | null, rowSelector: string): number | null {
  if (!host) return null
  const rows = host.querySelectorAll<HTMLElement>(rowSelector)
  const first = rows[0]
  if (!first) return null
  const second = rows[1]
  if (!second) return first.getBoundingClientRect().height
  // 用相邻两行的 top 差值，避免 border-collapse 把边框算进/漏出高度。
  const delta = Math.abs(second.getBoundingClientRect().top - first.getBoundingClientRect().top)
  return delta > 0 ? delta : first.getBoundingClientRect().height
}

/**
 * 数首个可见行里实际渲染了多少个单元格，即「可视列数」。
 *
 * 宽表档的核心判据：等于列数 = 没有横向虚拟化，明显小于列数 = 列也被虚拟化了。
 *
 * 用「行元素的直接子节点数」而不是各家的单元格选择器——各家的类名完全不同
 * （`td` / `.ant-table-cell` / `.el-table-v2__row-cell` / `.vxe-body--column`），
 * 但单元格都是行元素的直接子节点，数子节点是唯一跨库都成立的口径。
 */
export function countRenderedColumns(host: Element | null, rowSelector: string): number {
  if (!host) return 0
  const first = host.querySelector<HTMLElement>(rowSelector)
  return first ? first.childElementCount : 0
}
