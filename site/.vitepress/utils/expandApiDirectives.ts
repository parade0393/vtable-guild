import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { MarkdownRenderer } from 'vitepress'
import type { ThemeConfig, ThemePresetName } from '@vtable-guild/vtable-guild'
import { featureApi } from '../api-meta/feature-api'
import { referenceApiTables } from '../api-meta/reference-api'
import { referenceApiTablesEn } from '../api-meta/reference-api.en'
import {
  columnFields,
  rowSelectionFields,
  tableEvents,
  tableProps,
  vueSlots,
} from '../api-meta/table'
import {
  tableCssVars,
  themeCssVarGroups,
  themeReferenceTables,
  themeSurfaces,
} from '../api-meta/theme'
import { docFeatures } from '../api-meta/types'
import type {
  ApiEntry,
  CssVarEntry,
  DocFeature,
  DocLang,
  DocTable,
  EventEntry,
  ReferenceApiTable,
  TableApiKind,
  VueSlotEntry,
} from '../api-meta/types'

const PRESETS: readonly ThemePresetName[] = ['antdv', 'element-plus']

const DIRECTIVE = /^<!--[ \t]*@api:[ \t]*([\w-]+)[ \t]+([\w-]+)[ \t]*-->[ \t]*$/gm

const cell = (text: string) => text.replace(/\|/g, '\\|')
const code = (text: string) => `\`${cell(text)}\``
const linkedCode = (text: string, href?: string) => (href ? `[${code(text)}](${href})` : code(text))

function table(headers: DocTable['headers'], rows: DocTable['rows']): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function ofFeature<T extends { features: readonly DocFeature[] }>(
  entries: readonly T[],
  feature: DocFeature,
): T[] {
  return entries.filter((entry) => entry.features.includes(feature))
}

// ---- 语言 ----

const TEXT = {
  zh: {
    props: ['Prop', '类型', '默认值', '说明'],
    fields: ['字段', '类型', '默认值', '说明'],
    events: ['事件', '参数', '说明'],
    slots: ['Slot', '参数类型', '说明'],
    ui: ['Slot', '说明'],
    uiScoped: ['主题配置', 'Slot', '说明'],
    cssVars: ['变量', '作用'],
    notRead: '不读取',
    undeclared: '未声明',
    fallback: (value: string) => `未声明，回退 ${value}`,
  },
  en: {
    props: ['Prop', 'Type', 'Default', 'Description'],
    fields: ['Field', 'Type', 'Default', 'Description'],
    events: ['Event', 'Payload', 'Description'],
    slots: ['Slot', 'Payload type', 'Description'],
    ui: ['Slot', 'Description'],
    uiScoped: ['Theme config', 'Slot', 'Description'],
    cssVars: ['Variable', 'Purpose'],
    notRead: 'not read',
    undeclared: 'undeclared',
    fallback: (value: string) => `undeclared, falls back to ${value}`,
  },
} as const

