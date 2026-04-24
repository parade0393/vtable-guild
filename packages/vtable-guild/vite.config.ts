import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.typecheck.ts', '**/*.typecheck.spec.ts'],
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: false,
      insertTypesEntry: true,
    }),
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
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
})
