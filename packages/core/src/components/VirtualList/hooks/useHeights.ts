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
 * 行高实测值。
 *
 * 不用 `offsetHeight`：它取整，而每行的小数部分会在可视窗口内累加
 * （实测 9 行约 2px），滚到底时表现为最后一行被裁掉一截。位置表存的是
 * Float64，本来就吃得下小数。
 *
 * `getBoundingClientRect()` 带祖先 transform 缩放，缩放下它就不再是布局像素了，
 * 而 `props.height`（来自 `scroll.y`）始终是布局像素——两者混用会把可视区算歪。
 * 所以只在**没有缩放**时取小数高度，有缩放就退回 `offsetHeight`，
 * 保持与视口高度同一坐标系。用宽度判定缩放：未缩放时两边的取整误差不超过 1px。
 */
function measureHeight(el: HTMLElement): number {
  const rect = el.getBoundingClientRect()
  const scaled = Math.abs(rect.width - el.offsetWidth) > 1
  return scaled ? el.offsetHeight : rect.height
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
          const { marginTop, marginBottom } = getComputedStyle(el)
          const marginTopNum = parseNumber(marginTop)
          const marginBottomNum = parseNumber(marginBottom)
          const totalHeight = measureHeight(el) + marginTopNum + marginBottomNum

          // 量到 0 一律当作「没量到」，不写进缓存。
          //
          // 虚拟列表里真正 0 高的行没有意义，0 更可能来自还没布局完、
          // 祖先处于折叠/动画中间态，或干脆是没有布局引擎的环境（jsdom）。
          // 把 0 写进位置表会让 scrollHeight 整体偏小，末尾几行直接落到
          // 可滚动范围之外——正是本文件要避免的失败模式。留空则回落到
          // itemHeight 估算，那只会高估，是安全的一侧。
          if (totalHeight > 0 && heightsRef.get(key) !== totalHeight) {
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
