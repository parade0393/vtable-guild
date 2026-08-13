/**
 * 文档与实现的机械一致性检查。
 *
 * 这里只覆盖「能靠字符串比对判定」的对应关系：slot key、CSS token、props 字段、
 * 版本号与计数。行为性描述、性能数字、竞品声明不在范围内——那些需要人读代码或外部资料。
 *
 * 设计要点：所有提取都是对源码做正则，正则一旦被重构打断会静默返回空集，
 * 那样检查会「全绿但什么都没查」。所以每个提取步骤都带一条下限断言（EXPECT_AT_LEAST），
 * 解析器坏掉时先在这里炸掉，而不是放行。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** 从 cwd 向上找到 workspace 根，不依赖 import.meta.url（happy-dom 下它不是 file: URL） */
function findRoot(): string {
  let dir = process.cwd()
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error('找不到 workspace 根（pnpm-workspace.yaml）')
    dir = parent
  }
}

const ROOT = findRoot()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/** 解析器健全性下限：低于这个数说明正则没匹配上，而不是代码真的变少了 */
const EXPECT_AT_LEAST = {
  slots: 80,
  tableProps: 30,
  cssTokens: 25,
}

function walk(dir: string, filter: (p: string) => boolean): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const rel = `${dir}/${entry}`
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...walk(rel, filter))
    else if (filter(rel)) out.push(rel)
  }
  return out
}

/** 取出 markdown 中 `## 起始标题` 到下一个同级标题之间的内容 */
function section(md: string, heading: string): string {
  const start = md.indexOf(`## ${heading}`)
  if (start === -1) throw new Error(`找不到章节：## ${heading}`)
  const rest = md.slice(start + heading.length)
  const end = rest.search(/\n## /)
  return end === -1 ? rest : rest.slice(0, end)
}

/** 取出 markdown 表格里每行第一个单元格中被反引号包住的名字 */
function tableKeys(md: string): Set<string> {
  return new Set([...md.matchAll(/^\|\s*`([a-zA-Z0-9-]+)`/gm)].map((m) => m[1]))
}

/** 从主题源码里取 slots 对象的一级 key（大括号配平，不靠缩进猜边界） */
function themeSlotKeys(file: string): string[] {
  const src = read(file)
  const start = src.indexOf('slots: {')
  if (start === -1) throw new Error(`${file} 里找不到 slots 定义`)
  let depth = 0
  let end = -1
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) {
      end = i
      break
    }
  }
  if (end === -1) throw new Error(`${file} 的 slots 大括号没配平`)
  return [...src.slice(start, end).matchAll(/^ {4}([a-zA-Z][a-zA-Z0-9]*):/gm)].map((m) => m[1])
}

function diff(a: Iterable<string>, b: Set<string>): string[] {
  return [...a].filter((k) => !b.has(k)).sort()
}

describe('theme slot 与 ui Slot 参考', () => {
  const antdv = themeSlotKeys('packages/theme/src/presets/antdv/table.ts')
  const elementPlus = themeSlotKeys('packages/theme/src/presets/element-plus/table.ts')

  it('解析器有效', () => {
    expect(antdv.length).toBeGreaterThanOrEqual(EXPECT_AT_LEAST.slots)
  })

  it('两套 preset 的 slot key 完全一致', () => {
    // TableSlots 类型从 antdv 推导，preset 之间缺 key 会导致切预设掉样式
    expect(diff(antdv, new Set(elementPlus))).toEqual([])
    expect(diff(elementPlus, new Set(antdv))).toEqual([])
  })

  it('每个 slot 都写进了 ui-slots-reference', () => {
    const documented = tableKeys(
      section(read('site/guide/ui-slots-reference.md'), '完整 Slot 列表'),
    )
    expect(diff(antdv, documented)).toEqual([])
  })

  it('文档里没有已经不存在的 slot', () => {
    const documented = tableKeys(
      section(read('site/guide/ui-slots-reference.md'), '完整 Slot 列表'),
    )
    expect(diff(documented, new Set(antdv))).toEqual([])
  })
})

describe('CSS token 与 Table CSS 变量参考', () => {
  const cssFiles = [
    'packages/theme/css/tokens.css',
    'packages/theme/css/index.css',
    'packages/theme/css/presets/antdv.css',
    'packages/theme/css/presets/element-plus.css',
  ]
  const declared = new Set(
    cssFiles.flatMap((f) =>
      [...read(f).matchAll(/^\s*(--vtg-table-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
    ),
  )

  // 主题源码里 var(--x) 是消费，[--x:value] 是就地定义（Tailwind 任意属性语法）。
  // 只有前者算公开 token——后者是实现细节，用户覆盖不到。
  const themeSrc = walk('packages/theme/src', (p) => p.endsWith('.ts'))
    .map(read)
    .join('\n')
  const consumed = new Set(
    [...themeSrc.matchAll(/var\((--vtg-table-[a-z0-9-]+)/g)].map((m) => m[1]),
  )
  const definedInline = new Set(
    [...themeSrc.matchAll(/\[(--vtg-table-[a-z0-9-]+):/g)].map((m) => m[1]),
  )

  // 公开 token = CSS 里声明的 ∪ 仅带 fallback 消费的（如 --vtg-table-expanded-row-bg）
  const publicTokens = new Set([...declared, ...[...consumed].filter((t) => !definedInline.has(t))])
  const documented = new Set(
    [...read('site/guide/theme-tokens.md').matchAll(/`(--vtg-table-[a-z0-9-]+)`/g)].map(
      (m) => m[1],
    ),
  )

  it('解析器有效', () => {
    expect(declared.size).toBeGreaterThanOrEqual(EXPECT_AT_LEAST.cssTokens)
  })

  it('每个公开 token 都写进了 theme-tokens', () => {
    expect(diff(publicTokens, documented)).toEqual([])
  })

  it('文档里没有已经不存在的 token', () => {
    expect(diff(documented, publicTokens)).toEqual([])
  })
})

describe('TableProps 与 API Reference', () => {
  const src = read('packages/table/src/types/table.ts')
  const start = src.indexOf('export interface TableProps<')
  const body = src.slice(start, src.indexOf('\n}', start))
  // 顶层字段固定 2 空格缩进；嵌套类型的行缩进更深，不会误命中
  const props = [...body.matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*)\??:/gm)].map((m) => m[1])

  const documented = tableKeys(section(read('site/guide/api-reference.md'), 'VTable Props'))

  it('解析器有效', () => {
    expect(props.length).toBeGreaterThanOrEqual(EXPECT_AT_LEAST.tableProps)
  })

  it('每个 prop 都写进了 API Reference 的 props 表', () => {
    expect(diff(props, documented)).toEqual([])
  })

  it('props 表里没有已经不存在的 prop', () => {
    expect(diff(documented, new Set(props))).toEqual([])
  })
})

describe('roadmap 的版本号与计数', () => {
  const roadmap = read('docs/roadmap.md')

  it('发布版本与 vtable-guild package.json 一致', () => {
    const pkg = JSON.parse(read('packages/vtable-guild/package.json')) as { version: string }
    const declared = roadmap.match(/@vtable-guild\/vtable-guild@([\d.]+)/)?.[1]
    expect(declared).toBe(pkg.version)
  })

  it('测试与基准文件数一致', () => {
    const actual = walk('packages', (p) => /\.(test|bench|spec|typecheck)\.ts$/.test(p)).length
    const declared = Number(roadmap.match(/(\d+)\s*个测试与基准文件/)?.[1])
    expect(declared).toBe(actual)
  })

  it('文档站页面数与 demo 数一致', () => {
    const pages =
      walk('site/guide', (p) => p.endsWith('.md')).length +
      walk('site/comparison', (p) => p.endsWith('.md')).length +
      1 // site/index.md
    const demos = walk('site/demos', (p) => p.endsWith('.vue')).length
    const m = roadmap.match(/(\d+)\s*个页面\s*\+\s*(\d+)\s*个可交互 demo/)
    expect(Number(m?.[1])).toBe(pages)
    expect(Number(m?.[2])).toBe(demos)
  })
})
