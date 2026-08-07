/* eslint-disable @typescript-eslint/no-explicit-any */
import CacheMap from '../utils/CacheMap'
import type { Key } from '../interface'
import { markRaw, onUnmounted, ref } from 'vue'

function parseNumber(value: string): number {
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

function getElement(node: any): HTMLElement | null {
  if (node instanceof HTMLElement) return node
  if (node?.$el instanceof HTMLElement) return node.$el
  return null
}

/**
 * @param disabled 定高快路径开关。返回 true 时**完全不测量**：
 *   不注册 ResizeObserver、不读 offsetHeight/getComputedStyle、不写 CacheMap。
 *   于是 `heights.id` 恒为 0，VirtualList 的可视区计算永远走 O(1) 的估算分支，
 *   不再每次滚动重建整表前缀和。代价是行高必须真的等于声明值（调用方负责校验）。
 */
export default function useHeights(
  getKey: (item: any) => Key,
  onItemAdd?: (item: any) => void,
  onItemRemove?: (item: any) => void,
  disabled?: () => boolean,
): [
  setInstanceRef: (item: any, instance: HTMLElement | null) => void,
  collectHeight: (sync?: boolean) => void,
  heights: CacheMap,
  updatedMark: ReturnType<typeof ref<number>>,
] {
  const updatedMark = ref(0)
  const instanceRef = ref(new Map<Key, HTMLElement | null>())
  const heightsRef = markRaw(new CacheMap())
  const promiseIdRef = ref(0)
  const observedElements = new Map<Key, HTMLElement>()

  const isDisabled = () => disabled?.() === true

  const resizeObserver =
    !isDisabled() && typeof window !== 'undefined' && 'ResizeObserver' in window
      ? new window.ResizeObserver(() => {
          collectHeight()
        })
      : null

  function cancelRaf() {
    promiseIdRef.value += 1
  }

  function collectHeight(sync = false) {
    if (isDisabled()) return
    cancelRaf()

    const doCollect = () => {
      let changed = false
      instanceRef.value.forEach((element, key) => {
        const el = getElement(element)
        if (el && el.offsetParent) {
          const { offsetHeight } = el
          const { marginTop, marginBottom } = getComputedStyle(el)
          const marginTopNum = parseNumber(marginTop)
          const marginBottomNum = parseNumber(marginBottom)
          const totalHeight = offsetHeight + marginTopNum + marginBottomNum

          if (heightsRef.get(key) !== totalHeight) {
            heightsRef.set(key, totalHeight)
            changed = true
          }
        }
      })

      if (changed) updatedMark.value += 1
    }

    if (sync) {
      doCollect()
    } else {
      promiseIdRef.value += 1
      const id = promiseIdRef.value
      Promise.resolve().then(() => {
        if (id === promiseIdRef.value) doCollect()
      })
    }
  }

  function setInstanceRef(item: any, instance: HTMLElement | null) {
    if (isDisabled()) return
    const key = getKey(item)
    const origin = instanceRef.value.get(key)
    if (origin === instance) return

    const prevObserved = observedElements.get(key)
    if (prevObserved && resizeObserver) {
      resizeObserver.unobserve(prevObserved)
      observedElements.delete(key)
    }

    if (instance) {
      instanceRef.value.set(key, instance)
      collectHeight()

      const element = getElement(instance)
      if (element && element.nodeType === 1 && resizeObserver) {
        resizeObserver.observe(element)
        observedElements.set(key, element)
      }
    } else {
      instanceRef.value.delete(key)
    }

    if (!origin !== !instance) {
      if (instance) onItemAdd?.(item)
      else onItemRemove?.(item)
    }
  }

  onUnmounted(() => {
    cancelRaf()
    resizeObserver?.disconnect?.()
    observedElements.clear()
  })

  return [setInstanceRef, collectHeight, heightsRef, updatedMark]
}
