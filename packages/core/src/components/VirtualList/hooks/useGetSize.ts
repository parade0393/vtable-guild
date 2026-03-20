/* eslint-disable @typescript-eslint/no-explicit-any */
import { watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type CacheMap from '../utils/CacheMap'
import type { GetSize, Key } from '../interface'

export function useGetSize(
  mergedData: Ref<any[]>,
  getKey: (item: any) => Key,
  heights: CacheMap,
  itemHeight: ComputedRef<number | undefined>,
): GetSize {
  let key2Index = new Map<Key, number>()
  let bottomList: number[] = []

  watch([mergedData, () => heights.id.value, itemHeight], () => {
    key2Index = new Map()
    bottomList = []
  })

  const getSize: GetSize = (startKey, endKey = startKey) => {
    let startIndex = key2Index.get(startKey)
    let endIndex = key2Index.get(endKey)

    if (startIndex === undefined || endIndex === undefined) {
      const dataLen = mergedData.value.length

      for (let i = bottomList.length; i < dataLen; i += 1) {
        const item = mergedData.value[i]
        const key = getKey(item)
        key2Index.set(key, i)

        const cacheHeight = heights.get(key) ?? itemHeight.value ?? 0
        bottomList[i] = (bottomList[i - 1] || 0) + cacheHeight

        if (key === startKey) startIndex = i
        if (key === endKey) endIndex = i
        if (startIndex !== undefined && endIndex !== undefined) break
      }
    }

    return {
      top: bottomList[(startIndex ?? 0) - 1] || 0,
      bottom: bottomList[endIndex ?? 0],
    }
  }

  return getSize
}
