import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/core'
import { createTableRenderers } from './renderers'
import { resolveBodyCell } from './utils/cell'
import type { ColumnType } from './types/column'
import VTable from './components/VTable.vue'

function cell(value: unknown, column: ColumnType = {}, extra = {}) {
  return resolveBodyCell({
    text: value,
    record: {},
    rowIndex: 0,
    column,
    locale: 'en-US',
    columnEmptyText: '—',
    ...extra,
  })
}

describe('field renderer registry', () => {
  it('honors explicit Intl options for time-only values and preserves invalid input', () => {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true } as const
    expect(cell('13:45', { valueType: 'time', fieldProps: { dateFormat: options } }).content).toBe(
      '1:45 PM',
    )
    expect(
      cell('13:45:10', {
        valueType: 'time',
        fieldProps: { dateFormat: { ...options, second: '2-digit' } },
      }).content,
    ).toBe('1:45:10 PM')
    expect(cell('25:45', { valueType: 'time', fieldProps: { dateFormat: options } }).content).toBe(
      '25:45',
    )
  })
  it('formats clock values and date ranges with explicit empty-endpoint and timezone semantics', () => {
    const stamp = new Date(2026, 9, 26, 8, 9, 10)
    expect(cell(stamp, { valueType: 'dateTime' }).content).toBe('2026-10-26 08:09:10')
    expect(cell(stamp, { valueType: 'time' }).content).toBe('08:09:10')
    expect(cell('09:30', { valueType: 'time' }).content).toBe('09:30:00')
    expect(cell('25:30', { valueType: 'time' }).content).toBe('25:30')
    expect(cell('2026-10-26', { valueType: 'dateTime' }).content).toBe('2026-10-26 00:00:00')
    expect(cell('2026-02-31', { valueType: 'dateTime' }).content).toBe('2026-02-31')
    expect(cell(['2026-10-25', null], { valueType: 'dateRange' })).toMatchObject({
      content: '2026-10-25 ~ —',
      tooltipText: '2026-10-25 ~ —',
      copyText: undefined,
    })
    expect(
      cell([undefined, stamp], {
        valueType: 'dateTimeRange',
        fieldProps: { rangeEmptyText: 'Open', rangeSeparator: ' → ' },
      }).content,
    ).toBe('Open → 2026-10-26 08:09:10')
    expect(
      cell('2026-10-26T08:00:00Z', {
        valueType: 'dateTime',
        fieldProps: { dateFormat: { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' } },
      }).content,
    ).toBe('10/26/26, 8:00 AM')
    expect(cell('invalid', { valueType: 'dateTime' }).content).toBe('invalid')
  })

  it('defines percent scaling and progress clamping without changing raw copy values', () => {
    expect(cell(12.5, { valueType: 'percent' })).toMatchObject({
      content: '12.5%',
      copyText: '12.5',
    })
    expect(
      cell(0.125, { valueType: 'percent', fieldProps: { percentScale: 'ratio' } }).content,
    ).toBe('12.5%')
    expect(
      cell(1, { valueType: 'percent', fieldProps: { numberFormat: { minimumFractionDigits: 3 } } })
        .content,
    ).toBe('1.000%')
    expect(cell(false, { valueType: 'percent' }).content).toBe('false')
    expect(cell(' ', { valueType: 'progress' }).presentation).toBeUndefined()
    expect(cell(120, { valueType: 'progress' })).toMatchObject({
      content: '100%',
      status: 'success',
      presentation: 'progress',
      progress: { percent: 100, showValue: true },
      copyText: '120',
    })
    expect(
      cell(-10, { valueType: 'progress', fieldProps: { status: 'error', showValue: false } }),
    ).toMatchObject({
      status: 'error',
      progress: { percent: 0, showValue: false },
      copyText: '-10',
    })
    expect(
      cell(0.25, { valueType: 'progress', fieldProps: { percentScale: 'ratio' } }).progress
        ?.percent,
    ).toBe(25)
    expect(cell(null, { valueType: 'progress' }).presentation).toBeUndefined()
    expect(cell(25, { valueType: 'progress', customRender: () => 'Custom' })).toMatchObject({
      content: 'Custom',
      progress: undefined,
    })
  })

  it('formats finite numbers and money without changing copied source values', () => {
    expect(cell(1234.5, { valueType: 'digit' })).toMatchObject({
      content: '1,234.5',
      tooltipText: '1,234.5',
      copyText: '1234.5',
    })
    expect(cell(1234.5, { valueType: 'money', fieldProps: { currency: 'USD' } }).content).toBe(
      '$1,234.50',
    )
    expect(
      cell(0.125, {
        valueType: 'digit',
        fieldProps: { numberFormat: { style: 'percent', maximumFractionDigits: 1 } },
      }).content,
    ).toBe('12.5%')
    expect(cell(false, { valueType: 'digit' }).content).toBe('false')
    expect(cell(' ', { valueType: 'money' }).content).toBe(' ')
    expect(cell('invalid', { valueType: 'digit' }).content).toBe('invalid')
    expect(cell(Infinity, { valueType: 'digit' }).content).toBe(Infinity)
  })

  it.each([
    { currency: 'USD', expected: '$1,234.500' },
    { currency: undefined, expected: 'CN¥1,234.500' },
  ])('keeps money style and currency $currency ahead of numberFormat', ({ currency, expected }) => {
    expect(
      cell(1234.5, {
        valueType: 'money',
        fieldProps: {
          currency,
          numberFormat: {
            style: 'decimal',
            currency: 'EUR',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          },
        },
      }).content,
    ).toBe(expected)
  })

  it('formats dates with explicit locale/time zone and leaves invalid scalars alone', () => {
    expect(cell('2026-10-25', { valueType: 'date' }).content).toBe('2026-10-25')
    expect(cell(new Date(2026, 9, 25), { valueType: 'date' }).content).toBe('2026-10-25')
    expect(cell(new Date(2026, 9, 25).getTime(), { valueType: 'date' }).content).toBe('2026-10-25')
    expect(cell('2026-02-31', { valueType: 'date' }).content).toBe('2026-02-31')
    expect(cell('2024-02-29', { valueType: 'date' }).content).toBe('2024-02-29')
    const column: ColumnType = {
      valueType: 'date',
      fieldProps: {
        locale: 'en-US',
        dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' },
      },
    }
    expect(cell('2026-10-25T00:00:00Z', column).content).toBe('10/25/2026')
    expect(cell('not-a-date', column).content).toBe('not-a-date')
    expect(cell('2026-02-31', column).content).toBe('2026-02-31')
    expect(cell(0, column).content).toBe('01/01/1970')
    expect(cell('2026-10-25', column).content).toBe('10/25/2026')
    expect(
      cell('2026-10-25', {
        ...column,
        fieldProps: { locale: 'en-US', dateFormat: { dateStyle: 'long' } },
      }).content,
    ).toBe('October 25, 2026')
  })

  it('shares enum labels and status metadata with tag and text renderers', () => {
    const column: ColumnType = {
      valueType: 'tag',
      valueEnum: new Map([[1, { text: 'Enabled', status: 'success' }]]),
    }
    expect(cell(1, column)).toMatchObject({
      content: 'Enabled',
      status: 'success',
      copyText: '1',
    })
    expect(cell('1', column)).toMatchObject({ content: '1', status: 'default' })
    expect(cell(2, { ...column, valueType: 'text' }).content).toBe(2)
    expect(cell(1, { ...column, fieldProps: { status: 'warning' } }).status).toBe('warning')
  })

  it('isolates overrides, supports VNodes, metadata and unknown type fallback', () => {
    const renderer = vi.fn(({ displayValue }) => ({
      children: h('strong', String(displayValue)),
      tooltipText: 'Full label',
      status: 'warning' as const,
    }))
    const renderers = createTableRenderers({ custom: renderer, digit: () => 'Local number' })
    expect(Object.isFrozen(renderers)).toBe(true)
    expect(cell(42, { valueType: 'digit' }, { renderers }).content).toBe('Local number')
    expect(cell(42, { valueType: 'digit' }).content).toBe('42')
    const result = cell(1, { valueType: 'custom', valueEnum: { 1: 'One' } }, { renderers })
    expect(result.content).toEqual(h('strong', 'One'))
    expect(result.tooltipText).toBe('Full label')
    expect(result.status).toBe('warning')
    expect(renderer).toHaveBeenCalledWith(
      expect.objectContaining({ value: 1, displayValue: 'One', locale: 'en-US' }),
    )
    expect(cell(1, { valueType: 'missing', valueEnum: { 1: 'One' } }).content).toBe('One')
    expect(cell(1, { valueType: '__proto__' }).content).toBe(1)
    // A partial map also composes with built-ins without requiring a factory call.
    expect(cell(1234, { valueType: 'digit' }, { renderers: { custom: renderer } }).content).toBe(
      '1,234',
    )
  })

  it('keeps custom render, valid body slots and nullish placeholders ahead of field rendering', () => {
    const renderer = vi.fn(() => 'field')
    const renderers = createTableRenderers({ custom: renderer })
    const column: ColumnType = { valueType: 'custom' }
    expect(cell(null, column, { renderers }).content).toBe('—')
    expect(cell(undefined, column, { renderers, columnEmptyText: false }).content).toBe('')
    expect(cell(1, { ...column, customRender: () => null }, { renderers }).content).toBeNull()
    expect(cell(1, column, { renderers, bodyCell: () => [h('b', 'slot')] }).content).toEqual([
      h('b', 'slot'),
    ])
    expect(renderer).not.toHaveBeenCalled()
    expect(cell(1, column, { renderers, bodyCell: () => [] }).content).toBe('field')
  })

  it('passes transformed values and row context to fieldProps and custom renderers', () => {
    const fieldProps = vi.fn(({ value }) => ({ suffix: value }))
    const renderer = vi.fn(({ fieldProps }) => `Value:${fieldProps.suffix}`)
    const result = cell(
      1,
      { valueType: 'custom', fieldProps },
      {
        transformCellText: () => 2,
        renderers: createTableRenderers({ custom: renderer }),
      },
    )
    expect(fieldProps).toHaveBeenCalledWith(expect.objectContaining({ value: 2, index: 0 }))
    expect(result).toMatchObject({ content: 'Value:2', copyText: '2' })
  })
})

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe.each(['antdv', 'element-plus'] as const)('%s field rendering', (preset) => {
  it.each([false, true])(
    'renders progress with theme slots and semantic values, virtual=%s',
    (virtual) => {
      const wrapper = mount(VTable<Record<string, unknown>>, {
        props: {
          dataSource: [
            { key: 1, progress: 150 },
            { key: 2, progress: 35 },
          ],
          columns: [
            { dataIndex: 'progress', title: 'Progress', valueType: 'progress', width: 200 },
          ],
          virtual,
          scroll: { y: 300 },
        },
        global: { plugins: [createVTableGuild({ themePreset: preset, cssMode: 'tailwind4' })] },
      })
      wrappers.push(wrapper)
      const bars = wrapper.findAll('[role="progressbar"]')
      expect(bars).toHaveLength(2)
      expect(bars[0].attributes('aria-valuenow')).toBe('100')
      expect(bars[1].attributes('aria-valuenow')).toBe('35')
      expect(bars[0].get('[data-status="success"]').attributes('style')).toContain('width: 100%')
      expect(bars[1].classes().join(' ')).toContain('--vtg-cell-progress-min-width')
      expect(bars[1].text()).toBe('35%')
    },
  )

  it.each([false, true])('uses the same registry for virtual=%s and normal rows', (virtual) => {
    const wrapper = mount(VTable<Record<string, unknown>>, {
      props: {
        dataSource: [{ key: 1, status: 1, amount: 1234 }],
        columns: [
          {
            dataIndex: 'status',
            valueType: 'tag',
            valueEnum: new Map([[1, { text: 'Enabled', status: 'success' as const }]]),
          },
          { dataIndex: 'amount', valueType: 'digit' },
        ],
        renderers: createTableRenderers({ digit: ({ value }) => `Custom:${value}` }),
        virtual,
        scroll: { y: 300 },
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, cssMode: 'tailwind4' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('Custom:1234')
    expect(wrapper.get('[data-status="success"]').text()).toBe('Enabled')
    expect(wrapper.get('[data-vtg-field="tag"]').classes().join(' ')).toContain(
      'var(--vtg-cell-tag-bg)',
    )
  })
})
