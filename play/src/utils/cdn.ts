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

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return (await response.json()) as T
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

/** jsDelivr data API → npmmirror registry 的两级拉取，signal 取消时不再回退到第二个源 */
async function loadVersionList(
  pkg: string,
  signal: AbortSignal,
  options: { minVersion?: string; stableOnly: boolean },
): Promise<string[]> {
  const { minVersion, stableOnly } = options

  let versions: string[]
  try {
    const data = await fetchJson<JsdelivrPackageResponse>(
      `https://data.jsdelivr.com/v1/packages/npm/${pkg}`,
      signal,
    )
    versions = (data.versions ?? []).map((item) => item.version)
  } catch (error) {
    // 已经取消（卸载 / 重拉 / 超时）就别再打一次 npmmirror 了
    if (signal.aborted) throw error
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

/**
 * 取某个包已发布的版本号列表，按从新到旧排序。
 *
 * 优先用 jsDelivr 的 data API（响应最小）；它不可达时回退到 npmmirror 的
 * registry —— 后者在国内网络下通常还活着，正好是这个 Playground 的目标用户。
 *
 * `signal` 让调用方取消整次拉取（卸载、切换 CDN 后重拉上一次），`timeout` 保证它不会
 * 永久 pending：到点后 abort 掉在途请求，并让返回的 promise 以失败收尾——
 * 只 abort 是不够的，底层请求要是不理 signal，await 的那一端会一直挂着。
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

  const controller = new AbortController()
  const stopForwarding = forwardAbort(signal, controller)
  const timer = setTimeout(() => controller.abort(new Error('版本请求超时')), timeout)

  // controller 一取消就同步 reject 一份，不等底层请求：这是超时真正生效的地方。
  // 和 forwardAbort 一样要先判断一次已取消——事件监听接不上已经发过的 abort。
  const cancelled = new Promise<never>((_, reject) => {
    const fail = () => reject(controller.signal.reason ?? new Error('版本请求已取消'))
    if (controller.signal.aborted) fail()
    else controller.signal.addEventListener('abort', fail, { once: true })
  })

  try {
    return await Promise.race([
      loadVersionList(pkg, controller.signal, { minVersion, stableOnly }),
      cancelled,
    ])
  } finally {
    clearTimeout(timer)
    stopForwarding()
  }
}
