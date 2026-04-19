import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const sourceDir = resolve(packageRoot, '../theme/css')
const targetDir = resolve(packageRoot, 'dist/css')

rmSync(targetDir, { force: true, recursive: true })
mkdirSync(targetDir, { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })
