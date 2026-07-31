import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// 浏览器单文件产物 dist/index.full.mjs。
//
// 主构建（vite.config.ts）走 preserveModules 并把 tailwind-variants 留作 external，
// 目的是让打包器做模块级 tree-shaking——但那份产物无法直接被浏览器 import map 指向：
// 它有几百个相对导入，还需要额外解析 tailwind-variants / tailwind-merge。
//
// 这里补一份「只 external vue、其余全内联」的单文件 ESM，供：
// 1. Playground（@vue/repl）的 import map；
// 2. 文档里的 <script type="module"> CDN 用法。
//
// d.ts 由主构建产出，本配置不重复生成。
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@vtable-guild/core': resolve(__dirname, '../core/src/index.ts'),
      '@vtable-guild/icons': resolve(__dirname, '../icons/src/index.ts'),
      '@vtable-guild/theme': resolve(__dirname, '../theme/src/index.ts'),
      '@vtable-guild/table': resolve(__dirname, '../table/src/index.ts'),
    },
  },
  build: {
    // 主构建先跑，这里不能清空 dist
    emptyOutDir: false,
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.full.mjs',
    },
    rollupOptions: {
      // 只有 vue 保持 external —— tailwind-variants 及其依赖 tailwind-merge 必须内联，
      // 否则浏览器侧 import map 还得再配两条。
      external: ['vue'],
    },
  },
})
