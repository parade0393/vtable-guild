import { describe, expect, it } from 'vitest'
import { resolveBuiltInLocale, resolveBuiltInTableLocale, resolveThemePreset } from './index'
import { tableTheme } from '../table'

describe('theme presets', () => {
  it('exposes complete preset structures for supported UI libraries', () => {
    for (const name of ['antdv', 'element-plus'] as const) {
      const preset = resolveThemePreset(name)

      expect(preset.table.slots.root).toBeTruthy()
      expect(preset.button?.slots.root).toBeTruthy()
      expect(preset.checkbox?.slots.root).toBeTruthy()
      expect(preset.radio?.slots.root).toBeTruthy()
      expect(preset.input?.slots.root).toBeTruthy()
      expect(preset.tooltip?.slots.content).toBeTruthy()
      expect(preset.scrollbar?.slots.root).toBeTruthy()
      expect(preset.table.defaultVariants?.size).toBeTruthy()
      expect(preset.locales['zh-CN'].table.header.sortTriggerAsc).toBeTruthy()
      expect(preset.locales['en-US'].table.filterDropdown.confirmText).toBeTruthy()
    }
  })

  it('resolves built-in locales and keeps the default table theme aligned with the antdv preset', () => {
    expect(resolveBuiltInTableLocale('antdv', 'en-US')?.header.sortTriggerAsc).toBeTruthy()
    expect(resolveBuiltInLocale('element-plus', 'zh-CN')?.table.empty.text).toBeTruthy()
    expect(tableTheme).toBe(resolveThemePreset('antdv').table)
  })
})
