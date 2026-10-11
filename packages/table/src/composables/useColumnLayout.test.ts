import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, reactive, ref, shallowRef } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnType, TableLayout } from '../types'
import { useColumnLayout, type ColumnLayout } from './useColumnLayout'

type Column = ColumnType<Record<string, unknown>>

const wrappers: VueWrapper[] = []

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  vi.unstubAllGlobals()
})

function mountLayout(initial: Column[], initialLayout: TableLayout = 'fixed', split = false) {
  const columns = shallowRef(initial)
  const layout = ref(initialLayout)
  const scrollX = ref<number | string>()
  const columnWidths = reactive<Record<string, number>>({})
  const root = document.createElement('div')
  const viewport = document.createElement('div')
  root.append(viewport)
  const table = document.createElement('table')
  table.dataset.vtgTable = ''
  viewport.append(table)
  const tracks = table.createTBody()
  tracks.dataset.vtgWidthRow = ''
  const row = tracks.insertRow()
  initial.forEach((_column, index) => {
    const cell = row.insertCell()
    cell.dataset.vtgTrack = String(index)
  })

  let viewportWidth = 400
  let scrollWidth = 400
  Object.defineProperties(viewport, {
    clientWidth: { get: () => viewportWidth },
    scrollWidth: { get: () => scrollWidth },
  })
  const measuredWidths = initial.map(() => 100)
  const referenceWidths: Record<string, number[]> = {}
  const referenceImages = new Set<HTMLImageElement>()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.style.width === 'calc(50% - 20px)') {
      return {
        width: Number.parseFloat(this.parentElement?.style.width ?? '0') / 2 - 20,
      } as DOMRect
    }
    const index = Number(this.dataset.vtgTrack)
    const table = this.closest('table')
    if (this.closest('[inert]'))
      table?.querySelectorAll('img').forEach((image) => referenceImages.add(image))
    const widths = this.closest('[inert]')
      ? (referenceWidths[table?.style.width ?? ''] ?? referenceWidths.default ?? measuredWidths)
      : measuredWidths
    return { width: Number.isInteger(index) ? widths[index] : 0 } as DOMRect
  })

  let frameId = 0
  const frames = new Map<number, FrameRequestCallback>()
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    frameId += 1
    frames.set(frameId, callback)
    return frameId
  })
  const cancelFrame = vi.fn((id: number) => frames.delete(id))
  vi.stubGlobal('requestAnimationFrame', requestFrame)
  vi.stubGlobal('cancelAnimationFrame', cancelFrame)
  const observed = new Set<Element>()
  const disconnectResize = vi.fn(() => observed.clear())
  const disconnectMutation = vi.fn()
  let notifyResize = () => {}
  let notifyMutation = (_records: MutationRecord[]) => {}
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notifyResize = callback
      }
      observe(element: Element) {
        observed.add(element)
      }
      disconnect = disconnectResize
    },
  )
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: (records: MutationRecord[]) => void) {
        notifyMutation = callback
      }
      observe() {}
      disconnect = disconnectMutation
    },
  )
  const onMeasure = vi.fn()
  let api!: ColumnLayout
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useColumnLayout({
          columns: () => columns.value,
          columnWidths,
          layout: () => layout.value,
          split: () => split,
          root: () => root,
          viewport: () => viewport,
          scrollX: () => scrollX.value,
          onMeasure,
        })
        return () => null
      },
    }),
  )
  wrappers.push(wrapper)
  function flushFrame() {
    const pending = [...frames.values()]
    frames.clear()
    for (const callback of pending) callback(0)
  }
  return {
    api,
    columns,
    columnWidths,
    scrollX,
    wrapper,
    root,
    viewport,
    measuredWidths,
    referenceWidths,
    referenceImages,
    frames,
    requestFrame,
    cancelFrame,
    observed,
    disconnectResize,
    disconnectMutation,
    onMeasure,
    flushFrame,
    notifyResize: () => notifyResize(),
    notifyMutation: (records: MutationRecord[]) => notifyMutation(records),
    resize: (width: number, contentWidth = width) => {
      viewportWidth = width
      scrollWidth = contentWidth
      notifyResize()
    },
  }
}

