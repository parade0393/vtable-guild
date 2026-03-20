/* eslint-disable @typescript-eslint/no-explicit-any */
import { shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type CacheMap from '../utils/CacheMap'
import type { Key } from '../interface'

const MAX_TIMES = 10

export default function useScrollTo(
  containerRef: Ref<HTMLElement | undefined>,
  data: Ref<any[]>,
  heights: CacheMap,
  itemHeight: ComputedRef<number | undefined>,
  getKey: (item: any) => Key,
  collectHeight: () => void,
  syncScrollTop: (top: number) => void,
  triggerFlash: () => void,
): [scrollTo: (arg?: number | ScrollConfig | null) => void, getTotalHeight: () => number] {
  const syncState = shallowRef<{
    times: number
    index: number
    offset: number
    originAlign?: 'top' | 'bottom' | 'auto'
    targetAlign?: 'top' | 'bottom' | 'auto' | null
    lastTop?: number | null
  } | null>(null)

  const getTotalHeight = () => {
    let totalHeight = 0
    for (let i = 0; i < data.value.length; i += 1) {
      const key = getKey(data.value[i])
      const cacheHeight = heights.get(key)
      totalHeight += cacheHeight === undefined ? (itemHeight.value ?? 0) : cacheHeight
    }
    return totalHeight
  }

  watch(
    syncState,
    () => {
      if (syncState.value && syncState.value.times < MAX_TIMES) {
        if (!containerRef.value) {
          syncState.value = { ...syncState.value }
          return
        }

        collectHeight()

        const { targetAlign, originAlign, index, offset } = syncState.value
        const height = containerRef.value.clientHeight
        let needCollectHeight = false
        let newTargetAlign = targetAlign ?? null
        let targetTop: number | null = null

        if (height) {
          const mergedAlign = targetAlign || originAlign

          let stackTop = 0
          let itemTop = 0
          let itemBottom = 0
          const maxLen = Math.min(data.value.length - 1, index)

          for (let i = 0; i <= maxLen; i += 1) {
            const key = getKey(data.value[i])
            itemTop = stackTop
            const cacheHeight = heights.get(key)
            itemBottom =
              itemTop + (cacheHeight === undefined ? (itemHeight.value ?? 0) : cacheHeight)
            stackTop = itemBottom
          }

          let leftHeight = mergedAlign === 'top' ? offset : height - offset
          for (let i = maxLen; i >= 0; i -= 1) {
            const key = getKey(data.value[i])
            const cacheHeight = heights.get(key)
            if (cacheHeight === undefined) {
              needCollectHeight = true
              break
            }
            leftHeight -= cacheHeight
            if (leftHeight <= 0) break
          }

          switch (mergedAlign) {
            case 'top':
              targetTop = itemTop - offset
              break
            case 'bottom':
              targetTop = itemBottom - height + offset
              break
            default: {
              const { scrollTop } = containerRef.value
              const scrollBottom = scrollTop + height
              if (itemTop < scrollTop) newTargetAlign = 'top'
              else if (itemBottom > scrollBottom) newTargetAlign = 'bottom'
            }
          }

          if (targetTop !== null) syncScrollTop(targetTop)
          if (targetTop !== syncState.value.lastTop) needCollectHeight = true
        }

        if (needCollectHeight) {
          syncState.value = {
            ...syncState.value,
            times: syncState.value.times + 1,
            targetAlign: newTargetAlign,
            lastTop: targetTop,
          }
        }
      }
    },
    { immediate: true, flush: 'post' },
  )

  const scrollTo = (arg?: number | ScrollConfig | null) => {
    if (arg === null || arg === undefined) {
      triggerFlash()
      return
    }

    if (typeof arg === 'number') {
      syncScrollTop(arg)
    } else if (arg && typeof arg === 'object') {
      let index: number

      const { align } = arg

      if ('index' in arg) {
        index = arg.index!
      } else {
        index = data.value.findIndex((item) => getKey(item) === arg.key)
      }

      const { offset = 0 } = arg

      syncState.value = {
        times: 0,
        index,
        offset,
        originAlign: align,
      }
    }
  }

  return [scrollTo, getTotalHeight]
}

export interface ScrollConfig {
  index?: number
  key?: Key
  align?: 'top' | 'bottom' | 'auto'
  offset?: number
  left?: number
  top?: number
}
