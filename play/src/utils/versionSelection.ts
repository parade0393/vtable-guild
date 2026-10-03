import { LATEST, type VersionSelection } from '@/constants'

/**
 * 把持久化里读到的版本选择归一成合法值。
 *
 * 历史数据里 `null` 的意思是「跟随默认」，和现在的 `latest` 哨兵是同一个意思，
 * 一起归一掉，免得老访客被卡在一个没解析出版本号的状态里。
 */
export function toVersionSelection(saved: VersionSelection | null | undefined): VersionSelection {
  return saved ?? LATEST
}

/**
 * 把「选中的版本」解析成具体版本号——也就是真正会被拼进 CDN 地址的那个值。
 *
 * `latest` 永远取版本列表第一项，列表还没回来或拉取失败时退回 fallback。
 * 这里就是「Playground 打开时默认选中最新版」的落点：默认值走这条分支，
 * 而不是走 `MIN_SUPPORTED_VTG_VERSION`。
 */
export function resolveVersion(
  selection: VersionSelection,
  versions: string[],
  fallback: string,
): string {
  if (selection !== LATEST) return selection
  return versions[0] ?? fallback
}

/** 钉死的版本已经不在列表里（没带浏览器单文件产物、或已从 registry 删除）时该退回哪里 */
export function resolveStaleSelection(
  selection: VersionSelection,
  versions: string[],
): VersionSelection {
  return selection === LATEST || versions.includes(selection) ? selection : LATEST
}