describe('useColumnLayout', () => {
  const minimumColumns: Column[] = [
    { key: 'a', minWidth: 160 },
    { key: 'b', minWidth: 100 },
    { key: 'c', minWidth: 240 },
  ]

  it('allocates fixed widths from the viewport and releases overflow when it grows', () => {
    const state = mountLayout(minimumColumns)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [160, 100, 240], total: 500 })
    expect(state.api.tableStyle.value).toEqual({
      tableLayout: 'fixed',
      width: '500px',
      minWidth: '500px',
    })
    expect(state.api.overflow.value).toBe(true)
    state.resize(600)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [180, 180, 240], total: 600 })
    expect(state.api.columnStyle(0, 2)).toEqual({ width: '360px', minWidth: '260px' })
    expect(state.api.overflow.value).toBe(false)
    state.resize(900)
    state.flushFrame()
    expect(state.api.metrics.value?.widths).toEqual([300, 300, 300])
  })

  it('preserves the legacy path without any effective explicit minimum', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = mountLayout([
      { key: 'a', width: 100 },
      { key: 'b', minWidth: -1 },
    ])
    expect(state.api.enabled.value).toBe(false)
    expect(state.api.metrics.value).toBeNull()
    expect(state.api.tableStyle.value).toEqual({})
    expect(state.api.columnStyle(0)).toEqual({})
    expect(state.requestFrame).not.toHaveBeenCalled()
    expect(state.observed.size).toBe(0)
  })

  it('treats explicit zero as a valid lower bound without adding a drag default', () => {
    const state = mountLayout([{ key: 'a', minWidth: 0 }, { key: 'b' }])
    state.resize(40)
    state.flushFrame()
    expect(state.api.enabled.value).toBe(true)
    expect(state.api.minimums.value).toEqual([0, 0])
    expect(state.api.metrics.value).toEqual({ widths: [20, 20], total: 40 })
  })

  it('resolves CSS column expressions against the stable table target width', async () => {
    const state = mountLayout([
      { key: 'a', minWidth: 100, width: 'calc(50% - 20px)' },
      { key: 'b', minWidth: 0 },
    ])
    state.scrollX.value = 800
    await nextTick()
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [380, 420], total: 800 })
  })

  it('keeps single-table auto widths intrinsic after measured widths are committed', async () => {
    const state = mountLayout(
      [
        { key: 'a', minWidth: 100 },
        { key: 'b', minWidth: 80 },
      ],
      'auto',
    )
    state.measuredWidths.splice(0, 2, 250, 150)
    state.flushFrame()
    await nextTick()
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [250, 150], total: 400 })
    expect(state.api.synchronized.value).toBe(false)
    expect(state.api.columnStyle(0)).toEqual({ minWidth: '100px' })
    expect(state.api.columnStyle(1)).toEqual({ minWidth: '80px' })
    expect(state.api.tableStyle.value).toEqual({ minWidth: 'max(100%, 180px)' })
    state.measuredWidths.splice(0, 2, 160, 240)
    state.notifyResize()
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [160, 240], total: 400 })
    expect(state.api.columnStyle(0)).toEqual({ minWidth: '100px' })
  })

  it('commits single-auto display tracks after content targets render instead of reference tracks', async () => {
    const state = mountLayout(
      [
        { key: 'a', minWidth: 160, width: 'max-content', fixed: 'left' },
        { key: 'b', minWidth: 100, width: 60, fixed: 'left' },
        { key: 'c', minWidth: 240 },
      ],
      'auto',
    )
    state.scrollX.value = 1200
    state.referenceWidths['max-content'] = [160, 100, 240]
    state.referenceWidths.default = [440, 100, 660]
    state.measuredWidths.splice(0, 3, 440, 100, 660)
    await nextTick()
    state.flushFrame()
    expect(state.api.columnStyle(0)).toEqual({ width: '160px', minWidth: '160px' })
    expect(state.api.metrics.value).toBeNull()
    expect(state.onMeasure).not.toHaveBeenCalled()

    // The display table applies its resolved content width during Vue's render.
    await nextTick()
    state.measuredWidths.splice(0, 3, 160, 100, 940)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [160, 100, 940], total: 1200 })
    expect(state.onMeasure).toHaveBeenCalledTimes(1)
    expect(state.frames.size).toBe(0)
  })

  it('waits for resolved CSS targets before committing single-auto display tracks', async () => {
    const state = mountLayout(
      [
        { key: 'a', minWidth: 100, width: 'calc(50% - 20px)' },
        { key: 'b', minWidth: 0 },
      ],
      'auto',
    )
    state.scrollX.value = 800
    await nextTick()
    state.flushFrame()
    expect(state.api.columnStyle(0)).toEqual({ width: '380px', minWidth: '100px' })
    expect(state.api.metrics.value).toBeNull()
    await nextTick()
    state.measuredWidths.splice(0, 2, 380, 420)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [380, 420], total: 800 })
  })

  it('keeps unmeasurable content targets flexible until a reference exists', () => {
    const state = mountLayout([
      { key: 'a', minWidth: 100, width: 'max-content' },
      { key: 'b', minWidth: 0 },
    ])
    state.root.querySelector('table')?.remove()
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [200, 200], total: 400 })
  })

  it('uses the content column track rather than the whole reference table width', () => {
    const state = mountLayout([
      { key: 'a', minWidth: 100, width: 'max-content' },
      { key: 'b', minWidth: 0 },
    ])
    state.measuredWidths.splice(0, 2, 250, 150)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [250, 150], total: 400 })
  })

  it('shares reference measurements across split auto tables and clears its probe DOM', () => {
    const state = mountLayout(
      [
        { key: 'a', minWidth: 100 },
        { key: 'b', minWidth: 80 },
      ],
      'auto',
      true,
    )
    state.measuredWidths.splice(0, 2, 250, 150)
    state.flushFrame()
    expect(state.api.synchronized.value).toBe(true)
    expect(state.api.metrics.value).toEqual({ widths: [250, 150], total: 400 })
    expect(state.api.columnStyle(0)).toEqual({ minWidth: '100px', width: '250px' })
    expect(state.api.columnStyle(1)).toEqual({ minWidth: '80px', width: '150px' })
    expect(state.root.querySelectorAll('table')).toHaveLength(1)
    expect(state.root.querySelector('[inert]')).toBeNull()
  })

  it('recalculates after lower bounds change, reorder or disappear', async () => {
    const state = mountLayout(minimumColumns)
    state.flushFrame()
    state.columns.value = [
      { key: 'c', minWidth: 100 },
      { key: 'a', minWidth: 0 },
    ]
    await nextTick()
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [200, 200], total: 400 })
    expect(state.api.minimums.value).toEqual([100, 0])
    expect(state.api.overflow.value).toBe(false)
    state.columns.value = [{ key: 'c' }, { key: 'a' }]
    await nextTick()
    expect(state.api.enabled.value).toBe(false)
    expect(state.api.metrics.value).toBeNull()
    expect(state.api.columnStyle(0)).toEqual({})
    expect(state.api.tableStyle.value).toEqual({})
    expect(state.observed.size).toBe(0)
  })

  it('invalidates old auto measurements when lower bounds shrink', async () => {
    const state = mountLayout(
      [
        { key: 'a', minWidth: 300 },
        { key: 'b', minWidth: 200 },
      ],
      'auto',
    )
    state.measuredWidths.splice(0, 2, 300, 200)
    state.flushFrame()
    await nextTick()
    state.flushFrame()
    state.columns.value = [
      { key: 'a', minWidth: 80 },
      { key: 'b', minWidth: 80 },
    ]
    await nextTick()
    expect(state.api.metrics.value).toBeNull()
    state.measuredWidths.splice(0, 2, 200, 200)
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [200, 200], total: 400 })
    expect(state.api.tableStyle.value).toEqual({ minWidth: 'max(100%, 160px)' })
  })

  it('remeasures split-auto intrinsic widths when an existing image finishes loading', () => {
    const state = mountLayout(minimumColumns, 'auto', true)
    const image = document.createElement('img')
    image.height = 16
    state.viewport.querySelector('td')?.append(image)
    state.measuredWidths.splice(0, 3, 160, 100, 240)
    state.flushFrame()
    expect(state.api.metrics.value?.widths).toEqual([160, 100, 240])

    // Container dimensions remain unchanged; load alone must invalidate the clone.
    state.measuredWidths.splice(0, 3, 833, 100, 240)
    image.dispatchEvent(new Event('load'))
    state.flushFrame()
    expect(state.api.metrics.value).toEqual({ widths: [833, 100, 240], total: 1173 })
    expect(state.api.columnStyle(0)).toEqual({ width: '833px', minWidth: '160px' })
    expect(state.api.tableStyle.value.width).toBe('1173px')
    expect(state.frames.size).toBe(0)
    const removeResourceListener = vi.spyOn(state.root, 'removeEventListener')
    state.wrapper.unmount()
    expect(removeResourceListener).toHaveBeenCalledWith('load', expect.any(Function), true)
    expect(removeResourceListener).toHaveBeenCalledWith('error', expect.any(Function), true)
    image.dispatchEvent(new Event('load'))
    expect(state.frames.size).toBe(0)
  })

  it('coalesces resource attribute/load changes and ignores probe or geometry writes', () => {
    const state = mountLayout(minimumColumns, 'auto', true)
    state.flushFrame()
    const image = document.createElement('img')
    state.viewport.querySelector('td')?.append(image)
    state.notifyMutation([
      { type: 'attributes', target: image, attributeName: 'src' } as unknown as MutationRecord,
      { type: 'attributes', target: image, attributeName: 'width' } as unknown as MutationRecord,
    ])
    image.dispatchEvent(new Event('load'))
    expect(state.frames.size).toBe(1)
    state.flushFrame()
    expect(state.onMeasure).toHaveBeenCalledTimes(2)

    const probe = document.createElement('div')
    probe.inert = true
    const clonedImage = image.cloneNode() as HTMLImageElement
    const clonedText = document.createTextNode('measurement')
    probe.append(clonedImage, clonedText)
    state.root.append(probe)
    clonedImage.dispatchEvent(new Event('load'))
    state.notifyMutation([
      { type: 'attributes', target: image, attributeName: 'style' } as unknown as MutationRecord,
      {
        type: 'attributes',
        target: state.root,
        attributeName: 'width',
      } as unknown as MutationRecord,
      {
        type: 'attributes',
        target: clonedImage,
        attributeName: 'src',
      } as unknown as MutationRecord,
      {
        type: 'characterData',
        target: clonedText,
        addedNodes: [],
        removedNodes: [],
      } as unknown as MutationRecord,
    ])
    expect(state.frames.size).toBe(0)
    // Failure can release intrinsic width just as a successful load can grow it.
    state.measuredWidths.splice(0, 3, 160, 100, 240)
    image.dispatchEvent(new Event('error'))
    state.flushFrame()
    expect(state.api.metrics.value?.widths).toEqual([160, 100, 240])
    expect(state.frames.size).toBe(0)
  })

  it('preserves decoded image natural dimensions in an unloaded clone without fixing CSS sizes', () => {
    const state = mountLayout(minimumColumns, 'auto', true)
    const body = document.createElement('tbody')
    const cell = body.insertRow().insertCell()
    cell.dataset.vtgCol = '0'
    const images = [
      'height:16px;width:auto',
      'width:50%;height:auto;aspect-ratio:2/1',
      '',
      'contain:size;contain-intrinsic-size:90px 30px',
      'contain:layout paint',
    ].map((css) => {
      const image = document.createElement('img')
      image.style.cssText = css
      Object.defineProperties(image, {
        naturalWidth: { value: 800 },
        naturalHeight: { value: 16 },
      })
      cell.append(image)
      return image
    })
    images[2].setAttribute('width', '80')
    images[2].setAttribute('height', '40')
    const originalStyles = images.map((image) => image.getAttribute('style'))
    state.viewport.querySelector('table')?.append(body)
    document.body.append(state.root)
    state.flushFrame()
    const clones = [...state.referenceImages]
    expect(clones).toHaveLength(5)
    expect(clones[0].naturalWidth).toBe(0)
    expect(clones[0].style.containIntrinsicSize).toBe('800px 16px')
    expect(clones[0].style.aspectRatio).toBe('auto 800 / 16')
    expect(clones[0].style.width).toBe('auto')
    expect(clones[0].style.height).toBe('16px')
    expect(clones[1].style.width).toBe('50%')
    expect(clones[1].style.height).toBe('auto')
    expect(clones[1].style.aspectRatio).toBe(images[1].style.aspectRatio)
    expect(clones[2].getAttribute('width')).toBe('80')
    expect(clones[2].getAttribute('height')).toBe('40')
    expect(clones[2].style.width).toBe('')
    expect(clones[2].style.height).toBe('')
    expect(clones[3].style.containIntrinsicSize).toBe('90px 30px')
    expect(clones[4].style.contain).toBe('layout paint size')
    expect(images.map((image) => image.getAttribute('style'))).toEqual(originalStyles)
    expect(state.frames.size).toBe(0)

    // Engines that already reuse the decoded resource keep the original styles.
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800)
    state.referenceImages.clear()
    state.notifyResize()
    state.flushFrame()
    expect([...state.referenceImages][0].style.contain).toBe(images[0].style.contain)
    expect([...state.referenceImages][0].style.containIntrinsicSize).toBe('')
  })

  it('releases overflow state when the last minimum is removed', async () => {
    const state = mountLayout([{ key: 'a', minWidth: 500 }])
    state.flushFrame()
    expect(state.api.overflow.value).toBe(true)
    state.columns.value = [{ key: 'a' }]
    await nextTick()
    state.flushFrame()
    expect(state.api.enabled.value).toBe(false)
    expect(state.api.overflow.value).toBe(false)
  })

  it('merges resize and content invalidations into one frame and cleans up on unmount', () => {
    const state = mountLayout(minimumColumns)
    state.notifyResize()
    state.notifyResize()
    state.api.remeasure()
    state.notifyMutation([
      { target: state.viewport, addedNodes: [], removedNodes: [] } as unknown as MutationRecord,
    ])
    expect(state.frames.size).toBe(1)
    expect(state.requestFrame).toHaveBeenCalledTimes(1)
    state.flushFrame()
    expect(state.onMeasure).toHaveBeenCalledTimes(1)
    state.notifyResize()
    expect(state.frames.size).toBe(1)
    state.wrapper.unmount()
    expect(state.cancelFrame).toHaveBeenCalledTimes(1)
    expect(state.frames.size).toBe(0)
    expect(state.disconnectResize).toHaveBeenCalled()
    expect(state.disconnectMutation).toHaveBeenCalled()
    state.notifyResize()
    state.api.remeasure()
    expect(state.frames.size).toBe(0)
  })

  it('does not republish subpixel measurement noise or react to its own probe mutation', async () => {
    const state = mountLayout([{ minWidth: 100 }, { minWidth: 80 }], 'auto')
    state.measuredWidths.splice(0, 2, 200, 200)
    state.flushFrame()
    await nextTick()
    state.flushFrame()
    const committed = state.api.metrics.value
    state.measuredWidths.splice(0, 2, 200.04, 199.96)
    state.notifyResize()
    state.flushFrame()
    expect(state.api.metrics.value).toBe(committed)
    const probe = document.createElement('div')
    probe.inert = true
    state.notifyMutation([
      { target: state.root, addedNodes: [probe], removedNodes: [] } as unknown as MutationRecord,
    ])
    expect(state.frames.size).toBe(0)
  })
})
