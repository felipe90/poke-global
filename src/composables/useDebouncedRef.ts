/**
 * Debounced ref for local search: `value` updates immediately on write, while
 * `debounced` trails it by the trailing-edge delay (300 ms default).
 */
import { customRef, shallowRef } from 'vue'
import type { Ref } from 'vue'

export const DEBOUNCE_DELAY = 300

export function useDebouncedRef<T>(initialValue: T, delay = DEBOUNCE_DELAY): { value: Ref<T>; debounced: Readonly<Ref<T>> } {
  let current = initialValue
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = shallowRef<T>(initialValue)

  const value = customRef<T>((track, trigger) => ({
    get() {
      track()
      return current
    },
    set(next) {
      current = next
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        debounced.value = next
        timer = null
        trigger()
      }, delay)
    },
  }))

  return { value, debounced }
}
