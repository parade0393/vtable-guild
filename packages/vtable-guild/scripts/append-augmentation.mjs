import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read the augmentation file
const augmentPath = resolve(__dirname, '../src/augment.d.ts')
const augmentContent = readFileSync(augmentPath, 'utf-8')

// Read the main index.d.ts
const indexPath = resolve(__dirname, '../dist/index.d.ts')
const indexContent = readFileSync(indexPath, 'utf-8')

// Append augmentation to index.d.ts
const newContent = indexContent + '\n' + augmentContent

writeFileSync(indexPath, newContent, 'utf-8')

console.log('✓ Module augmentation appended to dist/index.d.ts')
