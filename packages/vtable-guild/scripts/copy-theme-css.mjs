import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const sourceDir = resolve(packageRoot, '../theme/css')
const distTargetDir = resolve(packageRoot, 'dist/css')
const packageTargetDir = resolve(packageRoot, 'css')

function toPosixPath(path) {
  return path.replaceAll('\\', '/')
}

function rewriteTokensSource(tokensPath, sourceDirectives) {
  const original = readFileSync(tokensPath, 'utf8')
  const normalized = original.replace(
    /^\uFEFF?(@source.*\r?\n)+/,
    `${sourceDirectives.join('\n')}\n\n`,
  )
  writeFileSync(tokensPath, normalized)
}

function readRuntimeCss(targetDir) {
  return readFileSync(resolve(targetDir, 'index.css'), 'utf8')
    .replace(/^@import\s+['"].+?['"];\r?\n/gm, '')
    .trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removePlaceholderUtilityRules(css) {
  return css.replace(/(?:^|\n)[^{}]*\{[^{}]*(?:\.\.\.|var\(\.\.\.\))[^{}]*\}\n?/g, '\n')
}

function addTwVariableFallbacks(css) {
  const fallbacks = {
    '--tw-border-spacing-x': '0',
    '--tw-border-spacing-y': '0',
    '--tw-translate-x': '0',
    '--tw-translate-y': '0',
    '--tw-rotate': '0',
    '--tw-skew-x': '0',
    '--tw-skew-y': '0',
    '--tw-scale-x': '1',
    '--tw-scale-y': '1',
    '--tw-pan-x': ' ',
    '--tw-pan-y': ' ',
    '--tw-pinch-zoom': ' ',
    '--tw-ordinal': ' ',
    '--tw-slashed-zero': ' ',
    '--tw-numeric-figure': ' ',
    '--tw-numeric-spacing': ' ',
    '--tw-numeric-fraction': ' ',
    '--tw-ring-inset': ' ',
    '--tw-ring-offset-width': '0px',
    '--tw-ring-offset-color': '#fff',
    '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
    '--tw-ring-offset-shadow': '0 0 #0000',
    '--tw-ring-shadow': '0 0 #0000',
    '--tw-shadow': '0 0 #0000',
    '--tw-shadow-colored': '0 0 #0000',
    '--tw-blur': ' ',
    '--tw-brightness': ' ',
    '--tw-contrast': ' ',
    '--tw-grayscale': ' ',
    '--tw-hue-rotate': ' ',
    '--tw-invert': ' ',
    '--tw-saturate': ' ',
    '--tw-sepia': ' ',
    '--tw-drop-shadow': ' ',
    '--tw-backdrop-blur': ' ',
    '--tw-backdrop-brightness': ' ',
    '--tw-backdrop-contrast': ' ',
    '--tw-backdrop-grayscale': ' ',
    '--tw-backdrop-hue-rotate': ' ',
    '--tw-backdrop-invert': ' ',
    '--tw-backdrop-opacity': ' ',
    '--tw-backdrop-saturate': ' ',
    '--tw-backdrop-sepia': ' ',
    '--tw-content': "''",
  }

  let result = css

  for (const [variable, fallback] of Object.entries(fallbacks)) {
    result = result.replace(
      new RegExp(`var\\(${escapeRegExp(variable)}\\)`, 'g'),
      `var(${variable}, ${fallback})`,
    )
  }

  return result
}

function appendDeclarationIfMissing(body, property, declaration) {
  if (body.includes(`${property}:`)) return body
  const indent = body.match(/\n(\s*)[^\n]+/)?.[1] ?? '    '
  const trimmedBody = body.replace(/\s*$/, '')
  const separator = trimmedBody.endsWith(';') ? '' : ';'

  return `${trimmedBody}${separator}\n${indent}${declaration}`
}

function addBorderStyleUtilities(css) {
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    let nextBody = body

    if (/\bborder-width\s*:/.test(nextBody)) {
      nextBody = appendDeclarationIfMissing(nextBody, 'border-style', 'border-style: solid')
    }

    const sideDeclarations = [
      ['border-top-width', 'border-top-style', 'border-top-style: solid'],
      ['border-right-width', 'border-right-style', 'border-right-style: solid'],
      ['border-bottom-width', 'border-bottom-style', 'border-bottom-style: solid'],
      ['border-left-width', 'border-left-style', 'border-left-style: solid'],
    ]

    for (const [widthProperty, styleProperty, declaration] of sideDeclarations) {
      if (nextBody.includes(`${widthProperty}:`)) {
        nextBody = appendDeclarationIfMissing(nextBody, styleProperty, declaration)
      }
    }

    if (nextBody === body) return match
    return `${selector}{${nextBody}\n}`
  })
}

function postprocessTailwind3Utilities(css) {
  return addBorderStyleUtilities(addTwVariableFallbacks(removePlaceholderUtilityRules(css))).trim()
}

async function buildTailwind3Utilities() {
  const [{ default: postcss }, { default: tailwindcss }] = await Promise.all([
    import('postcss'),
    import('tailwindcss3'),
  ])

  const content = [
    resolve(packageRoot, 'dist/**/*.{js,mjs}'),
    resolve(packageRoot, 'src/**/*.{ts,tsx,js,jsx,vue}'),
    resolve(packageRoot, '../core/dist/**/*.{js,mjs}'),
    resolve(packageRoot, '../core/src/**/*.{ts,tsx,js,jsx,vue}'),
    resolve(packageRoot, '../icons/dist/**/*.{js,mjs}'),
    resolve(packageRoot, '../icons/src/**/*.{ts,tsx,js,jsx,vue}'),
    resolve(packageRoot, '../table/dist/**/*.{js,mjs}'),
    resolve(packageRoot, '../table/src/**/*.{ts,tsx,js,jsx,vue}'),
    resolve(packageRoot, '../theme/dist/**/*.{js,mjs}'),
    resolve(packageRoot, '../theme/src/**/*.{ts,tsx,js,jsx,vue}'),
  ].map(toPosixPath)

  const config = {
    content,
    corePlugins: {
      preflight: false,
    },
    theme: {
      extend: {
        colors: {
          surface: 'var(--color-surface)',
          'surface-hover': 'var(--color-surface-hover)',
          elevated: 'var(--color-elevated)',
          'on-surface': 'var(--color-on-surface)',
          muted: 'var(--color-muted)',
          default: 'var(--color-default)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'text-disabled': 'var(--color-text-disabled)',
          'control-item-hover-bg': 'var(--color-control-item-hover-bg)',
          'control-item-active-bg': 'var(--color-control-item-active-bg)',
          'control-item-active-hover-bg': 'var(--color-control-item-active-hover-bg)',
        },
      },
    },
  }

  const result = await postcss([tailwindcss(config)]).process('@tailwind utilities;', {
    from: undefined,
  })

  return postprocessTailwind3Utilities(result.css.trim())
}

async function writeTailwind3Css(targetDir) {
  const utilitiesCss = await buildTailwind3Utilities()
  const tailwind3Css = [
    '/* @vtable-guild/vtable-guild/css/tailwind3 - Tailwind CSS 3 compatibility entry. */',
    readFileSync(resolve(targetDir, 'presets/antdv.css'), 'utf8').trim(),
    readFileSync(resolve(targetDir, 'presets/element-plus.css'), 'utf8').trim(),
    readFileSync(resolve(targetDir, 'transitions.css'), 'utf8').trim(),
    readRuntimeCss(targetDir),
    utilitiesCss,
  ]
    .filter(Boolean)
    .join('\n\n')

  writeFileSync(resolve(targetDir, 'tailwind3.css'), tailwind3Css)
  writeFileSync(resolve(targetDir, 'tailwind3-utilities.css'), utilitiesCss)
}

function writeCssTypeDeclarations(targetDir) {
  const declaration = 'declare const href: string\n\nexport default href\n'
  const files = [
    'index.d.ts',
    'tokens.d.ts',
    'transitions.d.ts',
    'tailwind3.d.ts',
    'tailwind3-utilities.d.ts',
    'presets/antdv.d.ts',
    'presets/element-plus.d.ts',
  ]

  for (const file of files) {
    writeFileSync(resolve(targetDir, file), declaration)
  }
}

for (const targetDir of [distTargetDir, packageTargetDir]) {
  rmSync(targetDir, { force: true, recursive: true })
  mkdirSync(targetDir, { recursive: true })
  cpSync(sourceDir, targetDir, { recursive: true })
}

// dist/css is used by local workspace links and legacy paths.
// Relative paths resolve from packages/vtable-guild/dist/css/tokens.css —
// `..` = packages/vtable-guild/dist, `../..` = packages/vtable-guild,
// `../../..` = packages/.
rewriteTokensSource(resolve(distTargetDir, 'tokens.css'), [
  "@source '../index.d.ts';",
  "@source '../index.mjs';",
  "@source '../../../theme/dist';",
  "@source '../../../core/dist';",
  "@source '../../../table/dist';",
  "@source '../../../icons/dist';",
  "@source '../../src';",
  "@source '../../../theme/src';",
  "@source '../../../core/src';",
  "@source '../../../table/src';",
  "@source '../../../icons/src';",
])

// css/ is the published css export target.
// Relative paths resolve from packages/vtable-guild/css/tokens.css —
// `..` = packages/vtable-guild, `../..` = packages/.
rewriteTokensSource(resolve(packageTargetDir, 'tokens.css'), [
  "@source '../dist';",
  "@source '../../theme/dist';",
  "@source '../../core/dist';",
  "@source '../../table/dist';",
  "@source '../../icons/dist';",
  "@source '../src';",
  "@source '../../theme/src';",
  "@source '../../core/src';",
  "@source '../../table/src';",
  "@source '../../icons/src';",
])

await Promise.all([writeTailwind3Css(distTargetDir), writeTailwind3Css(packageTargetDir)])

for (const targetDir of [distTargetDir, packageTargetDir]) {
  writeCssTypeDeclarations(targetDir)
}
