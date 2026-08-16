import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'

import App from '@/App.vue'

describe('App shell (3.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  async function mountShell() {
    const { default: router, completeOnboarding } = await import('@/router')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    return { wrapper, router, completeOnboarding }
  }

  it('renders the shell: header + TabBar + list at / after the flow completes', async () => {
    const { wrapper, router, completeOnboarding } = await mountShell()
    expect(router.currentRoute.value.path).toBe('/splash')
    await completeOnboarding()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('.pokedex-list-view').exists()).toBe(true)
  })

  it('replaces the demo scaffold — no "You did it!" content', async () => {
    const { wrapper, completeOnboarding } = await mountShell()
    await completeOnboarding()
    await flushPromises()
    expect(wrapper.text()).not.toContain('You did it!')
  })
})
