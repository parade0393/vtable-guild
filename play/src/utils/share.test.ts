import { afterEach, describe, expect, it } from 'vitest'

import { getDemoSource, takeDemoSourceFromUrl } from './share'

describe('documentation demo links', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('loads a bundled demo by its short id', () => {
    const source = getDemoSource('editing/cell')

    expect(source).toContain('<script setup lang="ts">')
    expect(source).toContain('<VTable')
  })

  it('returns null for an unknown demo id', () => {
    expect(getDemoSource('editing/missing')).toBeNull()
  })

  it('consumes the demo id without removing the repl share hash', () => {
    window.history.replaceState({}, '', '/vtable-guild/play/?demo=editing%2Fcell#repl-state')

    const source = takeDemoSourceFromUrl()

    expect(source).toBe(getDemoSource('editing/cell'))
    expect(window.location.pathname).toBe('/vtable-guild/play/')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#repl-state')
  })
})
