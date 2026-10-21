import { compareVersions, gte, isStableVersion } from './semver'
import { VERSION_REQUEST_TIMEOUT, VTG_PKG } from '@/constants'

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

/**
 * 把「调用方的取消」转接到另一个 controller 上，交出停止转接的函数。
 *
 * 已经 abort 过的 signal 不会再派发 abort 事件，所以要先单独判断一次，
 * 否则调用方在请求发起前就取消时，转接永远接不上。
 */
function forwardAbort(source: AbortSignal | undefined, target: AbortController): () => void {
  if (!source) return () => {}

  const forward = () => target.abort(source.reason)
  if (source.aborted) {
    forward()
  } else {
    source.addEventListener('abort', forward, { once: true })
  }
  return () => source.removeEventListener('abort', forward)
}

/** 每个源独立计时；超时只取消当前请求，调用方的 signal 才取消整个拉取。 */
async function fetchJson<T>(
  url: string,
  signal: AbortSignal | undefined,
  timeout: number,
): Promise<T> {
  signal?.throwIfAborted()
  const controller = new AbortController()
  const stopForwarding = forwardAbort(signal, controller)
  const timer = setTimeout(() => controller.abort(new Error('版本请求超时')), timeout)

  // 即使底层 fetch 不响应 abort，也必须结束等待；计时覆盖响应体读取。
  const cancelled = new Promise<never>((_, reject) => {
    const fail = () => reject(controller.signal.reason ?? new Error('版本请求已取消'))
    if (controller.signal.aborted) fail()
    else controller.signal.addEventListener('abort', fail, { once: true })
  })

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return (await response.json()) as T
      })(),
      cancelled,
    ])
  } finally {
    clearTimeout(timer)
    stopForwarding()
  }
}

/**
 * 按从新到旧返回版本列表。jsDelivr 失败或超时后尝试 npmmirror；
 * timeout 是每个源的上限（整次最多两倍），signal 取消时不再回退。
 */
export async function fetchVersions(
  pkg: string,
  options: {
    minVersion?: string
    stableOnly?: boolean
    signal?: AbortSignal
    timeout?: number
  } = {},
): Promise<string[]> {
  const { minVersion, stableOnly = true, signal, timeout = VERSION_REQUEST_TIMEOUT } = options
  const jsdelivrBase = import.meta.env.VITE_VERSION_JSDELIVR_BASE_URL ?? 'https://data.jsdelivr.com'
  const registryBase =
    import.meta.env.VITE_VERSION_REGISTRY_BASE_URL ?? 'https://registry.npmmirror.com'

  let versions: string[]
  try {
    const data = await fetchJson<JsdelivrPackageResponse>(
      `${jsdelivrBase}/v1/packages/npm/${pkg}`,
      signal,
      timeout,
    )
    versions = (data.versions ?? []).map((item) => item.version)
  } catch (error) {
    if (signal?.aborted) throw error
    const data = await fetchJson<RegistryPackageResponse>(`${registryBase}/${pkg}`, signal, timeout)
    versions = Object.keys(data.versions ?? {})
  }

  return versions
    .filter((version) => (stableOnly ? isStableVersion(version) : true))
    .filter((version) => (minVersion ? gte(version, minVersion) : true))
    .sort((a, b) => compareVersions(b, a))
}
