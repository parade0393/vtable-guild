import { describe, expect, it } from 'vitest'
import { VTG_PKG } from '@/constants'
import { cdnFileUrl } from './cdn'
import { createLanguageResourceLinks } from './languageTools'

// 重现 REPL 的跨 worker 边界，确保 URL 回调不依赖模块变量或闭包。
function inWorker<T>(callback: T): T {
  return new Function(`return ${String(callback)}`)() as T
}

describe('language resource links', () => {
  it.each(['jsdelivr', 'unpkg', 'npmmirror'] as const)(
    'loads the compiler and declarations from %s after serialization',
    (source) => {
      const links = createLanguageResourceLinks(source)
      expect(inWorker(links.typescriptLib!)('5.9.3')).toBe(
        cdnFileUrl(source, 'typescript', '5.9.3', 'lib/typescript.js'),
      )
      expect(inWorker(links.pkgFileTextUrl!)(VTG_PKG, '2.8.1', '/dist/index.d.ts')).toBe(
        cdnFileUrl(source, VTG_PKG, '2.8.1', 'dist/index.d.ts'),
      )
      expect(inWorker(links.pkgLatestVersionUrl!)('vue')).toBe(
        cdnFileUrl(source, 'vue', 'latest', 'package.json'),
      )
      expect(inWorker(links.pkgDirUrl!)(VTG_PKG, '2.8.1', '/dist/')).toBe(
        `https://unpkg.com/${VTG_PKG}@2.8.1/dist/?meta`,
      )
    },
  )

  it('uses local files and directory metadata for the local package only', () => {
    const links = createLanguageResourceLinks('local')
    const base = cdnFileUrl('local', VTG_PKG, '', '')
    expect(inWorker(links.pkgFileTextUrl!)(VTG_PKG, '2.8.1', 'dist/index.d.ts')).toBe(
      `${base}dist/index.d.ts`,
    )
    expect(inWorker(links.pkgDirUrl!)(VTG_PKG, '2.8.1', 'dist/')).toBe(`${base}dist?meta`)
    expect(inWorker(links.pkgDirUrl!)(VTG_PKG, '2.8.1', '')).toBe(`${base}?meta`)
    expect(inWorker(links.pkgLatestVersionUrl!)(VTG_PKG)).toBe(`${base}package.json`)
    expect(inWorker(links.typescriptLib!)('5.9.3')).toBe(
      'https://cdn.jsdelivr.net/npm/typescript@5.9.3/lib/typescript.js',
    )
    expect(inWorker(links.pkgFileTextUrl!)('vue', '3.5.26', 'dist/vue.d.ts')).toBe(
      'https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.d.ts',
    )
  })
})
