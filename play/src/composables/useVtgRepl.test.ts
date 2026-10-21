import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import type { ReplStore } from '@vue/repl'

import { VERSION_LOAD_TIMEOUT, VERSION_REQUEST_TIMEOUT } from '@/constants'
import { useVtgRepl, type UseVtgReplOptions } from './useVtgRepl'

/**
 * 这一组用例盯的是同一件事：编辑器启动不能被版本请求卡死。
 *
 * 回归背景见 review.md 第 7 条——启动兜底计时器原先在 loadVersions 的第一行就被清掉，
 * 而版本请求又没有超时，任一请求 pending 时编辑器就永远停在「正在确认版本…」。
 */

const VTG_VERSIONS = ['2.7.1', '2.6.0', '2.5.0']
const VUE_VERSIONS = ['3.5.13', '3.5.12']
const VERSION_FETCH_ERROR = '版本列表拉取失败，可尝试切换 CDN 源'

const replMocks = vi.hoisted(() => ({
  useStore: vi.fn(),
}))

// useStore 会挂一串 watch、按 import map 拉产物，这里只关心「有没有被调、调了几次」
vi.mock('@vue/repl', () => {
  const vueVersion = { value: null as string | null }
  return {
    mergeImportMap: (a: Record<string, unknown>, b: Record<string, unknown>) => ({ ...a, ...b }),
    useStore: replMocks.useStore,
    useVueImportMap: () => ({
      vueVersion,
      productionMode: { value: false },
      importMap: { imports: {} },
      defaultVersion: '3.5.0',
    }),
  }
})

const fetchMock = vi.fn()

/** jsDelivr data API 的响应形态 */
function jsdelivrBody(versions: string[]) {
  return { versions: versions.map((version) => ({ version })) }
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as Response
}

/** 两个请求（vtable-guild / vue）都快速成功返回 */
function mockVersionListRequests() {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    const versions = url.includes('/npm/vue') ? VUE_VERSIONS : VTG_VERSIONS
    return Promise.resolve(jsonResponse(jsdelivrBody(versions)))
  })
}

/** 两个请求都永远不返回 */
function mockNeverReturningRequests() {
  fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
}

function storeStub(): ReplStore {
  return {
    serialize: () => '#repl-state',
    setFiles: vi.fn(),
  } as unknown as ReplStore
}

/**
 * 必须在 effectScope 里跑 composable：卸载收尾挂在 onScopeDispose 上，
 * 测试里要靠 scope.stop() 才能触发。
 */
function mountRepl(options?: UseVtgReplOptions) {
  const scope: EffectScope = effectScope()
  const api = scope.run(() => useVtgRepl(options))
  if (!api) throw new Error('useVtgRepl 应在 effectScope 内运行')
  return { api, scope }
}

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  replMocks.useStore.mockReset()
  replMocks.useStore.mockImplementation(() => storeStub())
  vi.stubGlobal('fetch', fetchMock)
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useVtgRepl 的启动时序', () => {
  it('版本请求一直不返回时，3 秒兜底照样把编辑器开起来', async () => {
    mockNeverReturningRequests()

    const { api, scope } = mountRepl()
    // 列表落地前不挂载 Repl，所以此时还没有 store
    expect(api.store.value).toBeNull()

    // 兜底先到：编辑器不等版本请求
    await vi.advanceTimersByTimeAsync(VERSION_LOAD_TIMEOUT)
    expect(replMocks.useStore).toHaveBeenCalledTimes(1)
    expect(api.store.value).not.toBeNull()

    // 主源超时后还要尝试备用源；两个源都超时才确认拉取失败。
    await vi.advanceTimersByTimeAsync(2 * VERSION_REQUEST_TIMEOUT - VERSION_LOAD_TIMEOUT + 100)
    expect(api.versionError.value).toBe(VERSION_FETCH_ERROR)

    scope.stop()
  })

  it('版本列表正常返回时 store 只建一次，兜底计时器被清掉', async () => {
    mockVersionListRequests()

    const { api, scope } = mountRepl()
    await vi.advanceTimersByTimeAsync(10)

    expect(api.vtgVersions.value).toEqual(VTG_VERSIONS)
    expect(api.versionError.value).toBe('')
    expect(replMocks.useStore).toHaveBeenCalledTimes(1)

    // 编辑器开起来了，兜底计时器必须已经清掉，不能留着 pending
    expect(vi.getTimerCount()).toBe(0)

    // 兜底时间点过去也不会补第二遍
    await vi.advanceTimersByTimeAsync(VERSION_LOAD_TIMEOUT + 1000)
    expect(replMocks.useStore).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('兜底已经开过编辑器后版本才回来，不会再建第二遍', async () => {
    // 比 VERSION_LOAD_TIMEOUT 晚、但比请求超时早：逼出「兜底先行、列表后到」的顺序
    fetchMock.mockImplementation(
      (input: RequestInfo | URL) =>
        new Promise<Response>((resolve) => {
          const url = String(input)
          const versions = url.includes('/npm/vue') ? VUE_VERSIONS : VTG_VERSIONS
          setTimeout(() => resolve(jsonResponse(jsdelivrBody(versions))), 5000)
        }),
    )

    const { api, scope } = mountRepl()
    await vi.advanceTimersByTimeAsync(VERSION_LOAD_TIMEOUT)
    expect(replMocks.useStore).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2000)
    expect(api.vtgVersions.value).toEqual(VTG_VERSIONS)
    expect(api.versionError.value).toBe('')
    expect(replMocks.useStore).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('请求超时（短于启动兜底）时走「拉取失败」分支，不留下未捕获异常', async () => {
    mockNeverReturningRequests()

    // vitest 自己也会监听 unhandledRejection 并把测试判失败，这里再显式收一份，
    // 保证「超时把 promise 收敛成 reject」不会顺手漏出一个没人接的 rejection
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)

    try {
      const { api, scope } = mountRepl({ versionRequestTimeout: 100 })

      // 两个源各等 100ms，250ms 时已经确认拉不到。
      await vi.advanceTimersByTimeAsync(250)
      expect(api.versionError.value).toBe(VERSION_FETCH_ERROR)
      // 兜底计时器还没到点，编辑器已经靠「确认拉不到」这条路开起来了
      expect(replMocks.useStore).toHaveBeenCalledTimes(1)

      // 再推进到兜底时间点：不再建第二遍，也没有未处理的 rejection
      await vi.advanceTimersByTimeAsync(VERSION_LOAD_TIMEOUT)
      expect(replMocks.useStore).toHaveBeenCalledTimes(1)
      expect(unhandled).toEqual([])

      scope.stop()
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('卸载后推进 timer，不再创建 store、也不再写已卸载的状态', async () => {
    mockNeverReturningRequests()

    const { api, scope } = mountRepl()
    scope.stop()

    // 兜底时间点和请求超时都过了：什么都不会发生
    await vi.advanceTimersByTimeAsync(VERSION_LOAD_TIMEOUT + VERSION_REQUEST_TIMEOUT + 1000)

    expect(replMocks.useStore).not.toHaveBeenCalled()
    expect(api.store.value).toBeNull()
    expect(api.versionError.value).toBe('')
    expect(api.vtgVersions.value).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })
})
