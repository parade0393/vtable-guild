import { ref } from 'vue'
import type { ComputedRef } from 'vue'

export default function useOriginScroll(
  isScrollAtTop: ComputedRef<boolean>,
  isScrollAtBottom: ComputedRef<boolean>,
  isScrollAtLeft: ComputedRef<boolean>,
  isScrollAtRight: ComputedRef<boolean>,
) {
  const lockRef = ref(false)
  let lockTimeout: ReturnType<typeof setTimeout> | null = null

  function lockScroll() {
    if (lockTimeout) clearTimeout(lockTimeout)
    lockRef.value = true
    lockTimeout = setTimeout(() => {
      lockRef.value = false
    }, 50)
  }

  return (isHorizontal: boolean, delta: number, _smoothOffset = false): boolean => {
    const originScroll = isHorizontal
      ? (delta < 0 && isScrollAtLeft.value) || (delta > 0 && isScrollAtRight.value)
      : (delta < 0 && isScrollAtTop.value) || (delta > 0 && isScrollAtBottom.value)

    if (_smoothOffset && originScroll) {
      if (lockTimeout) clearTimeout(lockTimeout)
      lockRef.value = false
    } else if (!originScroll || lockRef.value) {
      lockScroll()
    }

    return !lockRef.value && originScroll
  }
}
