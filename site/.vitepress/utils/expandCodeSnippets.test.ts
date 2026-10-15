import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMarkdownRenderer } from 'vitepress'
import { expandCodeSnippets, extractNamedRegion } from './expandCodeSnippets'

const siteRoot = existsSync(join(process.cwd(), 'guide'))
  ? process.cwd()
  : join(process.cwd(), 'site')

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

describe('plain-text documentation snippets', () => {
  it.each([
    'guide/api-reference',
    'guide/api-wiring-and-slots',
    'guide/column-display',
    'guide/column-resize',
    'guide/editing',
    'guide/expandable-rows',
    'guide/filtering',
    'guide/fixed-columns',
    'guide/getting-started',
    'guide/grouped-and-merged-cells',
    'guide/installation',
    'guide/migration-from-antd',
    'guide/package-consumption',
    'guide/pagination',
    'guide/presets-and-locales',
    'guide/row-drag-sort',
    'guide/selection',
    'guide/sorting',
    'guide/theme-overrides',
    'guide/title-footer-summary',
    'guide/tree-table',
    'guide/ui-slots-reference',
    'guide/virtualization',
    'en/guide/api-reference',
    'en/guide/getting-started',
    'en/guide/pagination',
  ])('keeps declarations available on %s', (page) => {
    const markdown = readFileSync(join(siteRoot, `${page}.md`), 'utf8')
    expect(markdown).toContain('## Type Declarations')
    expect(markdown).toMatch(/::: details/)
    expect(markdown).toContain('<<< @/.vitepress/type-declarations/')
  })

  it('extracts the named region without including adjacent declarations', () => {
    const source = [
      'import type { Other } from "other"',
      '// #region Wanted',
      'export type Wanted = number',
      '// #endregion Wanted',
      '// #region Other',
      'export type Other = string',
      '// #endregion Other',
    ].join('\n')
    expect(extractNamedRegion(source, 'Wanted')).toBe('export type Wanted = number')
  })

  it('rejects missing and unclosed regions instead of publishing incomplete declarations', () => {
    expect(() => extractNamedRegion('// #region Other\n// #endregion', 'Wanted')).toThrow(
      'Missing or unclosed snippet region: Wanted',
    )
    expect(() =>
      extractNamedRegion('// #region Wanted\nexport type Wanted = number', 'Wanted'),
    ).toThrow('Missing or unclosed snippet region: Wanted')
  })

  it('requires matching named end markers supported by VitePress', () => {
    expect(() =>
      extractNamedRegion('// #region Wanted\nexport type Wanted = number\n// #endregion', 'Wanted'),
    ).toThrow('Mismatched snippet region end: Wanted')
    expect(() =>
      extractNamedRegion(
        '// #region Wanted\nexport type Wanted = number\n// #endregion Other',
        'Wanted',
      ),
    ).toThrow('Mismatched snippet region end: Wanted')
  })

  it('expands both complete demo sources and declaration regions', () => {
    const output = expandCodeSnippets(
      '<<< @/demos/pagination/callback.vue\n\n<<< @/.vitepress/type-declarations/table.ts#VTableEventProps',
      siteRoot,
    )
    expect(output).toContain('```vue\n')
    expect(output).toContain("NonNullable<TablePaginationConfig['onChange']>")
    expect(output).toContain('```ts\n')
    expect(output).toContain('export interface VTableEventProps')
    expect(output).toContain('filters: TableFiltersInfo')
    expect(output).not.toContain('<<<')
    expect(output).not.toContain('export interface RowSelection')
  })

  it('renders the same isolated region through the actual VitePress renderer', async () => {
    const markdown = '<<< @/.vitepress/type-declarations/table.ts#VTableEventProps'
    const renderer = await createMarkdownRenderer(siteRoot, {
      highlight: (code) => code.replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    })
    const html = renderer.render(markdown, { path: join(siteRoot, 'guide/pagination.md') })
    expect(html).toContain('export interface VTableEventProps')
    expect(html).toContain('filters: TableFiltersInfo')
    expect(html).not.toContain('export interface RowSelection')
    expect(html).not.toContain('#region')
  })

  it('resolves every source and region referenced by Chinese and English guides', () => {
    const paths = [
      ...markdownFiles(join(siteRoot, 'guide')),
      ...markdownFiles(join(siteRoot, 'en/guide')),
    ]
    for (const path of paths) {
      const markdown = readFileSync(path, 'utf8')
      if (!markdown.includes('<<< @/')) continue
      const output = expandCodeSnippets(markdown, siteRoot)
      expect(output, path).not.toMatch(/^<<<\s+@\//m)
    }
  })
})
