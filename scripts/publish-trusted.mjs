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

function runGit(args) {
  return spawnSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    env: process.env,
  })
}

function localTagExists(tag) {
  return runGit(['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`]).status === 0
}

function remoteTagExists(tag) {
  return runGit(['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/${tag}`]).status === 0
}

function ensureLocalTag(tag) {
  if (localTagExists(tag)) {
    return
  }

  const tagResult = runGit(['tag', tag])

  if (tagResult.status !== 0) {
    writeOutput(tagResult)
    process.exit(tagResult.status ?? 1)
  }
}

function emitChangesetsTag(tag) {
  console.log(`New tag: ${tag}`)
}

function emitReleaseTagIfNeeded() {
  if (remoteTagExists(packageSpec)) {
    console.error(`Tag already exists: ${packageSpec}`)
    return
  }

  ensureLocalTag(packageSpec)
  emitChangesetsTag(packageSpec)
}

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
    if (!dryRun) {
      emitReleaseTagIfNeeded()
    }
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
  emitReleaseTagIfNeeded()
}
