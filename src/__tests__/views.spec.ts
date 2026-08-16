import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

/**
 * Views integration (PR 5 Lote A): Splash (4.1), Onboarding (4.2),
 * Construction (4.6). Mounted with a REAL router (fresh module per test, so the
 * cold-load guard flags reset). Splash timing uses fake timers.
 */

let originalMatchMedia: typeof window.matchMedia

beforeEach(() => {
  setActivePinia(createPinia())
  originalMatchMedia = window.matchMedia
  window.history.replaceState({}, '', '/splash')
  localStorage.clear()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.useRealTimers()
})

/** Fresh router module + a fresh (same-registry) import of a view. */
async function fresh() {
  vi.resetModules()
  const router = (await import('@/router')).default
  return router
}

describe('SplashView (4.1)', () => {
  it('renders the shared pure-CSS PokeballLoader, decorative and image-free', async () => {
    vi.useFakeTimers()
    const router = await fresh()
    const { default: SplashView } = await import('@/views/SplashView.vue')
    const wrapper = mount(SplashView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('.pokeball-loader').exists()).toBe(true)
    expect(wrapper.find('.pokeball-loader').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('auto-advances to /onboarding after exactly 1500 ms without interaction', async () => {
    vi.useFakeTimers()
    const router = await fresh()
    const { default: SplashView } = await import('@/views/SplashView.vue')
    mount(SplashView, { global: { plugins: [router] } })
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/splash')
    await vi.advanceTimersByTime(1499)
    expect(router.currentRoute.value.path).toBe('/splash')
    await vi.advanceTimersByTime(1)
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/onboarding')
  })

  it('honors prefers-reduced-motion but keeps the 1500 ms auto-advance', async () => {
    vi.useFakeTimers()
    window.matchMedia = vi.fn<(query: string) => MediaQueryList>((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<(event: Event) => boolean>(),
    }) as MediaQueryList)
    const router = await fresh()
    const { default: SplashView } = await import('@/views/SplashView.vue')
    const wrapper = mount(SplashView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('.splash-view').attributes('data-reduced-motion')).toBe('true')
    await vi.advanceTimersByTime(1500)
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/onboarding')
  })
})

describe('OnboardingView (4.2)', () => {
  async function freshOnboarding() {
    const router = await fresh()
    const { default: OnboardingView } = await import('@/views/OnboardingView.vue')
    const wrapper = mount(OnboardingView, { global: { plugins: [router] } })
    await router.isReady()
    return { wrapper, router }
  }

  it('renders step 01 with the exact copy, a Continuar CTA and dot 1 active', async () => {
    const { wrapper } = await freshOnboarding()
    const text = wrapper.text()
    expect(text).toContain('Todos los Pokémon en un solo lugar')
    expect(text).toContain(
      'Accede a una amplia lista de Pokémon de todas las generaciones creadas por Nintendo',
    )
    expect(text).not.toContain('Mantén tu Pokédex actualizada')
    expect(wrapper.get('button').text()).toBe('Continuar')

    const dots = wrapper.findAll('.dot')
    expect(dots).toHaveLength(2)
    expect(dots[0]?.attributes('aria-label')).toBe('paso 1 de 2')
    expect(dots[0]?.attributes('aria-current')).toBe('step')
    expect(dots[1]?.attributes('aria-label')).toBe('paso 2 de 2')
    expect(dots[1]?.attributes('aria-current')).toBeUndefined()
  })

  it('Continuar is a keyboard-operable button that advances to step 02 (dot 2 active)', async () => {
    const { wrapper } = await freshOnboarding()
    const cta = wrapper.get('button')
    expect(cta.element.tagName).toBe('BUTTON')
    await cta.trigger('click')

    const text = wrapper.text()
    expect(text).toContain('Mantén tu Pokédex actualizada')
    expect(text).toContain(
      'Regístrate y guarda tu perfil, Pokémon favoritos, configuraciones y mucho más',
    )
    expect(text).not.toContain('Todos los Pokémon en un solo lugar')
    expect(wrapper.get('button').text()).toBe('Empecemos')

    const dots = wrapper.findAll('.dot')
    expect(dots[1]?.attributes('aria-current')).toBe('step')
    expect(dots[0]?.attributes('aria-current')).toBeUndefined()
  })

  it('Empecemos completes onboarding and resumes to / by default', async () => {
    const { wrapper, router } = await freshOnboarding()
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('Empecemos resumes to the stashed deep-link target', async () => {
    const router = await fresh()
    await router.push('/favorites')
    expect(router.currentRoute.value.path).toBe('/splash')
    await router.push('/onboarding')
    const { default: OnboardingView } = await import('@/views/OnboardingView.vue')
    const wrapper = mount(OnboardingView, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/favorites')
  })

  it('writes no onboarding-seen key and offers no skip control', async () => {
    const { wrapper, router } = await freshOnboarding()
    expect(wrapper.text()).not.toMatch(/saltar|omitir|skip/i)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(Object.keys(localStorage).some((key) => /onboarding/i.test(key))).toBe(false)
  })

  it('wraps the steps in a fade <Transition>', async () => {
    const { wrapper } = await freshOnboarding()
    expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
  })
})

describe('ConstructionView (4.6)', () => {
  it('is a thin wrapper that renders the shared ConstructionState', async () => {
    const router = await fresh()
    const { default: ConstructionView } = await import('@/views/ConstructionView.vue')
    const wrapper = mount(ConstructionView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.findComponent({ name: 'ConstructionState' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('¡Muy pronto disponible!')
    expect(wrapper.text()).toContain('Estamos trabajando para traerte esta sección')
    expect(wrapper.find('svg[aria-hidden="true"]').exists()).toBe(true)
    wrapper.unmount()
  })

  async function mountShell() {
    const router = await fresh()
    const { completeOnboarding } = await import('@/router')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    await completeOnboarding()
    await flushPromises()
    return { wrapper, router }
  }

  it('renders the Construcción screen inside the shell at /regions with zero network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { wrapper, router } = await mountShell()
    await router.push('/regions')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/regions')
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('¡Muy pronto disponible!')
    expect(wrapper.text()).toContain('Estamos trabajando para traerte esta sección')
    expect(wrapper.find('svg[aria-hidden="true"]').exists()).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    wrapper.unmount()
  })

  it('renders the Construcción screen inside the shell at /profile with zero network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { wrapper, router } = await mountShell()
    await router.push('/profile')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/profile')
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('¡Muy pronto disponible!')
    expect(wrapper.text()).toContain('Estamos trabajando para traerte esta sección')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    wrapper.unmount()
  })
})
