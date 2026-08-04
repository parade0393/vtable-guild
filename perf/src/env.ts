/** 环境披露：数字没有环境就是噪声，这一份会一起进导出的 Markdown。 */

export interface EnvInfo {
  userAgent: string
  hardwareConcurrency: number | null
  deviceMemoryGb: number | null
  devicePixelRatio: number
  viewport: string
  buildMode: string
  isDev: boolean
  crossOriginIsolated: boolean
  versions: typeof __LIB_VERSIONS__
  collectedAt: string
}

export function collectEnv(): EnvInfo {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGb: nav.deviceMemory ?? null,
    devicePixelRatio: window.devicePixelRatio,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    buildMode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated,
    versions: __LIB_VERSIONS__,
    collectedAt: new Date().toISOString(),
  }
}

/** 从 UA 里抽一个简短的浏览器标识，长 UA 全文另外单独展示。 */
export function shortBrowser(ua: string): string {
  const chrome = ua.match(/Chrome\/(\d+)/)
  const edge = ua.match(/Edg\/(\d+)/)
  const firefox = ua.match(/Firefox\/(\d+)/)
  const safari = ua.match(/Version\/(\d+).*Safari/)
  if (edge) return `Edge ${edge[1]}`
  if (chrome) return `Chrome ${chrome[1]}`
  if (firefox) return `Firefox ${firefox[1]}`
  if (safari) return `Safari ${safari[1]}`
  return '未知浏览器'
}

export function shortOs(ua: string): string {
  if (ua.includes('Windows NT 10.0')) return 'Windows 10/11'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS X')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Linux')) return 'Linux'
  return '未知系统'
}
