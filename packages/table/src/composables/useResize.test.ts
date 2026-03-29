import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useResize } from './useResize'
import type { ColumnType } from '../types'

function createPointerEvent(clientX: number) {
  return {
    clientX,
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
})
