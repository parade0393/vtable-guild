import { findListDiffIndex } from '../utils/algorithmUtil'
import { shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { Key } from '../interface'

export default function useDiffItem<T>(
  data: Ref<T[]>,
  getKey: (item: T) => Key,
  onDiff?: (index: number) => void,
) {
  const prevData = shallowRef<T[]>(data.value)
  const diffItem = shallowRef<T>()

  watch(
    data,
    (newData) => {
      const diff = findListDiffIndex(prevData.value || [], data.value || [], getKey)
      if (diff?.index !== undefined) {
        onDiff?.(diff.index)
        diffItem.value = newData[diff.index]
      }
      prevData.value = newData
    },
    { immediate: true },
  )

  return diffItem
}
