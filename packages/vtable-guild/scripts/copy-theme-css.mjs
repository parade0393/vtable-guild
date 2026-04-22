import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const sourceDir = resolve(packageRoot, '../theme/css')
const distTargetDir = resolve(packageRoot, 'dist/css')
const packageTargetDir = resolve(packageRoot, 'css')

function rewriteTokensSource(tokensPath, sourceDirectives) {
  const original = readFileSync(tokensPath, 'utf8')
  const normalized = original.replace(
    /^\uFEFF?(@source.*\r?\n)+/,
    `${sourceDirectives.join('\n')}\n\n`,
  )
  writeFileSync(tokensPath, normalized)
}

for (const targetDir of [distTargetDir, packageTargetDir]) {
  rmSync(targetDir, { force: true, recursive: true })
  mkdirSync(targetDir, { recursive: true })
  cpSync(sourceDir, targetDir, { recursive: true })
}

// dist/css is used by local workspace links and legacy paths.
rewriteTokensSource(resolve(distTargetDir, 'tokens.css'), [
  "@source '../index.d.ts';",
  "@source '../index.mjs';",
  "@source '../../src';",
  "@source '../../table/src';",
])

// css/ is the published css export target.
rewriteTokensSource(resolve(packageTargetDir, 'tokens.css'), [
  "@source '../dist/index.d.ts';",
  "@source '../dist/index.mjs';",
  "@source '../src';",
  "@source '../../table/src';",
])



