import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMarkdownRenderer } from 'vitepress'
import { resolveThemePreset } from '@vtable-guild/vtable-guild'
import {
  columnFields,
  rowSelectionFields,
  tableEvents,
  tableProps,
  vueSlots,
} from '../api-meta/table'
import { tableCssVars, themeSurfaces } from '../api-meta/theme'
import { docFeatures } from '../api-meta/types'
import {
  apiDirectivesPlugin,
  docLangOf,
  expandApiDirectives,
  readPresetCssVars,
} from './expandApiDirectives'

const siteRoot = existsSync(join(process.cwd(), 'guide'))
  ? process.cwd()
  : join(process.cwd(), 'site')

const docs = [...docFeatures, 'api-reference', 'ui-slots-reference', 'theme-tokens']

const CJK = /[一-鿿]/

/** 中文页面清单（相对 site 根）；英文页在 `en/` 下同路径。 */
const pages = [
  'index.md',
  ...['guide', 'comparison'].flatMap((folder) =>
    readdirSync(join(siteRoot, folder))
      .filter((name) => name.endsWith('.md'))
      .map((name) => `${folder}/${name}`),
  ),
]

/** 页面骨架：标题层级、`@api` 指令、示例与代码引用，按出现顺序排列。 */
function outline(markdown: string): string[] {
  const items: string[] = []
  let fence: string | null = null
  for (const line of markdown.split(/\r?\n/)) {
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)
    if (mark) {
      if (!fence) fence = mark[1][0]
      else if (mark[1][0] === fence) fence = null
      continue
    }
    if (fence) continue
    const heading = /^(#{1,6})\s/.exec(line)
    if (heading) items.push(`h${heading[1].length}`)
    else if (/^<!--[ \t]*@api:/.test(line) || /^<<< /.test(line)) items.push(line.trim())
    else if (/^<Demo\b/.test(line)) items.push(line.trim())
  }
  return items
}

