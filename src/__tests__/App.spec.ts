import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'

import App from '@/App.vue'

vi.mock('@/services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/pokeapi')>()
  return {
    ...actual,
    fetchPokemonPage: vi.fn<typeof actual.fetchPokemonPage>(),
    fetchTypeCatalog: vi.fn<typeof actual.fetchTypeCatalog>(),
    fetchPokemonDetail: vi.fn<typeof actual.fetchPokemonDetail>(),
    fetchPokemonSpecies: vi.fn<typeof actual.fetchPokemonSpecies>(),
  }
})

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

  it('renders the shell: TabBar + list at / after the flow completes', async () => {
    const { wrapper, router, completeOnboarding } = await mountShell()
    expect(router.currentRoute.value.path).toBe('/splash')
    await completeOnboarding()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
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
