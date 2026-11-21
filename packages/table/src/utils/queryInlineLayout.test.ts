import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { getQueryInlineLayout, useQueryInlineLayout } from './queryInlineLayout'

describe('native inline query layout', () => {
  it('shows all fields if they fit alongside the actions without an expand button', () => {
    expect(
      getQueryInlineLayout([160, 100], {
        width: 400,
        gap: 10,
        actionsWidth: 120,
        actionsWithToggleWidth: 180,
      }),
    ).toEqual({ collapsedCount: 2, canCollapse: false })
  })

  it('reserves space for expand and keeps fields in schema order', () => {
    expect(
      getQueryInlineLayout([150, 170, 20], {
        width: 450,
        gap: 10,
        actionsWidth: 120,
        actionsWithToggleWidth: 180,
      }),
    ).toEqual({ collapsedCount: 1, canCollapse: true })
  })

  it('keeps the first field when the actions must wrap', () => {
    expect(
      getQueryInlineLayout([200, 90], {
        width: 260,
        gap: 10,
        actionsWidth: 120,
        actionsWithToggleWidth: 180,
      }),
    ).toEqual({ collapsedCount: 1, canCollapse: true })
  })

  it('allows all fields to wrap when no expand action is available', () => {
    expect(getQueryInlineLayout([200, 90], { width: 200, gap: 10, actionsWidth: 120 })).toEqual({
      collapsedCount: 2,
      canCollapse: false,
    })
  })

  it('fits fields at the exact available width including inter-item gaps', () => {
    expect(
      getQueryInlineLayout([180, 100, 100], {
        width: 470,
        gap: 20,
        actionsWidth: 120,
        actionsWithToggleWidth: 150,
      }),
    ).toEqual({ collapsedCount: 2, canCollapse: true })
  })

  it('remeasures when field content changes and includes the action toggle only when needed', async () => {
    function measureWidth(element: Element, width: number) {
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, width, 32))
    }

    const row = document.createElement('div')
    row.style.columnGap = '10px'
    row.innerHTML = `
      <div data-query-inline-field>Short label</div>
      <div data-query-inline-field>Another field</div>
      <div data-query-inline-actions>
        <div data-query-inline-action-content style="column-gap: 10px">
          <div data-query-inline-buttons>Reset Search</div>
          <button data-query-inline-toggle>Expand</button>
        </div>
      </div>
    `
    const firstField = row.children[0]!
    measureWidth(row, 360)
    measureWidth(firstField, 100)
    measureWidth(row.children[1]!, 100)
    measureWidth(row.children[2]!, 120)
    measureWidth(row.querySelector('[data-query-inline-action-content]')!, 100)
    measureWidth(row.querySelector('[data-query-inline-buttons]')!, 100)
    measureWidth(row.querySelector('[data-query-inline-toggle]')!, 60)
    document.body.append(row)

    const scope = effectScope()
    try {
      const rowRef = ref<HTMLElement | null>(null)
      const layout = scope.run(() => useQueryInlineLayout(rowRef))!
      rowRef.value = row
      await nextTick()
      expect(layout.value).toEqual({ collapsedCount: 2, canCollapse: false })

      measureWidth(firstField, 170)
      firstField.textContent = 'A much longer translated label'
      await vi.waitFor(() => expect(layout.value).toEqual({ collapsedCount: 1, canCollapse: true }))
    } finally {
      scope.stop()
    }
  })

  it('responds to container resize and dynamic hidden fields, and releases observers on removal', async () => {
    const row = document.createElement('div')
    row.innerHTML = `
      <div data-query-inline-field>Username</div>
      <div data-query-inline-field>Status</div>
      <div data-query-inline-actions>
        <div data-query-inline-action-content>
          <div data-query-inline-buttons>Reset Search</div>
          <button data-query-inline-toggle>Expand</button>
        </div>
      </div>
    `
    let width = 600
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, width, 32))
    const firstField = row.children[0]!
    const secondField = row.children[1]!
    const fixedWidth = (element: Element, size: number) =>
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, size, 32))
    fixedWidth(firstField, 150)
    fixedWidth(secondField, 150)
    fixedWidth(row.children[2]!, 120)
    fixedWidth(row.querySelector('[data-query-inline-action-content]')!, 120)
    fixedWidth(row.querySelector('[data-query-inline-buttons]')!, 120)
    fixedWidth(row.querySelector('[data-query-inline-toggle]')!, 60)
    document.body.append(row)

    const observe = vi.fn()
    const unobserve = vi.fn()
    const disconnect = vi.fn()
    let resize!: () => void
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe = observe
        unobserve = unobserve
        disconnect = disconnect
      },
    )
    const scope = effectScope()
    try {
      const rowRef = ref<HTMLElement | null>(null)
      const layout = scope.run(() => useQueryInlineLayout(rowRef))!
      rowRef.value = row
      await nextTick()
      expect(layout.value).toEqual({ collapsedCount: 2, canCollapse: false })
      expect(observe).toHaveBeenCalledWith(secondField)

      width = 400
      resize()
      await vi.waitFor(() => expect(layout.value).toEqual({ collapsedCount: 1, canCollapse: true }))

      secondField.removeAttribute('data-query-inline-field')
      secondField.setAttribute('hidden', '')
      await vi.waitFor(() =>
        expect(layout.value).toEqual({ collapsedCount: 1, canCollapse: false }),
      )
      expect(unobserve).toHaveBeenCalledWith(secondField)

      // A pending browser resize must not remeasure a detached component.
      resize()
      rowRef.value = null
      await nextTick()
      expect(disconnect).toHaveBeenCalledOnce()
      expect(layout.value).toBeUndefined()
    } finally {
      scope.stop()
      vi.unstubAllGlobals()
    }
  })
})