describe('API metadata directives', () => {
  it('keeps metadata names unique within each table', () => {
    for (const list of [tableProps, columnFields, rowSelectionFields, tableEvents, vueSlots]) {
      const names = list.map((entry) => entry.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('describes exactly the slots exposed by each theme surface in both presets', () => {
    for (const [surface, { slots, resolvePreset }] of Object.entries(themeSurfaces)) {
      const documented = Object.keys(slots).sort()
      for (const preset of ['antdv', 'element-plus'] as const) {
        expect(Object.keys(resolvePreset(preset).slots).sort(), `${surface} ${preset}`).toEqual(
          documented,
        )
      }
    }
  })

  it('only documents CSS variables that a preset declares or the component falls back from', () => {
    const declared = [
      readPresetCssVars(siteRoot, 'antdv'),
      readPresetCssVars(siteRoot, 'element-plus'),
    ]
    for (const entry of tableCssVars) {
      const isDeclared = declared.some((vars) => vars.has(entry.name))
      expect(isDeclared || Boolean(entry.fallback || entry.presetFallbacks), entry.name).toBe(true)
    }
  })

  it('preserves the verified preset-specific usage of the pilot variables', () => {
    for (const entry of tableCssVars) {
      const inPilot = entry.features.some((feature) =>
        ['sorting', 'filtering', 'selection'].includes(feature),
      )
      if (!entry.presets || !inPilot) continue
      for (const preset of ['antdv', 'element-plus'] as const) {
        const theme = JSON.stringify(resolveThemePreset(preset).table)
        expect(theme.includes(`var(${entry.name}`), `${preset} ${entry.name}`).toBe(
          entry.presets.includes(preset),
        )
      }
    }
  })

  it('expands feature tables and the preset theme defaults', () => {
    const output = expandApiDirectives(
      [
        '<!-- @api: columns sorting -->',
        '<!-- @api: ui sorting -->',
        '<!-- @api: theme sorting -->',
        '<!-- @api: css-vars sorting -->',
      ].join('\n\n'),
      siteRoot,
    )
    expect(output).toContain(
      '| `sorter` | [`ColumnSorter<TRecord>`](/guide/type-reference#columnsorter)',
    )
    expect(output).not.toContain('`filters`')
    expect(output).toContain('| `thSortable` | 可排序列的 `<th>` 附加样式。 |')
    expect(output).toContain('::: code-group')
    expect(output).toContain('```ts [antdv]')
    expect(output).toContain("themePreset: 'element-plus',")
    expect(output).toContain(`thSorted: '${resolveThemePreset('antdv').table.slots.thSorted}',`)
    expect(output).toContain(
      '| `--vtg-table-header-sort-bg` | 已激活排序的列表头背景 | `#f0f0f0` |',
    )
    expect(output).not.toContain('@api')
  })

  it('escapes union pipes so generated cells stay inside their column', () => {
    const output = expandApiDirectives('<!-- @api: columns filtering -->', siteRoot)
    expect(output).toContain("`'menu' \\| 'tree'`")
  })

  it('reports the fallback for variables a preset leaves undeclared', () => {
    const output = expandApiDirectives('<!-- @api: css-vars filtering -->', siteRoot)
    expect(output).toContain('| `--vtg-table-filter-dropdown-max-height` |')
    expect(output).toContain('未声明，回退 `264px`')
    expect(output).toContain('`280px`')
  })

  it('rejects unknown directives and empty tables instead of silently dropping content', () => {
    expect(() => expandApiDirectives('<!-- @api: unknown sorting -->', siteRoot)).toThrow(
      'Unknown @api kind: unknown',
    )
    expect(() => expandApiDirectives('<!-- @api: constructor sorting -->', siteRoot)).toThrow(
      'Unknown @api kind: constructor',
    )
    expect(() => expandApiDirectives('<!-- @api: props unknown -->', siteRoot)).toThrow(
      'Unknown @api feature: unknown',
    )
    expect(() => expandApiDirectives('<!-- @api: row-selection sorting -->', siteRoot)).toThrow(
      '@api: row-selection sorting has no entries',
    )
  })

  it.each(docs)('expands every directive on %s', (page) => {
    const markdown = readFileSync(join(siteRoot, 'guide', `${page}.md`), 'utf8')
    expect(markdown).toContain('<!-- @api:')
    expect(expandApiDirectives(markdown, siteRoot)).not.toContain('<!-- @api:')
  })

  it('uses the same API and token rows in feature guides and full references', () => {
    const expand = (directive: string) =>
      expandApiDirectives(`<!-- @api: ${directive} -->`, siteRoot)
    const sharedRows = [
      ['props pagination', 'reference props-data', 'pagination'],
      ['props sorting', 'reference props-interaction', 'showSorterTooltip'],
      ['ui sorting', 'theme-reference slots-sorting', 'sortAreaWrapper'],
      ['css-vars sorting', 'theme-reference tokens-core', '--vtg-table-header-sort-bg'],
    ]
    for (const [feature, reference, name] of sharedRows) {
      const row = expand(feature)
        .split('\n')
        .find((line) => line.startsWith(`| \`${name}\` |`))
      expect(row, name).toBeDefined()
      expect(expand(reference).split('\n')).toContain(row)
    }
  })

  it('renders English headers, descriptions and page links for English pages', () => {
    const output = expandApiDirectives(
      [
        '<!-- @api: columns sorting -->',
        '<!-- @api: events sorting -->',
        '<!-- @api: ui sorting -->',
        '<!-- @api: css-vars filtering -->',
        '<!-- @api: theme-reference table-variants -->',
      ].join('\n\n'),
      siteRoot,
      'en',
    )
    expect(output).toContain('| Field | Type | Default | Description |')
    expect(output).toContain(
      '| `sorter` | [`ColumnSorter<TRecord>`](/en/guide/type-reference#columnsorter)',
    )
    expect(output).toContain('| Event | Payload | Description |')
    expect(output).toContain('| Slot | Description |')
    expect(output).toContain('| Variable | Purpose | antdv | element-plus |')
    expect(output).toContain('undeclared, falls back to `264px`')
    expect(output).toContain('| Variant | Values | Default | Affected slots |')
    expect(output).not.toMatch(CJK)
  })

  it('keeps the Chinese output when no language is given', () => {
    const directive = '<!-- @api: columns sorting -->'
    expect(expandApiDirectives(directive, siteRoot)).toBe(
      expandApiDirectives(directive, siteRoot, 'zh'),
    )
    expect(expandApiDirectives(directive, siteRoot)).toContain('| 字段 | 类型 | 默认值 | 说明 |')
  })

  it('treats pages under en/ as English', () => {
    expect(docLangOf('en/guide/sorting.md')).toBe('en')
    expect(docLangOf('en\\guide\\sorting.md')).toBe('en')
    expect(docLangOf('guide/sorting.md')).toBe('zh')
    expect(docLangOf('guide/en/sorting.md')).toBe('zh')
    expect(docLangOf(undefined)).toBe('zh')
  })

  it.each(docs)('expands every directive on en/%s without Chinese text', (page) => {
    const markdown = readFileSync(join(siteRoot, 'en', 'guide', `${page}.md`), 'utf8')
    const directives = markdown.match(/^<!--[ \t]*@api:.*-->[ \t]*$/gm) ?? []
    expect(directives.length).toBeGreaterThan(0)
    const output = expandApiDirectives(directives.join('\n\n'), siteRoot, 'en')
    expect(output).not.toContain('<!-- @api:')
    expect(output.split('\n').filter((line) => CJK.test(line))).toEqual([])
  })

  it.each(pages)('en/%s mirrors the structure of the Chinese page', (page) => {
    const zh = readFileSync(join(siteRoot, page), 'utf8')
    const en = readFileSync(join(siteRoot, 'en', page), 'utf8')
    expect(outline(en)).toEqual(outline(zh))
  })

  it('uses the component theme namespace for presets outside VTable', () => {
    const toolbar = expandApiDirectives('<!-- @api: theme toolbar -->', siteRoot)
    expect(toolbar).toContain('    toolbar: {')
    expect(toolbar).toContain('    columnSettings: {')
    expect(toolbar).not.toContain('    table: {')
    const pagination = expandApiDirectives('<!-- @api: theme pagination -->', siteRoot)
    expect(pagination).toContain('    pagination: {')
    expect(pagination).toContain("size: 'default'")
  })

  it('renders directives through the VitePress markdown pipeline', async () => {
    const renderer = await createMarkdownRenderer(siteRoot, {
      config: apiDirectivesPlugin(siteRoot),
    })
    const html = renderer.render('<!-- @api: theme selection -->', {
      path: join(siteRoot, 'guide/selection.md'),
    })
    expect(html).toContain('vp-code-group')
    expect(html).toContain('tdSelected')
    expect(html).not.toContain('@api')

    const english = renderer.render('<!-- @api: ui sorting -->', {
      path: join(siteRoot, 'en/guide/sorting.md'),
      relativePath: 'en/guide/sorting.md',
    })
    expect(english).toContain('<th>Description</th>')
    expect(english).not.toMatch(CJK)
  })
})
