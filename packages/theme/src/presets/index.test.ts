import { describe, expect, it } from 'vitest'
import { resolveBuiltInLocale, resolveBuiltInTableLocale, resolveThemePreset } from './index'
import { tableTheme } from '../table'
import { resolvePaginationThemePreset } from '../pagination'

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
      // scroll.y: 'auto' 自动高度布局 slots 必须两套预设同时具备。
      expect(preset.table.slots.rootAutoHeight).toContain('flex-col')
      expect(preset.table.slots.rootAutoHeight).toContain('h-full')
      expect(preset.table.slots.wrapperAutoHeight).toContain('flex-col')
      expect(preset.table.slots.wrapperAutoHeight).toContain('overflow-hidden')
      const bordered = preset.table.variants?.bordered?.true as Record<string, string>
      expect(bordered.tbody).toContain(':not([data-vtg-preserve-last-border])')
      expect(preset.locales['zh-CN'].table.header.sortTriggerAsc).toBeTruthy()
      expect(preset.locales['en-US'].table.filterDropdown.confirmText).toBeTruthy()
    }
  })

  it('resolves built-in locales and keeps the default table theme aligned with the antdv preset', () => {
    expect(resolveBuiltInTableLocale('antdv', 'en-US')?.header.sortTriggerAsc).toBeTruthy()
    expect(resolveBuiltInLocale('element-plus', 'zh-CN')?.table.empty.text).toBeTruthy()
    expect(tableTheme).toBe(resolveThemePreset('antdv').table)
  })
  it('resolves pagination themes and wording for each preset', () => {
    expect(resolvePaginationThemePreset('element-plus')).toBe(
      resolveThemePreset('element-plus').pagination,
    )
    expect(resolvePaginationThemePreset()).toBe(resolveThemePreset('antdv').pagination)
    expect(resolveBuiltInLocale('element-plus', 'zh-CN')?.pagination?.jump_to).toBe('前往')
    expect(resolveBuiltInLocale('antdv', 'zh-CN')?.pagination?.jump_to).toBe('跳至')
    expect(resolveBuiltInLocale('element-plus', 'en-US')?.pagination?.items_per_page).toBe('/page')
  })

  it.each(['antdv', 'element-plus'] as const)(
    'provides %s jump templates for configurable pager counts in both built-in locales',
    (preset) => {
      const english = resolveBuiltInLocale(preset, 'en-US')?.pagination
      const chinese = resolveBuiltInLocale(preset, 'zh-CN')?.pagination
      expect(english?.prev_pages?.replace('{count}', '7')).toBe('Previous 7 pages')
      expect(english?.next_pages?.replace('{count}', '19')).toBe('Next 19 pages')
      expect(chinese?.prev_pages?.replace('{count}', '7')).toBe('向前 7 页')
      expect(chinese?.next_pages?.replace('{count}', '19')).toBe('向后 19 页')
    },
  )
})
