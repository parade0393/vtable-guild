import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import { nextTick, ref } from 'vue'
import LocalRequestDemo from './local-request.vue'
import MixedRequestDemo from './mixed-request.vue'

const wrappers: VueWrapper[] = []
const messages = {
  'zh-CN': {
    requests: '请求次数',
    loaded: '已加载',
    page: '页码',
    filter: '筛选',
    all: '全部',
    name: '姓名',
    status: '状态',
    member: '成员',
    enabled: '启用',
    disabled: '禁用',
    refresh: '刷新数据',
    reset: '重置并刷新',
    total: (count: number) => `共 ${count} 条匹配记录`,
    localIntro: '首次加载 20 条记录，翻页、排序和筛选均在本地处理。',
    mixedIntro: '筛选由接口处理，排序和分页在前端处理全部匹配记录。',
  },
  'en-US': {
    requests: 'Requests',
    loaded: 'Loaded',
    page: 'Page',
    filter: 'Filter',
    all: 'All',
    name: 'Name',
    status: 'Status',
    member: 'Member',
    enabled: 'Enabled',
    disabled: 'Disabled',
    refresh: 'Refresh data',
    reset: 'Reset and reload',
    total: (count: number) => `${count} matching records`,
    localIntro: 'Load 20 records once. Paging, sorting and filtering stay in the browser.',
    mixedIntro: 'Filter on the server; sort and page all returned matches in the browser.',
  },
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
  document.body.innerHTML = ''
})

async function finishRequest() {
  await vi.advanceTimersByTimeAsync(250)
  await nextTick()
}

function expectStatus(wrapper: VueWrapper, label: string, value: string | number) {
  expect(wrapper.get('[role="status"]').text()).toMatch(
    new RegExp(`${label}\\s*[:：]\\s*${value}(?:\\s|·|$)`),
  )
}

function nameHeader(wrapper: VueWrapper, label: string) {
  return wrapper.findAll('thead th').find((header) => header.text() === label)!
}

async function chooseEnabled(wrapper: VueWrapper, enabledLabel: string) {
  await wrapper.getComponent({ name: 'FilterIcon' }).trigger('click')
  const label = Array.from(document.body.querySelectorAll('li span')).find(
    (element) => element.textContent?.trim() === enabledLabel,
  )
  expect(label).toBeDefined()
  label!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  const confirm = Array.from(document.body.querySelectorAll('button')).find((button) =>
    /^(确定|筛选|OK|Confirm|Filter)$/.test(button.textContent?.replace(/\s/g, '') ?? ''),
  )
  expect(confirm).toBeDefined()
  confirm!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
}

async function clickButton(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text)
  expect(button).toBeDefined()
  await button!.trigger('click')
}

