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
  setNodeRef: (item: any, ele: HTMLElement | null) => void,
  renderFunc: (
    item: any,
    index: number,
    props: { style: CSSProperties; offsetX: number },
  ) => VNode[] | undefined,
  { getKey }: { getKey: (item: any) => Key },
) {
  return computed(() => {
    return list.value.slice(startIndex.value, endIndex.value + 1).map((item, index) => {
      const node = renderFunc(item, startIndex.value + index, {
        style: { width: `${scrollWidth.value}px` },
        offsetX: offsetX.value,
      })
      const key = getKey(item)

      return createVNode(
        Item,
        { key, setRef: (ele: HTMLElement | null) => setNodeRef(item, ele) },
        _isSlot(node) ? node : { default: () => [node] },
      )
    })
  })
}
