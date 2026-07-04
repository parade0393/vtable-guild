import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// tailwind3-preset 的 CJS 构建（Tailwind 3 配置文件常在 CommonJS 环境 require 本文件）。
// 主构建（vite.config.ts）只出 ESM；这里补一份 dist/tailwind3-preset.cjs，
// 对应 exports['./tailwind3-preset'].require 条目。
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/tailwind3-preset.ts'),
      formats: ['cjs'],
      fileName: () => 'tailwind3-preset.cjs',
    },
  },
})
