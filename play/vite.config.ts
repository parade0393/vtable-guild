import { fileURLToPath, URL } from 'node:url'
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const PKG_ROOT = fileURLToPath(new URL('../packages/vtable-guild', import.meta.url))
const LOCAL_PREFIX = '/local-pkg/'

const MIME: Record<string, string> = {
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
}

/**
 * dev 专用：把工作区里刚构建出来的 packages/vtable-guild 挂到 /local-pkg/ 下。
 *
 * 没有它就没法在发版之前验证 Playground——import map 指向的 CDN 上还没有
 * 这个版本的 dist/index.full.mjs。有了它，改完包 → pnpm build → 在 CDN 下拉里
 * 选「本地构建产物」就能立刻验证，不用先发一个版本上去。
 */
function localPackagePlugin(): Plugin {
  return {
    name: 'vtg-local-package',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost')
        const url = requestUrl.pathname
        const index = url.indexOf(LOCAL_PREFIX)
        if (index === -1) return next()

        let requestedPath: string
        try {
          requestedPath = decodeURIComponent(url.slice(index + LOCAL_PREFIX.length))
        } catch {
          res.statusCode = 400
          res.end('invalid local package path')
          return
        }
        const filePath = resolve(PKG_ROOT, requestedPath)
        const packagePath = relative(PKG_ROOT, filePath)
        if (
          packagePath === '..' ||
          packagePath.startsWith(`..${sep}`) ||
          isAbsolute(packagePath) ||
          !existsSync(filePath)
        ) {
          res.statusCode = 404
          res.end(
            `local package file not found: ${requestedPath}\n先跑 pnpm --filter @vtable-guild/vtable-guild build`,
          )
          return
        }

        res.setHeader('Access-Control-Allow-Origin', '*')
        if (requestUrl.searchParams.has('meta') && statSync(filePath).isDirectory()) {
          const prefix = packagePath.split(sep).filter(Boolean).join('/')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              files: readdirSync(filePath, { withFileTypes: true })
                .filter((entry) => entry.isFile() || entry.isDirectory())
                .map((entry) => ({
                  path: `/${[prefix, entry.name].filter(Boolean).join('/')}`,
                  type: entry.isDirectory() ? 'directory' : 'file',
                })),
            }),
          )
          return
        }
        if (!statSync(filePath).isFile()) {
          res.statusCode = 404
          res.end('local package file not found')
          return
        }
        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

// 独立 Playground 应用。部署时产物会被拷进 site/.vitepress/dist/play，
// 因此 base 必须和文档站 base 下的 /play/ 子路径一致。
export default defineConfig({
  base: '/vtable-guild/play/',
  plugins: [vue(), localPackagePlugin()],
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('./src', import.meta.url))),
    },
  },
  // Monaco 的 worker 需要顶层 await
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    // 预打包会把 REPL 内部 worker 的相对 URL 移到 .vite/deps，导致 dev 下 404。
    exclude: ['@vue/repl'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
