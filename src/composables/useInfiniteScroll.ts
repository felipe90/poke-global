/**
 * Infinite-scroll sentinel composable.
 * Observes a sentinel element (template ref) and fires `onLoadMore` when it
 * enters the viewport, guarded by `enabled` / `loadingMore` / `hasMore`.
 * Missing IntersectionObserver (jsdom, old browsers) is a safe no-op.
 */
import { ref } from 'vue'
import type { Ref } from 'vue'

type GuardValue = boolean | (() => boolean) | Ref<boolean>

export interface UseInfiniteScrollOptions {
  /** Whether infinite scroll is active at all (e.g. filter active keeps catalog mode off). */
  enabled: GuardValue
  /** True while a page/slice request is in flight — blocks duplicate triggers. */
  loadingMore: GuardValue
  /** True while a next page (`nextUrl`) or slice remains — false means exhausted. */
  hasMore: GuardValue
  /** Called once per viewport entry when every guard is open. */
  onLoadMore: () => void
  rootMargin?: string
  threshold?: number
}

function resolveGuard(value: GuardValue): boolean {
  if (typeof value === 'function') return value()
  if (typeof value === 'object' && value !== null && 'value' in value) return Boolean(value.value)
  return value
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const sentinel = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null
  let active = false

  function shouldTrigger(): boolean {
    return resolveGuard(options.enabled) && !resolveGuard(options.loadingMore) && resolveGuard(options.hasMore)
  }

  function observe(): void {
    disconnect()
    const target = sentinel.value
    if (typeof IntersectionObserver === 'undefined' || target === null) return

    active = true
    observer = new IntersectionObserver(
      (entries) => {
        if (!active || !shouldTrigger()) return
        if (entries.some((entry) => entry.isIntersecting)) {
          options.onLoadMore()
        }
      },
      { root: null, rootMargin: options.rootMargin, threshold: options.threshold },
    )
    observer.observe(target)
  }

  function disconnect(): void {
    active = false
    observer?.disconnect()
    observer = null
  }

  return { sentinel, observe, disconnect }
}
