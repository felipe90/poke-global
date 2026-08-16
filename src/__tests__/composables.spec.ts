import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useClipboard } from '@/composables/useClipboard'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

type IntersectionCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void

interface MockObserver {
  callback: IntersectionCallback
  target: Element | null
  disconnected: boolean
}

const observerInstances: MockObserver[] = []

function stubIntersectionObserver(): void {
  class IntersectionObserverMock {
    callback: IntersectionCallback
    target: Element | null = null
    disconnected = false

    constructor(callback: IntersectionCallback) {
      this.callback = callback
      observerInstances.push(this)
    }

    observe(target: Element): void {
      this.target = target
    }

    unobserve(): void {}

    disconnect(): void {
      this.disconnected = true
    }
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
}

function triggerIntersection(observer: MockObserver, isIntersecting: boolean): void {
  observer.callback([{ isIntersecting, target: observer.target ?? (null as unknown as Element) }])
}

/** Point the sentinel at a real element and start observing. */
function mountAndObserve(sentinel: { value: HTMLElement | null }): void {
  sentinel.value = document.createElement('div')
}

function stubClipboard(clipboard: unknown): void {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: clipboard,
  })
}

function stubExecCommand(impl: () => boolean): ReturnType<typeof vi.fn> {
  const exec = vi.fn<() => boolean>(impl)
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    writable: true,
    value: exec,
  })
  return exec
}

describe('useInfiniteScroll (2.6)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    observerInstances.length = 0
  })

  it('calls onLoadMore exactly once when the sentinel intersects with all guards open', () => {
    stubIntersectionObserver()
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore: true,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()

    expect(observerInstances).toHaveLength(1)
    triggerIntersection(observerInstances[0]!, true)

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not trigger again while loadingMore is true, then resumes once it flips back', () => {
    stubIntersectionObserver()
    const loadingMore = ref(false)
    const onLoadMore = vi.fn<() => void>(() => {
      loadingMore.value = true
    })
    const { sentinel, observe } = useInfiniteScroll({
      enabled: true,
      loadingMore,
      hasMore: true,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()
    const instance = observerInstances[0]!

    triggerIntersection(instance, true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    triggerIntersection(instance, true)
    triggerIntersection(instance, true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    loadingMore.value = false
    triggerIntersection(instance, true)
    expect(onLoadMore).toHaveBeenCalledTimes(2)
  })

  it('never triggers when the catalog is exhausted (hasMore false)', () => {
    stubIntersectionObserver()
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore: false,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()

    triggerIntersection(observerInstances[0]!, true)
    triggerIntersection(observerInstances[0]!, true)

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('never triggers when disabled even while intersecting', () => {
    stubIntersectionObserver()
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe } = useInfiniteScroll({
      enabled: false,
      loadingMore: false,
      hasMore: true,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()

    triggerIntersection(observerInstances[0]!, true)

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('reacts to a hasMore ref turning true after observation starts', () => {
    stubIntersectionObserver()
    const hasMore = ref(false)
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()

    triggerIntersection(observerInstances[0]!, true)
    expect(onLoadMore).not.toHaveBeenCalled()

    hasMore.value = true
    triggerIntersection(observerInstances[0]!, true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when IntersectionObserver is missing (no crash, no trigger)', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe, disconnect } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore: true,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    expect(() => {
      observe()
      disconnect()
      observe()
    }).not.toThrow()

    expect(observerInstances).toHaveLength(0)
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('disconnect stops the active observer from firing further callbacks', () => {
    stubIntersectionObserver()
    const onLoadMore = vi.fn<() => void>()
    const { sentinel, observe, disconnect } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore: true,
      onLoadMore,
    })

    mountAndObserve(sentinel)
    observe()
    const instance = observerInstances[0]!

    triggerIntersection(instance, true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    disconnect()
    triggerIntersection(instance, true)

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('observe never triggers while the sentinel has no element yet', () => {
    stubIntersectionObserver()
    const onLoadMore = vi.fn<() => void>()
    const { observe } = useInfiniteScroll({
      enabled: true,
      loadingMore: false,
      hasMore: true,
      onLoadMore,
    })

    observe()
    expect(observerInstances).toHaveLength(0)
    expect(onLoadMore).not.toHaveBeenCalled()
  })
})

describe('useDebouncedRef (2.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the immediate value and a copy that lags behind by the debounce delay', () => {
    const { value, debounced } = useDebouncedRef('initial')

    expect(value.value).toBe('initial')
    expect(debounced.value).toBe('initial')

    value.value = 'pika'
    expect(value.value).toBe('pika')

    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe('initial')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('pika')
  })

  it('collapses rapid successive writes to the last value (trailing edge)', () => {
    const { value, debounced } = useDebouncedRef('')

    value.value = 'p'
    vi.advanceTimersByTime(100)
    value.value = 'pi'
    vi.advanceTimersByTime(100)
    value.value = 'pik'
    vi.advanceTimersByTime(100)
    value.value = 'pika'
    vi.advanceTimersByTime(100)
    expect(debounced.value).toBe('')

    vi.advanceTimersByTime(200)
    expect(debounced.value).toBe('pika')
  })

  it('honors a custom delay', () => {
    const { value, debounced } = useDebouncedRef('a', 500)

    value.value = 'b'
    vi.advanceTimersByTime(499)
    expect(debounced.value).toBe('a')

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('b')
  })
})

describe('useClipboard (2.8)', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined)
    stubClipboard({ writeText })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete (document as unknown as { execCommand?: unknown }).execCommand
  })

  it('copies via navigator.clipboard.writeText when available', async () => {
    const { copy } = useClipboard()

    const status = await copy('pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90')

    expect(writeText).toHaveBeenCalledWith('pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90')
    expect(status).toBe('success')
  })

  it('falls back to execCommand(copy) when the Clipboard API is unavailable', async () => {
    stubClipboard(undefined)
    const exec = stubExecCommand(() => true)
    const { copy } = useClipboard()

    const status = await copy('bulbasaur, grass, poison')

    expect(exec).toHaveBeenCalledWith('copy')
    expect(writeText).not.toHaveBeenCalled()
    expect(status).toBe('success')
  })

  it('falls back to execCommand(copy) when writeText rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard permission denied'))
    const exec = stubExecCommand(() => true)
    const { copy } = useClipboard()

    const status = await copy('hello')

    expect(exec).toHaveBeenCalledWith('copy')
    expect(status).toBe('success')
  })

  it('returns error when writeText fails and execCommand reports failure', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'))
    const exec = stubExecCommand(() => false)
    const { copy } = useClipboard()

    const status = await copy('hello')

    expect(exec).toHaveBeenCalledWith('copy')
    expect(status).toBe('error')
  })

  it('returns error when writeText fails and execCommand throws', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'))
    const exec = stubExecCommand(() => {
      throw new Error('execCommand unavailable')
    })
    const { copy } = useClipboard()

    const status = await copy('hello')

    expect(exec).toHaveBeenCalledWith('copy')
    expect(status).toBe('error')
  })

  it('performs no network request while copying', async () => {
    const fetchSpy = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchSpy)
    const { copy } = useClipboard()

    await copy('hello')

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
