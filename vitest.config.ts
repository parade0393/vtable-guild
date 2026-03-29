import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

const packageAliases = {
  '@vtable-guild/core': resolve(rootDir, 'packages/core/src/index.ts'),
  '@vtable-guild/icons': resolve(rootDir, 'packages/icons/src/index.ts'),
  '@vtable-guild/theme': resolve(rootDir, 'packages/theme/src/index.ts'),
  '@vtable-guild/table': resolve(rootDir, 'packages/table/src/index.ts'),
  '@vtable-guild/vtable-guild': resolve(rootDir, 'packages/vtable-guild/src/index.ts'),
}

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: packageAliases,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [resolve(rootDir, 'tests/setup.ts')],
    pool: 'threads',
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: resolve(rootDir, 'coverage'),
      include: [
        'packages/core/src/**/*.{ts,tsx,vue}',
        'packages/theme/src/**/*.{ts,tsx,vue}',
        'packages/table/src/**/*.{ts,tsx,vue}',
      ],
      exclude: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/dist/**'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          root: resolve(rootDir, 'packages/core'),
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'icons',
          root: resolve(rootDir, 'packages/icons'),
          include: ['src/**/*.test.ts'],
          passWithNoTests: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'theme',
          root: resolve(rootDir, 'packages/theme'),
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'table',
          root: resolve(rootDir, 'packages/table'),
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'vtable-guild',
          root: resolve(rootDir, 'packages/vtable-guild'),
          include: ['src/**/*.test.ts'],
          passWithNoTests: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'playground',
          root: resolve(rootDir, 'playground'),
          include: ['src/**/*.test.ts'],
          passWithNoTests: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'site',
          root: resolve(rootDir, 'site'),
          include: ['**/*.test.ts'],
          passWithNoTests: true,
        },
      },
    ],
  },
})