/** 英文页的站内链接指向英文页面；锚点由各自页面的标题决定，不在这里改写。 */
function localizeHref(href: string | undefined, lang: DocLang): string | undefined {
  return lang === 'en' ? href?.replace(/^\/(guide|comparison)\//, '/en/$1/') : href
}

const describe = (entry: { description: string; descriptionEn: string }, lang: DocLang) =>
  cell(lang === 'en' ? entry.descriptionEn : entry.description)

function apiRow(entry: ApiEntry, lang: DocLang): string[] {
  const fallback = lang === 'en' ? (entry.defaultEn ?? entry.default) : entry.default
  return [
    code(entry.name),
    linkedCode(entry.type, localizeHref(entry.typeHref, lang)),
    fallback ? cell(fallback) : '-',
    describe(entry, lang),
  ]
}

function apiSource<T extends { name: string; features: readonly DocFeature[] }>(
  headers: DocTable['headers'],
  entries: readonly T[],
  format: (entry: T) => string[],
) {
  return {
    headers,
    rows: new Map(entries.map((entry) => [entry.name, format(entry)])),
    namesFor: (feature: DocFeature) => ofFeature(entries, feature).map((entry) => entry.name),
  }
}

/** 一种语言下的全部 API 表：功能页按字段名取行，参考页按表 id 取整表。 */
function buildCatalog(lang: DocLang, tables: Record<string, ReferenceApiTable>) {
  const text = TEXT[lang]
  const sources = {
    props: apiSource(text.props, tableProps, (entry: ApiEntry) => apiRow(entry, lang)),
    columns: apiSource(text.fields, columnFields, (entry: ApiEntry) => apiRow(entry, lang)),
    'row-selection': apiSource(text.fields, rowSelectionFields, (entry: ApiEntry) =>
      apiRow(entry, lang),
    ),
    events: apiSource(text.events, tableEvents, (entry: EventEntry) => [
      code(entry.name),
      code(entry.params),
      describe(entry, lang),
    ]),
    slots: apiSource(text.slots, vueSlots, (entry: VueSlotEntry) => [
      code(entry.name),
      linkedCode(entry.params, localizeHref(entry.paramsHref, lang)),
      describe(entry, lang),
    ]),
  }

  const reference = new Map<string, DocTable>()
  const rowsByKind = new Map<TableApiKind, Map<string, readonly string[]>>()
  for (const [id, table] of Object.entries(tables)) {
    const { headers, rows, kind } = table
    if (!kind) {
      reference.set(id, table)
      continue
    }
    const catalog = rowsByKind.get(kind) ?? new Map<string, readonly string[]>()
    const resolved = rows.map((row) => {
      const name = row[0].replace(/^`|`$/g, '')
      const resolvedRow = row.length === 1 ? sources[kind].rows.get(name) : row
      if (!resolvedRow) throw new Error(`Unknown API field ${name} in ${id} (${lang})`)
      if (catalog.has(name)) throw new Error(`Duplicate API field ${name} in ${kind} (${lang})`)
      catalog.set(name, resolvedRow)
      return resolvedRow
    })
    rowsByKind.set(kind, catalog)
    reference.set(id, { headers, rows: resolved })
  }

  function featureTable(kind: TableApiKind, feature: DocFeature): string | null {
    const source = sources[kind]
    const names = featureApi[feature]?.[kind] ?? source.namesFor(feature)
    if (!names.length) return null
    const rows = names.map((name) => {
      const row = rowsByKind.get(kind)?.get(name)
      if (!row) throw new Error(`Unknown ${kind} field ${name} for ${feature} (${lang})`)
      return row
    })
    return table(source.headers, rows)
  }

  return { reference, featureTable, themeReference: themeReferenceTables(lang) }
}

const catalogs: Record<DocLang, ReturnType<typeof buildCatalog>> = {
  zh: buildCatalog('zh', referenceApiTables),
  en: buildCatalog('en', referenceApiTablesEn),
}

function featureSurfaces(feature: DocFeature) {
  return Object.entries(themeSurfaces).flatMap(([key, surface]) => {
    const slots = Object.entries(surface.slots).filter(([, meta]) =>
      meta.features.includes(feature),
    )
    return slots.length ? [{ key, slots, resolvePreset: surface.resolvePreset }] : []
  })
}

// ---- 预设默认值：直接取预设对象序列化，内容随源码更新 ----

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function quote(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return JSON.stringify(value)
}

function serialize(value: unknown, indent: string): string {
  if (typeof value === 'string') return quote(value)
  if (typeof value !== 'object' || value === null) return String(value)
  const inner = `${indent}  `
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) {
      return `[${value.map((item) => quote(item)).join(', ')}]`
    }
    return `[\n${value.map((item) => `${inner}${serialize(item, inner)},`).join('\n')}\n${indent}]`
  }
  const lines = Object.entries(value).map(
    ([key, item]) =>
      `${inner}${IDENTIFIER.test(key) ? key : quote(key)}: ${serialize(item, inner)},`,
  )
  return `{\n${lines.join('\n')}\n${indent}}`
}

