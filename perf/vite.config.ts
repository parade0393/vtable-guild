import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const require = createRequire(import.meta.url)

/**
 * 读取被测库的**实际解析版本**，而不是 package.json 里的 range。
 *
 * 对照页的可信度有一半来自「你看到的数字是哪个版本跑出来的」，
 * 写 `^4.2.6` 等于没写——range 会随 lockfile 漂移。
 */
function resolveVersion(pkg: string, fallback = 'unknown'): string {
  try {
    return require(`${pkg}/package.json`).version ?? fallback
  } catch {
    return fallback
  }
}

/**
 * 工作区包要直接读文件：它的 exports 映射没有开放 `./package.json`，
 * 走 require 会解析失败。
 */
function readWorkspaceVersion(relPath: string, fallback = 'unknown'): string {
  try {
    const raw = readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), 'utf-8')
    return (JSON.parse(raw) as { version?: string }).version ?? fallback
  } catch {
    return fallback
  }
}

const libVersions = {
  'vtable-guild': readWorkspaceVersion('../packages/vtable-guild/package.json'),
  'ant-design-vue': resolveVersion('ant-design-vue'),
  'element-plus': resolveVersion('element-plus'),
  vue: resolveVersion('vue'),
}

// 独立的性能对照应用。部署时产物会被拷进 site/.vitepress/dist/perf，
// 因此 base 必须和文档站 base 下的 /perf/ 子路径一致——写错就是白屏。
export default defineConfig({
  base: '/vtable-guild/perf/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('./src', import.meta.url))),
    },
  },
  define: {
    __LIB_VERSIONS__: JSON.stringify(libVersions),
  },
  build: {
    // 三个表格库各自懒加载，chunk 天然偏大；这里只是关掉噪声警告，不改行为。
    chunkSizeWarningLimit: 1500,
  },
})
