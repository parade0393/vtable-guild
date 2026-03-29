import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { TABLE_CONTEXT_KEY } from '../context'
import VTableSummary from './VTableSummary'

describe('VTableSummary', () => {
  it('registers fixed summary mode in table context', () => {
    const registerSummaryFixed = vi.fn()

    mount(VTableSummary, {
      props: {
        fixed: 'bottom',
      },
      global: {
        provide: {
          [TABLE_CONTEXT_KEY as symbol]: {
            registerSummaryFixed,
          },
        },
      },
      slots: {
        default: '<div>summary</div>',
      },
    })

    expect(registerSummaryFixed).toHaveBeenCalledWith('bottom')
  })
})
