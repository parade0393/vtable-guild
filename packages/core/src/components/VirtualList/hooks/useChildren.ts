/* eslint-disable @typescript-eslint/no-explicit-any */
import Item from '../Item'
import { computed, createVNode, isVNode } from 'vue'
import type { CSSProperties, Ref, VNode } from 'vue'
import type { Key } from '../interface'

function _isSlot(s: unknown): s is () => VNode[] {
  return (
    typeof s === 'function' ||
    (Object.prototype.toString.call(s) === '[object Object]' && !isVNode(s))
  )
}

export default function useChildren(
  list: Ref<any[]>,
  startIndex: Ref<number>,
  endIndex: Ref<number>,
  scrollWidth: Ref<number>,
  offsetX: Ref<number>,
  // index 一并传给 setNodeRef：useHeights 要靠它拿绝对下标去求行 key，
  // 否则每次测量都要对整表做一次 indexOf。
  setNodeRef: (item: any, ele: HTMLElement | null, index?: number) => void,
  renderFunc: (
    item: any,
    index: number,
    props: { style: CSSProperties; offsetX: number },
  ) => VNode[] | undefined,
  { getKey }: { getKey: (item: any, index?: number) => Key },
) {
  return computed(() => {
    return list.value.slice(startIndex.value, endIndex.value + 1).map((item, index) => {
      const absoluteIndex = startIndex.value + index
      const node = renderFunc(item, absoluteIndex, {
        style: { width: `${scrollWidth.value}px` },
        offsetX: offsetX.value,
      })
      const key = getKey(item, absoluteIndex)

      return createVNode(
        Item,
        { key, setRef: (ele: HTMLElement | null) => setNodeRef(item, ele, absoluteIndex) },
        // `renderFunc` 返回的已经是 VNode[]，这里**不能再包一层数组**。
        // 包成 [[VNode]] 之后 Vue 的 normalizeSlotValue 会把内层数组转成 Fragment，
        // Item 的 cloneVNode(child, { ref }) 于是把 ref 挂到 Fragment 上——
        // Vue 给 Fragment 的 ref 值是它的起始文本锚点，不是元素节点。
        // useHeights.getElement() 拿到 Text 就返回 null，行高**永远测不到**：
        // heights.id 恒为 0，可视区计算一直走估算分支，scrollHeight 恒等于
        // 行数 × itemHeight。行实际比估算高时，末尾几行落在可滚动范围之外。
        _isSlot(node) ? node : { default: () => node ?? [] },
      )
    })
  })
}