type SlotClassMap = Record<string, string>

function pickSlots(source: SlotClassMap, slots: Set<string>): SlotClassMap {
  return Object.fromEntries(Object.entries(source).filter(([name]) => slots.has(name)))
}

function selectThemeConfig(theme: ThemeConfig, slots: Set<string>): Record<string, unknown> {
  const config: Record<string, unknown> = { slots: pickSlots(theme.slots, slots) }
  const variants: Record<string, Record<string, SlotClassMap>> = {}
  for (const [variant, values] of Object.entries(theme.variants ?? {})) {
    for (const [value, classes] of Object.entries(values)) {
      if (typeof classes === 'string') continue
      const picked = Object.fromEntries(
        Object.entries(pickSlots(classes, slots)).filter(([, classNames]) => classNames),
      )
      if (Object.keys(picked).length) (variants[variant] ??= {})[value] = picked
    }
  }
  if (Object.keys(variants).length) config.variants = variants

  const compoundSlots = theme.compoundSlots?.flatMap((item) => {
    if (!Array.isArray(item.slots)) return []
    const matched = item.slots.filter((name: string) => slots.has(name))
    return matched.length ? [{ ...item, slots: matched }] : []
  })
  if (compoundSlots?.length) config.compoundSlots = compoundSlots

  const defaults = Object.fromEntries(
    Object.entries(theme.defaultVariants ?? {}).filter(
      ([key]) => variants[key] || compoundSlots?.some((item) => key in item),
    ),
  )
  if (Object.keys(defaults).length) config.defaultVariants = defaults
  return config
}

function themeBlock(feature: DocFeature): string | null {
  const surfaces = featureSurfaces(feature)
  if (!surfaces.length) return null
  const blocks = PRESETS.map((preset) => {
    const config = Object.fromEntries(
      surfaces.map(({ key, slots, resolvePreset }) => [
        key,
        selectThemeConfig(resolvePreset(preset), new Set(slots.map(([name]) => name))),
      ]),
    )
    const presetOption = preset === 'antdv' ? '' : `\n  themePreset: '${preset}',`
    return [
      `\`\`\`ts [${preset}]`,
      `createVTableGuild({${presetOption}`,
      `  theme: ${serialize(config, '  ')},`,
      '})',
      '```',
    ].join('\n')
  })
  return ['::: code-group', '', blocks.join('\n\n'), '', ':::'].join('\n')
}

// ---- CSS 变量默认值：解析预设 CSS 的亮色块 ----

const presetCssCache = new Map<string, Map<string, string>>()

export function readPresetCssVars(siteRoot: string, preset: ThemePresetName): Map<string, string> {
  const file = join(siteRoot, '..', 'packages', 'theme', 'css', 'presets', `${preset}.css`)
  const cached = presetCssCache.get(file)
  if (cached) return cached

  const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  // `[data-vtg-preset='x'] {` 是亮色块；`.dark` 块的选择器后面还有类名，不会命中。
  const block = new RegExp(`\\[data-vtg-preset='${preset}'\\]\\s*\\{([^}]*)\\}`).exec(source)
  if (!block) throw new Error(`Missing light block in preset CSS: ${preset}`)
  const vars = new Map<string, string>()
  for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(name, value.replace(/\s+/g, ' ').trim())
  }
  presetCssCache.set(file, vars)
  return vars
}

function cssVarTable(entries: readonly CssVarEntry[], siteRoot: string, lang: DocLang): string {
  const text = TEXT[lang]
  return table(
    [...text.cssVars, ...PRESETS],
    entries.map((entry) => [
      code(entry.name),
      describe(entry, lang),
      ...PRESETS.map((preset) => {
        if (entry.presets && !entry.presets.includes(preset)) return text.notRead
        const value = readPresetCssVars(siteRoot, preset).get(entry.name)
        if (value) return code(value)
        const fallback = entry.presetFallbacks?.[preset] ?? entry.fallback
        return fallback ? text.fallback(code(fallback)) : text.undeclared
      }),
    ]),
  )
}

