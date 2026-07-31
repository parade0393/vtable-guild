/**
 * 只比较 x.y.z 数字段，预发布标识（-beta.1 等）一律排到同版本号之后。
 * 够用就好——这里只需要过滤和排序版本下拉。
 */
export function compareVersions(a: string, b: string): number {
  const [aCore = '', aPre = ''] = a.split('-')
  const [bCore = '', bPre = ''] = b.split('-')
  const aParts = aCore.split('.').map(Number)
  const bParts = bCore.split('.').map(Number)

  for (let i = 0; i < 3; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }

  if (aPre === bPre) return 0
  if (!aPre) return 1
  if (!bPre) return -1
  return aPre < bPre ? -1 : 1
}

export function isStableVersion(version: string): boolean {
  return !version.includes('-')
}

export function gte(version: string, min: string): boolean {
  return compareVersions(version, min) >= 0
}
