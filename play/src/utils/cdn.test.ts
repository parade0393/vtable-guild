import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchVersions } from './cdn'

// 使用真实 HTTP 检查超时、响应体和取消；不替换 fetch。
describe('fetchVersions', () => {
  let server: Server
  let requests: string[]
  let closedRequests: string[]
  let primary: 'success' | 'hang' | 'body-hang' | 'error'
  let registry: 'success' | 'hang'
  let primaryReceived: Promise<void>
  let markPrimaryReceived: () => void

  beforeEach(async () => {
    requests = []
    closedRequests = []
    primary = 'hang'
    registry = 'success'
    primaryReceived = new Promise((resolve) => {
      markPrimaryReceived = resolve
    })
    server = createServer((request, response) => {
      response.setHeader('access-control-allow-origin', '*')
      response.setHeader('access-control-allow-methods', 'GET, OPTIONS')
      response.setHeader('access-control-allow-headers', '*')
      if (request.method === 'OPTIONS') {
        response.writeHead(204)
        response.end()
        return
      }
      const path = request.url ?? ''
      requests.push(path)
      response.on('close', () => closedRequests.push(path))
      response.setHeader('content-type', 'application/json')
      if (path === '/v1/packages/npm/vue') {
        markPrimaryReceived()
        if (primary === 'hang') return
        if (primary === 'body-hang') {
          response.write('{"versions":')
          return
        }
        if (primary === 'error') {
          response.writeHead(503)
          response.end('{"error":"unavailable"}')
          return
        }
        response.end(JSON.stringify({ versions: [{ version: '3.5.13' }] }))
      } else if (path === '/vue') {
        if (registry === 'hang') return
        response.end(
          JSON.stringify({
            versions: { '3.4.0': {}, '3.5.12': {}, '3.5.13': {}, '3.6.0-beta.1': {} },
          }),
        )
      } else {
        response.writeHead(501)
        response.end('{}')
      }
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    vi.stubEnv('VITE_VERSION_JSDELIVR_BASE_URL', base)
    vi.stubEnv('VITE_VERSION_REGISTRY_BASE_URL', base)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  it('uses the primary response without requesting the registry', async () => {
    primary = 'success'
    expect(await fetchVersions('vue', { timeout: 500 })).toEqual(['3.5.13'])
    expect(requests).toEqual(['/v1/packages/npm/vue'])
  })

  it.each(['hang', 'body-hang', 'error'] as const)(
    'falls back when the primary source is %s',
    async (failure) => {
      primary = failure
      expect(await fetchVersions('vue', { timeout: 150, minVersion: '3.5.0' })).toEqual([
        '3.5.13',
        '3.5.12',
      ])
      expect(requests).toEqual(['/v1/packages/npm/vue', '/vue'])
      if (failure !== 'error') {
        await vi.waitFor(() => expect(closedRequests).toContain('/v1/packages/npm/vue'))
      }
    },
  )

  it('rejects after both sources time out', async () => {
    registry = 'hang'
    await expect(fetchVersions('vue', { timeout: 150 })).rejects.toThrow('版本请求超时')
    expect(requests).toEqual(['/v1/packages/npm/vue', '/vue'])
  })

  it('does not fall back after the caller cancels the request', async () => {
    const controller = new AbortController()
    const result = fetchVersions('vue', { signal: controller.signal, timeout: 500 })
    const rejected = expect(result).rejects.toThrow('caller cancelled')
    await primaryReceived
    controller.abort(new Error('caller cancelled'))
    await rejected
    expect(requests).toEqual(['/v1/packages/npm/vue'])
    await vi.waitFor(() => expect(closedRequests).toContain('/v1/packages/npm/vue'))
  })

  it('does not send a request when the caller has already cancelled', async () => {
    const controller = new AbortController()
    controller.abort(new Error('already cancelled'))
    await expect(fetchVersions('vue', { signal: controller.signal })).rejects.toThrow(
      'already cancelled',
    )
    expect(requests).toEqual([])
  })
})