describe.each(['antdv', 'element-plus'] as const)('request mode docs with %s', (themePreset) => {
  describe.each(['zh-CN', 'en-US'] as const)('in %s', (locale) => {
    const text = messages[locale]

    it('loads all rows once and keeps paging, sorting and filtering local', async () => {
      const wrapper = mount(LocalRequestDemo, {
        attachTo: document.body,
        global: {
          plugins: [createVTableGuild({ themePreset })],
          provide: { 'vtg-demo-lang': ref(locale) },
        },
      })
      wrappers.push(wrapper)
      await finishRequest()

      expectStatus(wrapper, text.requests, 1)
      expectStatus(wrapper, text.loaded, 20)
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 01`)
      await wrapper.get('button[title="2"]').trigger('click')
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 11`)
      expectStatus(wrapper, text.requests, 1)

      await wrapper.get('button[title="1"]').trigger('click')
      await nameHeader(wrapper, text.name).trigger('click')
      await nameHeader(wrapper, text.name).trigger('click')
      expect(nameHeader(wrapper, text.name).attributes('aria-sort')).toBe('descending')
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 20`)
      expectStatus(wrapper, text.requests, 1)

      await chooseEnabled(wrapper, text.enabled)
      await finishRequest()
      expectStatus(wrapper, text.requests, 1)
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 19`)
      expect(wrapper.get('tbody').text()).not.toContain(text.disabled)
      expect(wrapper.text()).toContain(text.total(10))
      expect(wrapper.find('button[title="2"]').exists()).toBe(false)

      await clickButton(wrapper, text.refresh)
      await finishRequest()
      expectStatus(wrapper, text.requests, 2)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 19`)
      expect(wrapper.text()).toContain(text.total(10))
    })

    it('requests only remote filters and explicitly resets local state with the query', async () => {
      const wrapper = mount(MixedRequestDemo, {
        attachTo: document.body,
        global: {
          plugins: [createVTableGuild({ themePreset })],
          provide: { 'vtg-demo-lang': ref(locale) },
        },
      })
      wrappers.push(wrapper)
      await finishRequest()

      expectStatus(wrapper, text.requests, 1)
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
      await wrapper.get('button[title="2"]').trigger('click')
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 11`)
      expectStatus(wrapper, text.requests, 1)
      await nameHeader(wrapper, text.name).trigger('click')
      await nameHeader(wrapper, text.name).trigger('click')
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 20`)
      expectStatus(wrapper, text.page, 1)
      expectStatus(wrapper, text.requests, 1)

      await wrapper.get('button[title="2"]').trigger('click')
      await chooseEnabled(wrapper, text.enabled)
      await finishRequest()
      expectStatus(wrapper, text.requests, 2)
      expectStatus(wrapper, text.loaded, 14)
      expectStatus(wrapper, text.page, 1)
      expectStatus(wrapper, text.filter, text.enabled)
      expect(wrapper.getComponent({ name: 'FilterIcon' }).props('active')).toBe(true)
      expect(wrapper.get('tbody').text()).not.toContain(text.disabled)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 20`)
      expect(wrapper.text()).toContain(text.total(14))

      await wrapper.get('button[title="2"]').trigger('click')
      expect(wrapper.findAll('tbody tr')).toHaveLength(4)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 05`)
      expectStatus(wrapper, text.requests, 2)
      await clickButton(wrapper, text.reset)
      await finishRequest()
      expectStatus(wrapper, text.requests, 3)
      expectStatus(wrapper, text.loaded, 20)
      expectStatus(wrapper, text.page, 1)
      expectStatus(wrapper, text.filter, text.all)
      expect(wrapper.getComponent({ name: 'FilterIcon' }).props('active')).toBe(false)
      expect(nameHeader(wrapper, text.name).attributes('aria-sort')).toBeUndefined()
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
      expect(wrapper.get('tbody tr').text()).toContain(`${text.member} 01`)

      // Reset without a changed filter still makes exactly one explicit request.
      await clickButton(wrapper, text.reset)
      await finishRequest()
      expectStatus(wrapper, text.requests, 4)
    })
  })

  it.each([
    ['local', LocalRequestDemo, 'localIntro'],
    ['mixed', MixedRequestDemo, 'mixedIntro'],
  ] as const)(
    'updates %s demo copy when the page language changes without requesting',
    async (_mode, component, intro) => {
      const lang = ref('zh-CN')
      const wrapper = mount(component, {
        attachTo: document.body,
        global: {
          plugins: [createVTableGuild({ themePreset })],
          provide: { 'vtg-demo-lang': lang },
        },
      })
      wrappers.push(wrapper)
      await finishRequest()

      const chinese = messages['zh-CN']
      expectStatus(wrapper, chinese.requests, 1)
      expect(wrapper.text()).toContain(chinese[intro])
      expect(wrapper.findAll('button').some((button) => button.text() === chinese.refresh)).toBe(
        true,
      )
      expect(nameHeader(wrapper, chinese.name)).toBeDefined()
      expect(wrapper.get('thead').text()).toContain(chinese.status)
      expect(wrapper.getComponent({ name: 'FilterIcon' }).attributes('aria-label')).toBe('筛选')
      expect(wrapper.get('tbody tr').text()).toContain(`${chinese.member} 01`)
      expect(wrapper.get('tbody tr').text()).toContain(chinese.enabled)
      expect(wrapper.text()).toContain(chinese.total(20))
      if (intro === 'mixedIntro') {
        expect(wrapper.findAll('button').some((button) => button.text() === chinese.reset)).toBe(
          true,
        )
      }

      lang.value = 'en-US'
      await nextTick()
      await finishRequest()

      const english = messages['en-US']
      expectStatus(wrapper, english.requests, 1)
      expectStatus(wrapper, english.loaded, 20)
      expect(wrapper.text()).toContain(english[intro])
      expect(wrapper.text()).not.toContain(chinese[intro])
      expect(wrapper.findAll('button').some((button) => button.text() === english.refresh)).toBe(
        true,
      )
      expect(wrapper.findAll('button').some((button) => button.text() === chinese.refresh)).toBe(
        false,
      )
      expect(nameHeader(wrapper, english.name)).toBeDefined()
      expect(wrapper.get('thead').text()).toContain(english.status)
      expect(wrapper.get('thead').text()).not.toContain(chinese.name)
      expect(wrapper.getComponent({ name: 'FilterIcon' }).attributes('aria-label')).toBe('Filter')
      expect(wrapper.get('tbody tr').text()).toContain(`${english.member} 01`)
      expect(wrapper.get('tbody tr').text()).toContain(english.enabled)
      expect(wrapper.get('tbody').text()).not.toContain(chinese.member)
      expect(wrapper.text()).toContain(english.total(20))
      expect(wrapper.text()).not.toContain(chinese.total(20))
      if (intro === 'mixedIntro') {
        expect(wrapper.findAll('button').some((button) => button.text() === english.reset)).toBe(
          true,
        )
        expect(wrapper.findAll('button').some((button) => button.text() === chinese.reset)).toBe(
          false,
        )
        expectStatus(wrapper, english.page, 1)
        expectStatus(wrapper, english.filter, english.all)
      }
    },
  )
})
