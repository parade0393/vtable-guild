import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [
        'vue',
        '@vtable-guild/core',
        '@vtable-guild/theme',
        '@vtable-guild/table',
        '@vtable-guild/pagination',
        'tailwind-variants',
      ],
    },
  },
})
