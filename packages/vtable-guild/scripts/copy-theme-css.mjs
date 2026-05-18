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

  return result.css.trim()
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
