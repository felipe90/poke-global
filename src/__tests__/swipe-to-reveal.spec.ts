import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

import SwipeToReveal from '@/components/SwipeToReveal.vue'

const FRONT_SLOT = '<button type="button" class="front">Tap</button>'

function mountReveal(actionsSlot?: string): VueWrapper {
  const wrapper = mount(SwipeToReveal, {
    slots: {
      default: FRONT_SLOT,
      ...(actionsSlot ? { actions: actionsSlot } : {}),
    },
  })
  // jsdom has no layout: stub the container width (reveal = 0.7 × WIDTH).
  const el = wrapper.get('.swipe-container').element as HTMLElement
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: WIDTH })
  return wrapper
}

const WIDTH = 200
const MAX_SWIPE = -WIDTH * 0.7 // -140

/** Dispatch a real PointerEvent (jsdom) so clientX/clientY/pointerId reach the handlers. */
async function pointerOn(layer: { element: Element }, type: string, init: PointerEventInit): Promise<void> {
  layer.element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }))
  await nextTick()
}

/** Drag the card layer through a horizontal pointer gesture. */
async function swipeCard(wrapper: VueWrapper, toClientX: number, fromClientX = 200): Promise<void> {
  const layer = wrapper.get('.card-layer')
  await pointerOn(layer, 'pointerdown', { pointerId: 1, clientX: fromClientX, clientY: 100 })
  await pointerOn(layer, 'pointermove', { pointerId: 1, clientX: toClientX, clientY: 103 })
  await pointerOn(layer, 'pointerup', { pointerId: 1 })
  // The snap/spring is deferred to the next rAF frame — advance it.
  if (vi.isFakeTimers()) {
    vi.advanceTimersByTime(16)
  } else {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  await nextTick()
}

describe('SwipeToReveal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the front slot and the fallback action layer', () => {
    const wrapper = mountReveal()
    expect(wrapper.get('.card-layer .front').text()).toBe('Tap')
    expect(wrapper.find('.action-layer .swipe-trash').exists()).toBe(true)
  })

  it('renders a provided actions slot instead of the fallback', () => {
    const wrapper = mountReveal('<span class="custom-action">Remove</span>')
    expect(wrapper.get('.action-layer .custom-action').text()).toBe('Remove')
    expect(wrapper.find('.action-layer .swipe-trash').exists()).toBe(false)
  })

  it('emits delete when the action layer is clicked', async () => {
    const wrapper = mountReveal()
    await wrapper.get('.action-layer').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('lets plain clicks pass through to the front content', async () => {
    const wrapper = mountReveal()
    const front = wrapper.get('.front')
    const clickSpy = vi.fn<(event: Event) => void>()
    front.element.addEventListener('click', clickSpy)

    await front.trigger('click')

    expect(clickSpy).toHaveBeenCalled()
    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('applies the swipe transform and snaps open past the threshold', async () => {
    vi.useFakeTimers()
    const wrapper = mountReveal()
    const layer = wrapper.get('.card-layer')

    await pointerOn(layer, 'pointerdown', { pointerId: 1, clientX: 200, clientY: 100 })
    await pointerOn(layer, 'pointermove', { pointerId: 1, clientX: 100, clientY: 103 })
    expect(layer.attributes('style')).toContain('translateX(-100px)')

    await pointerOn(layer, 'pointerup', { pointerId: 1 })
    vi.advanceTimersByTime(16) // rAF frame
    await nextTick()
    expect(wrapper.get('.card-layer').attributes('style')).toContain(`translateX(${MAX_SWIPE}px)`)
    vi.useRealTimers()
  })

  it('swallows a front-layer click while the swipe is open but keeps the reveal open', async () => {
    const wrapper = mountReveal()
    await swipeCard(wrapper, 120)

    const front = wrapper.get('.front')
    const clickSpy = vi.fn<(event: Event) => void>()
    front.element.addEventListener('click', clickSpy)

    await front.trigger('click')

    expect(clickSpy).not.toHaveBeenCalled()
    // The reveal stays open (blocking navigation must not close the swipe).
    expect(wrapper.get('.card-layer').attributes('style')).toContain(`translateX(${MAX_SWIPE}px)`)
  })

  it('does not swallow clicks once the swipe lock window has passed', async () => {
    vi.useFakeTimers()
    const wrapper = mountReveal()
    await swipeCard(wrapper, 120)
    vi.advanceTimersByTime(16) // settle the deferred snap under fake timers

    vi.advanceTimersByTime(300)

    const front = wrapper.get('.front')
    const clickSpy = vi.fn<(event: Event) => void>()
    front.element.addEventListener('click', clickSpy)

    await front.trigger('click')
    expect(clickSpy).toHaveBeenCalled()
  })
})