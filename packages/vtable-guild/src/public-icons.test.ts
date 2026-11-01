import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  SettingOutlinedIcon,
  ColumnHeightOutlinedIcon,
  ReloadOutlinedIcon,
  FullscreenOutlinedIcon,
  FullscreenExitOutlinedIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from './index'

// 直接消费聚合入口，防止内部 icons 已实现、唯一发布包却漏导出。
const icons = [
  ['SettingOutlinedIcon', SettingOutlinedIcon],
  ['ColumnHeightOutlinedIcon', ColumnHeightOutlinedIcon],
  ['ReloadOutlinedIcon', ReloadOutlinedIcon],
  ['FullscreenOutlinedIcon', FullscreenOutlinedIcon],
  ['FullscreenExitOutlinedIcon', FullscreenExitOutlinedIcon],
  ['CheckCircleFilledIcon', CheckCircleFilledIcon],
  ['CloseCircleFilledIcon', CloseCircleFilledIcon],
] as const

describe.each(icons)('public %s', (_name, Icon) => {
  it('renders a decorative SVG with the documented defaults from the public entry', () => {
    const wrapper = mount(Icon)
    try {
      expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
      expect(wrapper.attributes()).toMatchObject({
        width: '1em',
        height: '1em',
        fill: 'currentColor',
        'aria-hidden': 'true',
      })
      expect(wrapper.attributes('viewBox')).toBeTruthy()
      expect(wrapper.find('path').attributes('d')).toBeTruthy()
    } finally {
      wrapper.unmount()
    }
  })

  it('forwards SVG attributes, styles and a single click event', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Icon, {
      attrs: {
        class: 'business-icon',
        style: { color: 'red', fontSize: '24px' },
        width: '24',
        height: '28',
        role: 'img',
        'aria-label': 'Business action',
        'aria-hidden': 'false',
        onClick,
      },
    })
    try {
      expect(wrapper.classes()).toContain('business-icon')
      expect(wrapper.attributes()).toMatchObject({
        width: '24',
        height: '28',
        role: 'img',
        'aria-label': 'Business action',
        'aria-hidden': 'false',
      })
      expect(wrapper.attributes('style')).toContain('color: red')
      expect(wrapper.attributes('style')).toContain('font-size: 24px')
      await wrapper.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
    } finally {
      wrapper.unmount()
    }
  })
})
