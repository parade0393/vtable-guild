import { nextTick, onScopeDispose, watch, type Ref } from 'vue'

const motionProperties = [
  '--vtg-query-motion-start-height',
  '--vtg-query-motion-end-height',
] as const

function milliseconds(value: string) {
  return (Number.parseFloat(value) || 0) * (value.trim().endsWith('ms') ? 1 : 1000)
}

/** Animate the root so grid rows and native inline controls keep their natural sizing. */
export function useQueryCollapseMotion(
  root: Ref<HTMLElement | null>,
  collapsed: Readonly<Ref<boolean | undefined>>,
) {
  let generation = 0
  let cleanup: (() => void) | undefined

  function finish() {
    cleanup?.()
    cleanup = undefined
  }

  watch(
    collapsed,
    async (value, previous) => {
      // Read the painted height before cancelling an interrupted animation.
      const element = root.value
      const startHeight = element?.getBoundingClientRect().height ?? 0
      const current = ++generation
      finish()
      if (!element || !startHeight || value === undefined || previous === undefined) return

      await nextTick()
      if (current !== generation || root.value !== element) return
      // Reading the natural size also flushes cancellation before a new animation starts.
      const endHeight = element.getBoundingClientRect().height
      if (Math.abs(endHeight - startHeight) < 0.5) return

      element.style.setProperty(motionProperties[0], `${startHeight}px`)
      element.style.setProperty(motionProperties[1], `${endHeight}px`)
      element.setAttribute('data-query-motion', '')

      cleanup = () => {
        element.removeAttribute('data-query-motion')
        for (const property of motionProperties) element.style.removeProperty(property)
      }

      const style = element.ownerDocument.defaultView?.getComputedStyle(element)
      const duration = milliseconds(style?.animationDuration ?? '')
      if (!duration) {
        finish()
        return
      }
      const onEnd = (event: AnimationEvent) => {
        if (event.target === element && event.animationName === 'vtg-query-collapse') finish()
      }
      element.addEventListener('animationend', onEnd)
      // Also restore natural sizing if the animation is disabled or cancelled by custom CSS.
      const timer = setTimeout(finish, duration + milliseconds(style?.animationDelay ?? '') + 50)
      const reset = cleanup
      cleanup = () => {
        clearTimeout(timer)
        element.removeEventListener('animationend', onEnd)
        reset()
      }
    },
    { flush: 'pre' },
  )

  watch(root, () => {
    generation++
    finish()
  })

  onScopeDispose(() => {
    generation++
    finish()
  })
}
