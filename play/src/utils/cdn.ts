import { compareVersions, gte, isStableVersion } from './semver'
import { VTG_PKG } from '@/constants'

export const CDN_SOURCES = [
  { value: 'jsdelivr', label: 'jsDelivr' },
  { value: 'unpkg', label: 'unpkg' },
  { value: 'npmmirror', label: 'npmmirror（国内）' },
  // dev 专用：指向工作区里刚构建的 packages/vtable-guild（见 vite.config.ts 的
  // localPackagePlugin）。发版前唯一能验证 Playground 的办法。
  ...(import.meta.env.DEV ? ([{ value: 'local', label: '本地构建产物' }] as const) : []),
] as const

export type CdnSource = 'jsdelivr' | 'unpkg' | 'npmmirror' | 'local'

/** local 源只对 vtable-guild 自己有意义，Vue 及编译器仍然走公共 CDN */
const LOCAL_FALLBACK: CdnSource = 'jsdelivr'

/**
 * 拼出 CDN 上某个包内文件的完整地址。
 *
 * 三家的路径形态不一样：jsDelivr / unpkg 是 `<host>/<pkg>@<version>/<file>`，
 * npmmirror 走 registry 的 files 接口 `<host>/<pkg>/<version>/files/<file>`。
 */
export function cdnFileUrl(source: CdnSource, pkg: string, version: string, file: string): string {
  if (source === 'local') {
    if (pkg !== VTG_PKG) return cdnFileUrl(LOCAL_FALLBACK, pkg, version, file)
    return new URL(`${import.meta.env.BASE_URL}local-pkg/${file}`, location.origin).href
  }

  switch (source) {
    case 'unpkg':
      return `https://unpkg.com/${pkg}@${version}/${file}`
    case 'npmmirror':
      return `https://registry.npmmirror.com/${pkg}/${version}/files/${file}`
    case 'jsdelivr':
    default:
      return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${file}`
  }
}

interface JsdelivrPackageResponse {
  tags?: Record<string, string>
  versions?: { version: string }[]
}

interface RegistryPackageResponse {
  'dist-tags'?: Record<string, string>
  versions?: Record<string, unknown>
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/**
 * 取某个包已发布的版本号列表，按从新到旧排序。
 *
 * 优先用 jsDelivr 的 data API（响应最小）；它不可达时回退到 npmmirror 的
 * registry —— 后者在国内网络下通常还活着，正好是这个 Playground 的目标用户。
 */
export async function fetchVersions(
  pkg: string,
  options: { minVersion?: string; stableOnly?: boolean; signal?: AbortSignal } = {},
): Promise<string[]> {
  const { minVersion, stableOnly = true, signal } = options

  let versions: string[]
  try {
    const data = await fetchJson<JsdelivrPackageResponse>(
      `https://data.jsdelivr.com/v1/packages/npm/${pkg}`,
      signal,
    )
    versions = (data.versions ?? []).map((item) => item.version)
  } catch {
    const data = await fetchJson<RegistryPackageResponse>(
      `https://registry.npmmirror.com/${pkg}`,
      signal,
    )
    versions = Object.keys(data.versions ?? {})
  }

  return versions
    .filter((version) => (stableOnly ? isStableVersion(version) : true))
    .filter((version) => (minVersion ? gte(version, minVersion) : true))
    .sort((a, b) => compareVersions(b, a))
}