// ---- 指令 ----

const renderers: Record<
  string,
  (feature: DocFeature, siteRoot: string, lang: DocLang) => string | null
> = {
  props: (feature, _siteRoot, lang) => catalogs[lang].featureTable('props', feature),
  columns: (feature, _siteRoot, lang) => catalogs[lang].featureTable('columns', feature),
  'row-selection': (feature, _siteRoot, lang) =>
    catalogs[lang].featureTable('row-selection', feature),
  events: (feature, _siteRoot, lang) => catalogs[lang].featureTable('events', feature),
  slots: (feature, _siteRoot, lang) => catalogs[lang].featureTable('slots', feature),
  ui: (feature, _siteRoot, lang) => {
    const surfaces = featureSurfaces(feature)
    if (!surfaces.length) return null
    const scoped = surfaces.some(({ key }) => key !== 'table')
    const rows = surfaces.flatMap(({ key, slots }) =>
      slots.map(([name, meta]) => [
        ...(scoped ? [code(`theme.${key}`)] : []),
        code(name),
        describe(meta, lang),
      ]),
    )
    return table(scoped ? TEXT[lang].uiScoped : TEXT[lang].ui, rows)
  },
  theme: themeBlock,
  'css-vars': (feature, siteRoot, lang) => {
    const entries = ofFeature(tableCssVars, feature)
    return entries.length ? cssVarTable(entries, siteRoot, lang) : null
  },
}

const cssReference = new Map<string, readonly CssVarEntry[]>(Object.entries(themeCssVarGroups))

/**
 * 把 `<!-- @api: <kind> <feature> -->` 展开为 markdown。
 *
 * 在 markdown-it 解析前展开，页面、本地搜索与 llms-full.txt 拿到的是同一份内容。
 * 指令写错或没有匹配条目时直接抛错，避免页面上静默缺一张表。
 * `lang` 决定表头与说明的语言；同一条指令在中英文页面里写法相同。
 */
export function expandApiDirectives(body: string, siteRoot: string, lang: DocLang = 'zh'): string {
  return body.replace(DIRECTIVE, (_match, kind: string, feature: string) => {
    if (kind === 'reference' || kind === 'theme-reference') {
      const catalog = catalogs[lang]
      const reference =
        kind === 'reference' ? catalog.reference.get(feature) : catalog.themeReference[feature]
      if (reference) return table(reference.headers, reference.rows)
      const css = kind === 'theme-reference' && cssReference.get(feature)
      if (css) return cssVarTable(css, siteRoot, lang)
      throw new Error(`Unknown @api ${kind} table: ${feature}`)
    }
    if (!Object.prototype.hasOwnProperty.call(renderers, kind)) {
      throw new Error(`Unknown @api kind: ${kind}`)
    }
    if (!docFeatures.includes(feature as DocFeature)) {
      throw new Error(`Unknown @api feature: ${feature}`)
    }
    const output = renderers[kind](feature as DocFeature, siteRoot, lang)
    if (output === null) throw new Error(`@api: ${kind} ${feature} has no entries`)
    return output
  })
}

/** 页面相对路径在 `en/` 下的是英文页。 */
export function docLangOf(relativePath: string | undefined): DocLang {
  return relativePath?.replace(/\\/g, '/').startsWith('en/') ? 'en' : 'zh'
}

/**
 * `markdown.config` 钩子。包一层 parse 而不是写 block rule：本地搜索索引同样走
 * md.render → md.parse，生成的表格与页面内容一致，也能被搜到。
 */
export function apiDirectivesPlugin(siteRoot: string) {
  return (md: MarkdownRenderer) => {
    const parse = md.parse.bind(md)
    md.parse = (src, env) =>
      parse(expandApiDirectives(src, siteRoot, docLangOf(env?.relativePath)), env)
  }
}
