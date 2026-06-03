import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dryRun = process.argv.includes('--dry-run')
const rootDir = process.cwd()
const packageDir = resolve(rootDir, 'packages/vtable-guild')
const packageJsonPath = resolve(packageDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const packageSpec = `${packageJson.name}@${packageJson.version}`
const useShell = process.platform === 'win32'

function writeOutput(result) {
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`)
  }
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
}

const viewResult = spawnSync('npm', ['view', packageSpec, 'version', '--json'], {
  cwd: rootDir,
  encoding: 'utf8',
  env: process.env,
  shell: useShell,
})

if (viewResult.status === 0) {
  const publishedVersion = JSON.parse(viewResult.stdout.trim() || 'null')

  if (publishedVersion === packageJson.version) {
    console.log(`${packageSpec} is already published`)
    process.exit(0)
  }
} else {
  const viewOutput = `${viewResult.stdout}\n${viewResult.stderr}`

  if (!viewOutput.includes('E404')) {
    writeOutput(viewResult)
    process.exit(viewResult.status ?? 1)
  }
}

const publishArgs = ['publish', packageDir, '--access', 'public', '--tag', 'latest']

if (dryRun) {
  publishArgs.push('--dry-run')
}

const publishResult = spawnSync('npm', publishArgs, {
  cwd: rootDir,
  encoding: 'utf8',
  env: process.env,
  shell: useShell,
  stdio: 'inherit',
})

if (publishResult.status !== 0) {
  process.exit(publishResult.status ?? 1)
}

if (!dryRun) {
  console.log(`New tag: ${packageSpec}`)
}
