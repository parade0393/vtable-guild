import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Keep named declaration snippets available in the plain-text documentation export. */
export function extractNamedRegion(source: string, name: string): string {
  const lines = source.split(/\r?\n/)
  let start = -1
  const regions: string[] = []
  for (let index = 0; index < lines.length; index++) {
    const marker = /^\s*\/\/\s*#(region|endregion)\b\s*(.*)$/.exec(lines[index])
    if (!marker) continue
    if (marker[1] === 'region') {
      if (start === -1 && marker[2].trim() === name) start = index + 1
      if (start !== -1) regions.push(marker[2].trim())
    } else if (start !== -1) {
      // VitePress 1.6 requires a named end marker, including for TS regions.
      if (marker[2].trim() !== regions.pop()) {
        throw new Error(`Mismatched snippet region end: ${name}`)
      }
      if (regions.length === 0) return lines.slice(start, index).join('\n').trim()
    }
  }
  throw new Error(`Missing or unclosed snippet region: ${name}`)
}

export function expandCodeSnippets(body: string, siteRoot: string): string {
  return body.replace(
    /^<<<[ \t]+@\/(demos\/[\w/-]+\.vue|\.vitepress\/type-declarations\/[\w.-]+\.ts)(?:#([\w-]+))?[ \t]*$/gm,
    (_match, path: string, region: string | undefined) => {
      const source = readFileSync(join(siteRoot, path), 'utf8')
      const code = region ? extractNamedRegion(source, region) : source.trim()
      const language = path.endsWith('.vue') ? 'vue' : 'ts'
      return `\`\`\`${language}\n// @/${path}${region ? `#${region}` : ''}\n${code}\n\`\`\``
    },
  )
}
