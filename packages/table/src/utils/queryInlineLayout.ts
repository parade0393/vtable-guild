import { shallowRef, watch, type Ref } from 'vue'

interface QueryInlineLayoutOptions {
  width: number
  gap?: number
  actionsWidth?: number
  actionsWithToggleWidth?: number
}

/** Count consecutive fields that fit beside the actions, without splitting a form item. */
export function getQueryInlineLayout(
  fieldWidths: readonly number[],
  { width, gap = 0, actionsWidth = 0, actionsWithToggleWidth }: QueryInlineLayoutOptions,
) {
  const count = fieldWidths.length
  const gaps = Math.max(0, count + (actionsWidth > 0 ? 1 : 0) - 1) * gap
  const total = fieldWidths.reduce((sum, size) => sum + size, actionsWidth)

  // Hide the toggle if everything already fits without it. With no toggle there is no way to
  // reveal an overflow field; let the host form wrap all fields naturally in that case.
  if (actionsWithToggleWidth === undefined || total + gaps <= width) {
    return { collapsedCount: count, canCollapse: false }
  }

  let collapsedCount = 0
  let used = actionsWithToggleWidth
  for (const fieldWidth of fieldWidths) {
    const next = used + (collapsedCount > 0 || actionsWithToggleWidth > 0 ? gap : 0) + fieldWidth
    // Preserve access to the first field even if the action group must start a new row.
    if (collapsedCount > 0 && next > width) break
    collapsedCount++
    used = next
  }
  return { collapsedCount, canCollapse: collapsedCount < count }
}

function pixels(value: string) {
  return Number.parseFloat(value) || 0
}

function measureRow(row: HTMLElement) {
  const view = row.ownerDocument.defaultView
  if (!view) return
  const rowStyle = view.getComputedStyle(row)
  const width =
    row.getBoundingClientRect().width -
    pixels(rowStyle.paddingLeft) -
    pixels(rowStyle.paddingRight) -
    pixels(rowStyle.borderLeftWidth) -
    pixels(rowStyle.borderRightWidth)
  if (width <= 0) return

  const children = Array.from(row.children)
  const fields = children.filter((element) => element.hasAttribute('data-query-inline-field'))
  const actions = children.find((element) => element.hasAttribute('data-query-inline-actions'))
  const content = actions?.querySelector('[data-query-inline-action-content]')
  const buttons = content?.querySelector('[data-query-inline-buttons]')
  const toggle = content?.querySelector('[data-query-inline-toggle]')
  const outerWidth = (element: Element) => {
    const style = view.getComputedStyle(element)
    return (
      element.getBoundingClientRect().width + pixels(style.marginLeft) + pixels(style.marginRight)
    )
  }
  const gapWidth = (element: Element, basis: number) => {
    const gap = view.getComputedStyle(element).columnGap
    return gap.endsWith('%') ? (pixels(gap) * basis) / 100 : pixels(gap)
  }

  const actionOuterWidth = actions ? outerWidth(actions) : 0
  let actionsWidth = actionOuterWidth
  let actionsWithToggleWidth: number | undefined
  if (content && toggle) {
    const contentWidth = content.getBoundingClientRect().width
    const chrome = Math.max(0, actionOuterWidth - contentWidth)
    const buttonsWidth = buttons ? outerWidth(buttons) : 0
    const toggleWidth = outerWidth(toggle)
    actionsWidth = buttonsWidth > 0 ? chrome + buttonsWidth : 0
    actionsWithToggleWidth = chrome + buttonsWidth + toggleWidth
    if (buttonsWidth > 0 && toggleWidth > 0) {
      actionsWithToggleWidth += gapWidth(content, contentWidth)
    }
  }

  const targets = [row, ...fields, actions, content, buttons, toggle].filter(
    (target): target is Element => !!target,
  )
  return {
    targets,
    layout: getQueryInlineLayout(fields.map(outerWidth), {
      width,
      gap: gapWidth(row, width),
      actionsWidth,
      actionsWithToggleWidth,
    }),
  }
}

/** Measure both visible and out-of-flow items. Hidden items must retain their intrinsic widths. */
export function useQueryInlineLayout(row: Ref<HTMLElement | null>) {
  const layout = shallowRef<ReturnType<typeof getQueryInlineLayout>>()
  watch(
    row,
    (element, _, onCleanup) => {
      layout.value = undefined
      if (!element) return

      const rowElement = element
      let targets = new Set<Element>()
      const view = rowElement.ownerDocument.defaultView
      let frame: number | undefined
      let disposed = false
      const scheduleMeasure = () => {
        if (disposed || frame !== undefined) return
        if (!view) {
          measure()
          return
        }
        frame = view.requestAnimationFrame(() => {
          frame = undefined
          if (!disposed) measure()
        })
      }
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleMeasure)
      const mutations =
        typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(scheduleMeasure)

      function measure() {
        const result = measureRow(rowElement)
        if (!result) return
        const nextTargets = new Set(result.targets)
        for (const target of targets) if (!nextTargets.has(target)) observer?.unobserve(target)
        for (const target of nextTargets) if (!targets.has(target)) observer?.observe(target)
        targets = nextTargets
        if (
          layout.value?.collapsedCount !== result.layout.collapsedCount ||
          layout.value.canCollapse !== result.layout.canCollapse
        ) {
          layout.value = result.layout
        }
      }

      observer?.observe(element)
      mutations?.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        // Dynamic hidden predicates update these attributes without replacing the field node.
        attributeFilter: ['class', 'style', 'hidden', 'data-query-inline-field'],
      })
      measure()

      onCleanup(() => {
        disposed = true
        if (frame !== undefined) view?.cancelAnimationFrame(frame)
        observer?.disconnect()
        mutations?.disconnect()
      })
    },
    { flush: 'post' },
  )
  return layout
}
