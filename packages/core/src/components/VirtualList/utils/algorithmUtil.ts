import type { Key } from '../interface'

export function getIndexByStartLoc(min: number, max: number, start: number, index: number): number {
  const beforeCount = start - min
  const afterCount = max - start

  if (index <= Math.min(beforeCount, afterCount) * 2) {
    const stepIndex = Math.floor(index / 2)
    if (index % 2) return start + stepIndex + 1
    return start - stepIndex
  }

  if (beforeCount > afterCount) return start - (index - afterCount)
  return start + (index - beforeCount)
}

export function findListDiffIndex<T>(
  originList: T[],
  targetList: T[],
  getKey: (item: T) => Key,
): { index: number; multiple: boolean } | null {
  const originLen = originList.length
  const targetLen = targetList.length

  let shortList: T[]
  let longList: T[]

  if (originLen === 0 && targetLen === 0) return null

  if (originLen < targetLen) {
    shortList = originList
    longList = targetList
  } else {
    shortList = targetList
    longList = originList
  }

  const notExistKey = { __EMPTY_ITEM__: true }

  function getItemKey(item: T | undefined) {
    if (item !== undefined) return getKey(item)
    return notExistKey
  }

  let diffIndex: number | null = null
  let multiple = Math.abs(originLen - targetLen) !== 1

  for (let i = 0; i < longList.length; i += 1) {
    const shortKey = getItemKey(shortList[i])
    if (shortKey !== getItemKey(longList[i])) {
      diffIndex = i
      multiple = multiple || shortKey !== getItemKey(longList[i + 1])
      break
    }
  }

  return diffIndex === null ? null : { index: diffIndex, multiple }
}
