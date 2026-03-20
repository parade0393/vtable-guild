/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneVNode, defineComponent, shallowRef } from 'vue'
import type { PropType, VNode } from 'vue'

function filterEmpty(children: VNode[]): VNode[] {
  return children.filter(
    (child) => child !== null && child !== undefined && typeof child !== 'boolean',
  )
}

export default defineComponent({
  name: 'VirtualItem',
  props: {
    setRef: {
      type: Function as PropType<(element: HTMLElement | null) => void>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const currentElement = shallowRef<HTMLElement | null>(null)

    const refFunc = (node: HTMLElement | null) => {
      if (currentElement.value !== node) {
        currentElement.value = node
        props.setRef(node)
      }
    }

    return () => {
      const child = filterEmpty(slots.default?.() ?? [])[0]
      if (!child) return null
      return cloneVNode(child, { ref: refFunc as any })
    }
  },
})
