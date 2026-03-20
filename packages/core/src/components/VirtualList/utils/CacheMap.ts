import { shallowRef } from 'vue'
import type { Key } from '../interface'

export default class CacheMap {
  maps: Record<string, number>
  id = shallowRef(0)
  private diffRecords = new Map<Key, number | undefined>()

  constructor() {
    this.maps = Object.create(null)
  }

  set(key: Key, value: number) {
    this.diffRecords.set(key, this.maps[key as string])
    this.maps[key as string] = value
    this.id.value += 1
  }

  get(key: Key): number | undefined {
    return this.maps[key as string]
  }

  resetRecord() {
    this.diffRecords.clear()
  }

  getRecord() {
    return this.diffRecords
  }
}
