import { describe, expect, it } from 'vitest'

import { LATEST, MIN_SUPPORTED_VTG_VERSION } from '@/constants'
import { resolveStaleSelection, resolveVersion, toVersionSelection } from './versionSelection'

describe('toVersionSelection', () => {
  it('没存过、存的是 null、存的是哨兵，都归一成跟随最新', () => {
    expect(toVersionSelection(undefined)).toBe(LATEST)
    expect(toVersionSelection(null)).toBe(LATEST)
    expect(toVersionSelection(LATEST)).toBe(LATEST)
  })

  it('存过的具体版本原样保留', () => {
    expect(toVersionSelection('2.5.0')).toBe('2.5.0')
  })
})

describe('resolveVersion', () => {
  const versions = ['2.7.1', '2.6.0', '2.5.0']

  it('跟随最新 → 版本列表第一项，而不是兜底版本', () => {
    // 这条就是「Playground 打开时选中的是旧版本」的回归：默认值必须落到最新版
    expect(resolveVersion(LATEST, versions, MIN_SUPPORTED_VTG_VERSION)).toBe('2.7.1')
  })

  it('跟着最新时，发新版本不用改代码也会自动指向新版本', () => {
    expect(resolveVersion(LATEST, ['2.8.0', '2.7.1'], MIN_SUPPORTED_VTG_VERSION)).toBe('2.8.0')
  })

  it('列表还没回来时退回兜底版本', () => {
    expect(resolveVersion(LATEST, [], MIN_SUPPORTED_VTG_VERSION)).toBe(MIN_SUPPORTED_VTG_VERSION)
  })

  it('钉死的版本无视列表顺序', () => {
    expect(resolveVersion('2.5.0', versions, MIN_SUPPORTED_VTG_VERSION)).toBe('2.5.0')
    expect(resolveVersion('2.4.0', versions, MIN_SUPPORTED_VTG_VERSION)).toBe('2.4.0')
  })
})

describe('resolveStaleSelection', () => {
  const versions = ['2.7.1', '2.6.0']

  it('钉死的版本已经不在列表里时退回跟随最新', () => {
    expect(resolveStaleSelection('1.0.0', versions)).toBe(LATEST)
  })

  it('钉死的版本还在列表里时保持不动', () => {
    expect(resolveStaleSelection('2.6.0', versions)).toBe('2.6.0')
  })

  it('本来就跟着最新时不动', () => {
    expect(resolveStaleSelection(LATEST, versions)).toBe(LATEST)
    expect(resolveStaleSelection(LATEST, [])).toBe(LATEST)
  })
})
