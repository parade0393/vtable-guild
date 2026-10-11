import { defineComponent, shallowReactive, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useResize } from './useResize'
import type { ColumnType } from '../types'

function reactiveColumns(columns: ColumnType<Record<string, unknown>>[]) {
  return shallowRef(columns.map((column) => shallowReactive(column)))
}

function createPointerEvent(clientX: number, headerWidth?: number) {
  let currentTarget: HTMLElement | null = null

  if (headerWidth !== undefined) {
    const headerCell = document.createElement('th')
    const resizeHandle = document.createElement('span')
    headerCell.appendChild(resizeHandle)
    vi.spyOn(headerCell, 'getBoundingClientRect').mockReturnValue({ width: headerWidth } as DOMRect)
    currentTarget = resizeHandle
  }

  return {
    clientX,
    currentTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent
}

function mountUseResize(options: Parameters<typeof useResize>[0]) {
  let api: ReturnType<typeof useResize> | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useResize(options)
        return () => null
      },
    }),
  )

  if (!api) {
    throw new Error('Failed to mount useResize test harness')
  }

  return {
    api,
    wrapper,
  }
}

describe('useResize', () => {
  it('updates width during drag and emits final width on pointerup', () => {
    const onResizeColumn = vi.fn()
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 120,
      resizable: true,
    }

    const { api: resize, wrapper } = mountUseResize({ onResizeColumn })
    const startEvent = createPointerEvent(100)

    resize.startResize(column, 0, startEvent)

    expect(startEvent.preventDefault).toHaveBeenCalled()
    expect(startEvent.stopPropagation).toHaveBeenCalled()
    expect(resize.isResizing.value).toBe(true)
    expect(document.body.style.cursor).toBe('col-resize')

    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 145 }))

    expect(resize.columnWidths.name).toBe(165)

    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 145 }))

    expect(onResizeColumn).toHaveBeenCalledWith(column, 165)
    expect(resize.isResizing.value).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')

    wrapper.unmount()
  })

  it('respects minWidth and maxWidth constraints', () => {
    const column: ColumnType<Record<string, unknown>> = {
      key: 'age',
      width: 120,
      minWidth: 100,
      maxWidth: 140,
      resizable: true,
    }

    const { api: resize, wrapper } = mountUseResize({})

    resize.startResize(column, 0, createPointerEvent(200))

    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 120 }))
    expect(resize.columnWidths.age).toBe(100)

    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 260 }))
    expect(resize.columnWidths.age).toBe(140)

    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 260 }))

    wrapper.unmount()
  })

  it('falls back to column index when no key or dataIndex is available', () => {
    const onResizeColumn = vi.fn()
    const column: ColumnType<Record<string, unknown>> = {
      title: 'Unnamed',
      width: 90,
      resizable: true,
    }

    const { api: resize, wrapper } = mountUseResize({ onResizeColumn })

    resize.startResize(column, 3, createPointerEvent(50))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 80 }))

    expect(resize.columnWidths['3']).toBe(120)

    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 80 }))
    expect(onResizeColumn).toHaveBeenCalledWith(column, 120)

    wrapper.unmount()
  })

  it.each([
    ['numeric width', 60],
    ['pixel width', '60px'],
    ['auto width', 'auto'],
    ['percentage width', '1%'],
    ['omitted width', undefined],
  ])('starts from the measured header width for %s', (_case, width) => {
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width,
      resizable: true,
    }

    const { api: resize, wrapper } = mountUseResize({})

    resize.startResize(column, 0, createPointerEvent(100, 240))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 125 }))

    expect(resize.columnWidths.name).toBe(265)

    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 125 }))
    wrapper.unmount()
  })

  it('falls back to a finite default when a non-numeric width cannot be measured', () => {
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 'auto',
      resizable: true,
    }

    const { api: resize, wrapper } = mountUseResize({})

    resize.startResize(column, 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 125 }))

    expect(resize.columnWidths.name).toBe(125)

    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 125 }))
    wrapper.unmount()
  })

  it('starts subsequent drags from the measured track, even after target expansion', () => {
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 60,
      minWidth: 160,
      resizable: true,
    }
    const { api: resize, wrapper } = mountUseResize({})
    resize.startResize(column, 0, createPointerEvent(100, 240))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 125 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 125 }))
    expect(resize.columnWidths.name).toBe(265)
    resize.startResize(column, 0, createPointerEvent(100, 300))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 110 }))
    expect(resize.columnWidths.name).toBe(310)
    expect(column.width).toBe(60)
    wrapper.unmount()
  })

  it.each([
    ['conflicting upper bound', 160, 80, 160],
    ['explicit zero', 0, undefined, 0],
    ['negative lower bound', -1, undefined, 50],
    ['NaN lower bound', Number.NaN, undefined, 50],
    ['infinite lower bound', Infinity, undefined, 50],
  ])('prioritizes valid lower bounds for %s', (_case, minWidth, maxWidth, expected) => {
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 120,
      minWidth,
      maxWidth,
      resizable: true,
    }
    const { api: resize, wrapper } = mountUseResize({})
    resize.startResize(column, 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: -500 }))
    expect(resize.columnWidths.name).toBe(expected)
    wrapper.unmount()
  })

  it('does not emit or establish an override when pointerdown/up has no effective movement', () => {
    const onResizeColumn = vi.fn()
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 120,
      resizable: true,
    }
    const { api: resize, wrapper } = mountUseResize({ onResizeColumn })
    resize.startResize(column, 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100 }))
    expect(onResizeColumn).not.toHaveBeenCalled()
    expect(resize.columnWidths.name).toBeUndefined()
    expect(resize.isResizing.value).toBe(false)
    wrapper.unmount()
  })

  it('uses the latest same-key configuration during dragging and emits the current column', () => {
    const onResizeColumn = vi.fn()
    const columns = reactiveColumns([{ key: 'name', width: 120, minWidth: 80, resizable: true }])
    const { api: resize, wrapper } = mountUseResize({
      columns: () => columns.value,
      onResizeColumn,
    })
    resize.startResize(columns.value[0], 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 110 }))
    columns.value = [{ key: 'name', width: 100, minWidth: 180, maxWidth: 140, resizable: true }]
    expect(resize.columnWidths.name).toBe(180)
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 140 }))
    expect(resize.columnWidths.name).toBe(180)
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 140 }))
    expect(onResizeColumn).toHaveBeenCalledWith(columns.value[0], 180)
    expect(columns.value[0].width).toBe(100)
    wrapper.unmount()
  })

  it('reclamps completed drag overrides and releases temporary lower bounds', () => {
    const columns = reactiveColumns([{ key: 'name', width: 120, minWidth: 80, resizable: true }])
    const { api: resize, wrapper } = mountUseResize({ columns: () => columns.value })
    resize.startResize(columns.value[0], 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 110 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 110 }))
    columns.value[0].minWidth = 180
    expect(resize.columnWidths.name).toBe(180)
    columns.value[0].minWidth = 100
    expect(resize.columnWidths.name).toBe(130)
    delete columns.value[0].minWidth
    expect(resize.columnWidths.name).toBe(130)
    wrapper.unmount()
  })

  it('keeps the accepted target after a dynamic upper bound and immutable width feedback', () => {
    const onResizeColumn = vi.fn()
    const columns = reactiveColumns([
      { key: 'name', width: 120, minWidth: 80, maxWidth: 300, resizable: true },
    ])
    const { api: resize, wrapper } = mountUseResize({
      columns: () => columns.value,
      onResizeColumn,
    })
    try {
      resize.startResize(columns.value[0], 0, createPointerEvent(100))
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 200 }))
      expect(resize.columnWidths.name).toBe(220)

      columns.value[0].maxWidth = 140
      expect(resize.columnWidths.name).toBe(140)
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 200 }))
      expect(onResizeColumn).toHaveBeenCalledWith(columns.value[0], 140)

      columns.value = [{ ...columns.value[0], width: 140 }]
      expect(resize.columnWidths.name).toBe(140)
      columns.value = [{ ...columns.value[0], maxWidth: 300, minWidth: 180 }]
      expect(resize.columnWidths.name).toBe(180)
      columns.value = [{ ...columns.value[0], minWidth: 80 }]
      expect(resize.columnWidths.name).toBe(140)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['removed', 'disabled'])('cancels an active drag when its column is %s', (change) => {
    const onResizeColumn = vi.fn()
    const columns = reactiveColumns([{ key: 'name', width: 120, resizable: true }])
    const { api: resize, wrapper } = mountUseResize({
      columns: () => columns.value,
      onResizeColumn,
    })
    resize.startResize(columns.value[0], 0, createPointerEvent(100))
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 110 }))
    if (change === 'removed') columns.value = []
    else columns.value[0].resizable = false
    expect(resize.isResizing.value).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
    if (change === 'removed') expect(resize.columnWidths.name).toBeUndefined()
    const widthAfterCancel = resize.columnWidths.name
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 180 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 180 }))
    expect(resize.columnWidths.name).toBe(widthAfterCancel)
    expect(onResizeColumn).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cleans up pointer listeners on unmount and restores existing body styles', () => {
    const onResizeColumn = vi.fn()
    const column: ColumnType<Record<string, unknown>> = {
      key: 'name',
      width: 120,
      resizable: true,
    }
    document.body.style.cursor = 'crosshair'
    document.body.style.userSelect = 'text'
    const { api: resize, wrapper } = mountUseResize({ onResizeColumn })
    resize.startResize(column, 0, createPointerEvent(100))
    wrapper.unmount()
    expect(resize.isResizing.value).toBe(false)
    expect(document.body.style.cursor).toBe('crosshair')
    expect(document.body.style.userSelect).toBe('text')
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 140 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 140 }))
    expect(resize.columnWidths.name).toBeUndefined()
    expect(onResizeColumn).not.toHaveBeenCalled()
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })
})
