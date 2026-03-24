export function useAnimatedNumber(
  target: Ref<number> | ComputedRef<number>,
  options: { duration?: number; delay?: number } = {},
) {
  const { duration = 900, delay = 0 } = options
  const display = ref(0)
  let raf: number | undefined

  function animate(from: number, to: number) {
    if (raf) cancelAnimationFrame(raf)
    const start = performance.now() + delay
    function tick(now: number) {
      const elapsed = now - start
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      display.value = from + (to - from) * eased
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  watch(
    () => unref(target),
    (newVal, oldVal) => {
      animate(oldVal ?? 0, newVal)
    },
  )

  return display
}
