import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, isVNode } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createVTableGuild,
  VTableGuildConfigProvider,
  type ThemePresetName,
  type VTableGuildOptions,
} from '@vtable-guild/core'
import { elementPlusPaginationEnUS, paginationEnUS } from '@vtable-guild/theme'
import TablePagination from './TablePagination'
import VTable from './VTable.vue'
import type { TablePaginationConfig } from '../types'

const wrappers: VueWrapper[] = []
const presets = ['antdv', 'element-plus'] as const
const rows = Array.from({ length: 30 }, (_, index) => ({ key: index, name: `Row ${index}` }))

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

function pager(
  themePreset: ThemePresetName,
  config: TablePaginationConfig = {},
  options: VTableGuildOptions = {},
) {
  const wrapper = mount(TablePagination, {
    props: {
      config,
      state: { current: 10, pageSize: 10, total: 200 },
      locale: themePreset === 'element-plus' ? elementPlusPaginationEnUS : paginationEnUS,
    },
    global: {
      plugins: [createVTableGuild({ themePreset, locale: 'en-US', compatClass: true, ...options })],
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe.each(presets)('%s pagination compat classes', (themePreset) => {
  it('keeps compatibility output disabled by default', () => {
    const wrapper = pager(
      themePreset,
      { showSizeChanger: true, showQuickJumper: { goButton: true }, simple: false },
      { compatClass: undefined },
    )

    expect(wrapper.html()).not.toContain('ant-')
  })

  it('marks pager controls and updates active and boundary classes with the page', async () => {
    const wrapper = pager(themePreset, {
      showTotal: (total) => `Total ${total}`,
      showSizeChanger: true,
      showQuickJumper: true,
    })

    expect(wrapper.get('nav').classes()).toEqual(
      expect.arrayContaining([
        'ant-pagination',
        'ant-table-pagination',
        'ant-table-pagination-right',
      ]),
    )
    expect(wrapper.get('.ant-pagination-item-10').classes()).toEqual(
      expect.arrayContaining(['ant-pagination-item', 'ant-pagination-item-active']),
    )
    expect(wrapper.get('.ant-pagination-prev').classes()).toContain('ant-pagination-item-link')
    expect(wrapper.get('.ant-pagination-next').classes()).toContain('ant-pagination-item-link')
    for (const direction of ['prev', 'next']) {
      expect(wrapper.get(`.ant-pagination-jump-${direction}`).classes()).toEqual(
        expect.arrayContaining([
          `ant-pagination-jump-${direction}-custom-icon`,
          'ant-pagination-item-link',
          'ant-pagination-item-container',
        ]),
      )
    }
    expect(wrapper.findAll('.ant-pagination-item-ellipsis')).toHaveLength(2)
    expect(wrapper.findAll('.ant-pagination-item-link-icon')).toHaveLength(2)
    expect(wrapper.get('.ant-pagination-item-after-jump-prev').classes()).toContain(
      'ant-pagination-item-8',
    )
    expect(wrapper.get('.ant-pagination-item-before-jump-next').classes()).toContain(
      'ant-pagination-item-12',
    )
    expect(wrapper.get('.ant-pagination-total-text').text()).toBe('Total 200')
    const sizes = wrapper.get('[aria-haspopup="listbox"]')
    expect(sizes.classes()).toEqual(
      expect.arrayContaining(['ant-pagination-options', 'ant-pagination-options-size-changer']),
    )
    expect(sizes.classes()).not.toContain('ant-pagination-item')
    expect(wrapper.get('.ant-pagination-options-quick-jumper').classes()).toContain(
      'ant-pagination-options',
    )

    await wrapper.setProps({ state: { current: 1, pageSize: 10, total: 200 } })
    expect(wrapper.get('.ant-pagination-prev').classes()).toContain('ant-pagination-disabled')
    expect(wrapper.get('.ant-pagination-next').classes()).not.toContain('ant-pagination-disabled')
    expect(wrapper.get('.ant-pagination-item-active').classes()).toContain('ant-pagination-item-1')
    expect(wrapper.find('.ant-pagination-jump-prev').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-item-after-jump-prev').exists()).toBe(false)
    expect(wrapper.findAll('.ant-pagination-item-before-jump-next')).toHaveLength(1)

    await wrapper.setProps({ state: { current: 20, pageSize: 10, total: 200 } })
    expect(wrapper.get('.ant-pagination-prev').classes()).not.toContain('ant-pagination-disabled')
    expect(wrapper.get('.ant-pagination-next').classes()).toContain('ant-pagination-disabled')
    expect(wrapper.get('.ant-pagination-item-active').classes()).toContain('ant-pagination-item-20')
    expect(wrapper.find('.ant-pagination-jump-next').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-item-before-jump-next').exists()).toBe(false)
    expect(wrapper.findAll('.ant-pagination-item-after-jump-prev')).toHaveLength(1)

    await wrapper.setProps({ state: { current: 2, pageSize: 10, total: 50 } })
    expect(wrapper.find('.ant-pagination-jump-prev').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-jump-next').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-item-after-jump-prev').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-item-before-jump-next').exists()).toBe(false)
  })

  it('tracks size, responsive, simple and disabled independently', async () => {
    const wrapper = pager(themePreset, { size: 'small', disabled: true })
    expect(wrapper.get('nav').classes()).toEqual(
      expect.arrayContaining(['ant-pagination-mini', 'ant-pagination-disabled']),
    )

    await wrapper.setProps({ config: { simple: true }, align: 'center' })
    expect(wrapper.get('nav').classes()).toEqual(
      expect.arrayContaining(['ant-pagination-simple', 'ant-table-pagination-center']),
    )
    expect(wrapper.get('nav').classes()).not.toContain('ant-pagination-mini')
    expect(wrapper.get('nav').classes()).not.toContain('ant-pagination-disabled')
    expect(wrapper.get('nav').classes()).not.toContain('ant-table-pagination-right')
    expect(wrapper.get('.ant-pagination-simple-pager').find('input').exists()).toBe(true)
    expect(wrapper.get('.ant-pagination-slash').text()).toBe('／')
    expect(wrapper.find('.ant-pagination-item').exists()).toBe(false)

    await wrapper.setProps({ config: { responsive: true }, narrow: true })
    expect(wrapper.get('nav').classes()).toContain('ant-pagination-mini')
    expect(wrapper.get('nav').classes()).not.toContain('ant-pagination-simple')
    await wrapper.setProps({ narrow: false, tableSize: 'middle' })
    expect(wrapper.get('nav').classes().includes('ant-pagination-mini')).toBe(
      themePreset === 'antdv',
    )
    await wrapper.setProps({ config: { size: 'default', responsive: true }, narrow: true })
    expect(wrapper.get('nav').classes()).not.toContain('ant-pagination-mini')
  })

  it('keeps Go classes distinct for default, custom and simple rendering', async () => {
    const wrapper = pager(themePreset, { showQuickJumper: { goButton: true } })
    expect(wrapper.get('.ant-pagination-options-quick-jumper-button').element.tagName).toBe(
      'BUTTON',
    )

    await wrapper.setProps({
      config: { showQuickJumper: { goButton: h('span', { class: 'custom-go' }, 'Go') } },
    })
    expect(wrapper.find('.ant-pagination-options-quick-jumper-button').exists()).toBe(false)
    expect(wrapper.get('.custom-go').classes()).not.toContain('ant-pagination-item')
    await wrapper.get('input').setValue('12')
    await wrapper.get('.custom-go').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[12]])

    await wrapper.setProps({ config: { simple: true, showQuickJumper: { goButton: true } } })
    expect(wrapper.findAll('.ant-pagination-simple-pager')).toHaveLength(2)
    expect(wrapper.find('.ant-pagination-options-quick-jumper').exists()).toBe(false)
    expect(wrapper.find('.ant-pagination-options-quick-jumper-button').exists()).toBe(false)
  })

  it('retains compatibility and interaction when itemRender replaces the button', async () => {
    const itemRender = vi.fn<NonNullable<TablePaginationConfig['itemRender']>>(
      ({ page, type, originalElement }) => {
        expect(isVNode(originalElement)).toBe(true)
        if (isVNode(originalElement)) {
          expect(originalElement.props?.class).toContain(
            type === 'page' ? `ant-pagination-item-${page}` : `ant-pagination-${type}`,
          )
        }
        return h('a', { href: '#', class: 'custom-item' }, `${type} ${page}`)
      },
    )
    const wrapper = pager(themePreset, { itemRender })
    const page = wrapper.get('.ant-pagination-item-9')
    expect(page.element.tagName).toBe('A')
    expect(page.classes()).toEqual(expect.arrayContaining(['custom-item', 'ant-pagination-item']))
    expect(wrapper.get('.ant-pagination-item-active').classes()).toContain('ant-pagination-item-10')
    expect(wrapper.get('.ant-pagination-prev').classes()).toContain('custom-item')
    await page.trigger('click')
    expect(wrapper.emitted('change')).toEqual([[9]])

    await wrapper.setProps({ config: { itemRender, disabled: true } })
    expect(wrapper.get('nav').classes()).toContain('ant-pagination-disabled')
    await wrapper.get('.ant-pagination-item-9').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[9]])
  })

  it.each([
    { cssMode: 'prebuilt' as const, classPrefix: 'ant', utility: 'ant-inline-flex' },
    { cssMode: 'tailwind4' as const, classPrefix: 'app', utility: 'inline-flex' },
  ])('preserves classes through $cssMode with prefix $classPrefix', (options) => {
    const wrapper = pager(themePreset, { showSizeChanger: true, simple: false }, options)
    expect(wrapper.get('.ant-pagination-item-active').classes()).toContain(options.utility)
    expect(wrapper.get('.ant-pagination-item-active').classes()).toContain('ant-pagination-item-10')
    expect(wrapper.get('.ant-pagination-options-size-changer').classes()).toContain(options.utility)
    expect(wrapper.html()).not.toContain('app-ant-pagination')
    expect(wrapper.html()).not.toContain('vtg-ant-pagination')
  })

  it('preserves global compatibility through providers and top/bottom table pagination', async () => {
    const positions: TablePaginationConfig['position'][] = [
      ['topLeft', 'bottomRight'],
      ['topCenter', 'bottomCenter'],
      ['topRight', 'bottomLeft'],
    ]
    for (const position of positions) {
      const Probe = defineComponent({
        setup: () => () =>
          h(
            VTableGuildConfigProvider,
            { classPrefix: 'ant' },
            {
              default: () =>
                h(VTable, {
                  columns: [{ title: 'Name', key: 'name', dataIndex: 'name' }],
                  dataSource: rows,
                  rowKey: 'key',
                  pagination: { pageSize: 10, position, showSizeChanger: true },
                }),
            },
          ),
      })
      const wrapper = mount(Probe, {
        global: { plugins: [createVTableGuild({ themePreset, compatClass: true })] },
      })
      wrappers.push(wrapper)
      const pagers = wrapper.findAll('nav')
      expect(pagers).toHaveLength(2)
      for (const [index, pager] of pagers.entries()) {
        const align = position![index]!.replace(/^(top|bottom)/, '').toLowerCase()
        expect(pager.classes()).toEqual(
          expect.arrayContaining([
            'ant-pagination',
            'ant-table-pagination',
            `ant-table-pagination-${align}`,
          ]),
        )
        expect(pager.get('[aria-current="page"]').classes()).toContain('ant-pagination-item-1')
        expect(pager.get('[aria-haspopup="listbox"]').classes()).toContain(
          'ant-pagination-options-size-changer',
        )
      }
    }
  })
})
