import { Comment, Fragment, type VNodeChild } from 'vue'

function isValidVNode(node: VNodeChild): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') return false
  if (Array.isArray(node)) return node.some(isValidVNode)
  if (typeof node === 'object' && 'type' in node) {
    if (node.type === Comment) return false
    if (node.type === Fragment) return isValidVNode(node.children as VNodeChild)
    return true
  }
  return true
}

export function ensureValidVNode(nodes: VNodeChild): VNodeChild | null {
  if (Array.isArray(nodes)) {
    return nodes.some(isValidVNode) ? nodes : null
  }
  return isValidVNode(nodes) ? nodes : null
}
