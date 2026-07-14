import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import { visualizer } from 'rollup-plugin-visualizer'

// 聚合包为唯一发布物（4 个子包 private 不发布），因此通过 alias 指向兄弟包源码
// 把整个工作区内联进本包。preserveModules 让产物按源码模块结构保留
// （dist/<pkg>/src/**，与 vite-plugin-dts 的 d.ts 输出天然对齐），
// 使消费方打包器能做模块级 tree-shaking，而不是面对一个 300KB 的单文件。
// tailwind3-preset 的 CJS 版本由 vite.preset-cjs.config.ts 单独构建
//（主入口 re-export 的子包全是 ESM-only，CJS 主入口不可用也从未在 exports 暴露）。
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.typecheck.ts', '**/*.typecheck.spec.ts'],
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: false,
      insertTypesEntry: true,
    }),
    ...(mode === 'analyze'
      ? [
          visualizer({
            filename: resolve(__dirname, 'stats/bundle.html'),
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: true,
          }),
          visualizer({
            filename: resolve(__dirname, 'stats/bundle.json'),
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@vtable-guild/core': resolve(__dirname, '../core/src/index.ts'),
      '@vtable-guild/icons': resolve(__dirname, '../icons/src/index.ts'),
      '@vtable-guild/theme': resolve(__dirname, '../theme/src/index.ts'),
      '@vtable-guild/table': resolve(__dirname, '../table/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'tailwind3-preset': resolve(__dirname, 'src/tailwind3-preset.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // tailwind-variants 是真实 npm 依赖（声明在 dependencies），无需内联
      external: ['vue', 'tailwind-variants'],
      output: {
        preserveModules: true,
        // 源码模块横跨 packages/*/src，以 packages/ 为根保留结构：
        // dist/vtable-guild/src/index.mjs、dist/core/src/**、dist/table/src/** …
        preserveModulesRoot: resolve(__dirname, '..'),
        entryFileNames: '[name].mjs',
      },
    },
  },
}))
