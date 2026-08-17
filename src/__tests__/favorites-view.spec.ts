import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'

import { STORAGE_KEY } from '@/types/pokemon'
import type { FavoritePokemon } from '@/types/pokemon'

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

type MockedPokeapi = {
  fetchPokemonPage: Mock
  fetchTypeCatalog: Mock
  fetchPokemonDetail: Mock
  fetchPokemonSpecies: Mock
}

type FavoritesCtx = { mod: MockedPokeapi; store: ReturnType<typeof import('@/stores/pokemon')['usePokemonStore']> }

function favorite(name: string, id: number): FavoritePokemon {
  return { name, id, imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`, types: ['electric'], addedAt: new Date().toISOString() }
}

let originalIO: typeof IntersectionObserver | undefined

beforeEach(() => {
  setActivePinia(createPinia())
  originalIO = globalThis.IntersectionObserver
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  globalThis.IntersectionObserver = originalIO as typeof IntersectionObserver
})

async function mountFavorites(setup?: (ctx: FavoritesCtx) => void) {
  vi.resetModules()
  setActivePinia(createPinia())
  const mod = (await import('@/services/pokeapi')) as unknown as MockedPokeapi
  mod.fetchPokemonPage.mockReset()
  mod.fetchTypeCatalog.mockReset()
  mod.fetchPokemonDetail.mockReset()
  mod.fetchPokemonSpecies.mockReset()
  const { default: router, flowComplete } = await import('@/router')
  flowComplete.value = true
  const { default: FavoritesView } = await import('@/views/FavoritesView.vue')
  const { usePokemonStore } = await import('@/stores/pokemon')
  const store = usePokemonStore()
  setup?.({ mod, store })
  const wrapper = mount(FavoritesView, { global: { plugins: [router] } })
  await router.isReady()
  return { wrapper, store, mod, router }
}

describe('FavoritesView (4.5)', () => {
  it('renders favorites from persisted snapshots with no network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { wrapper } = await mountFavorites(({ store }) => {
      store.favorites = [favorite('pikachu', 25), favorite('bulbasaur', 1)]
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Pikachu')
    expect(wrapper.text()).toContain('Bulbasaur')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('swiping a card reveals the action layer whose click removes the favorite and persists immediately', async () => {
    const { wrapper, store } = await mountFavorites(({ store }) => {
      store.favorites = [favorite('pikachu', 25), favorite('bulbasaur', 1)]
    })
    await flushPromises()
    const first = wrapper.findAll('.swipe-container')[0]!
    // jsdom has no layout — stub the container width so the reveal derives
    // from it (full reveal = 0.7 × width, threshold = 0.35 × width).
    Object.defineProperty(first.element, 'offsetWidth', { configurable: true, value: 200 })
    const cardLayer = first.get('.card-layer')
    const pointer = (type: string, clientX: number): void => {
      cardLayer.element.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX, clientY: 100 }),
      )
    }

    pointer('pointerdown', 200)
    pointer('pointermove', 80) // dx -120 < threshold (-10) → opens to -30 (0.15 × 200)
    pointer('pointerup', 80)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve())) // rAF snap
    await flushPromises()
    expect(first.get('.card-layer').attributes('style')).toContain('translateX(-30px)')

    await first.get('.action-layer').trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Pikachu')
    expect(store.favorites.map((f) => f.name)).toEqual(['bulbasaur'])
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoritePokemon[]
    expect(persisted.map((f) => f.name)).toEqual(['bulbasaur'])
  })

  it('tapping a favorite navigates to /pokemon/{name}', async () => {
    const { wrapper, router } = await mountFavorites(({ store }) => {
      store.favorites = [favorite('pikachu', 25)]
    })
    await flushPromises()
    await wrapper.get('.pokemon-card').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/pokemon/pikachu')
  })

  it('shows the exact empty-state copy when no favorites exist', async () => {
    const { wrapper } = await mountFavorites()
    await flushPromises()
    expect(wrapper.text()).toContain('No has marcado ningún Pokémon como favorito')
    expect(wrapper.text()).toContain(
      'Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí.',
    )
    expect(wrapper.find('.pokemon-card').exists()).toBe(false)
  })

  it('empty state disappears when the first favorite is added', async () => {
    const { wrapper, store } = await mountFavorites()
    await flushPromises()
    expect(wrapper.text()).toContain('No has marcado ningún Pokémon como favorito')

    store.toggleFavorite({ name: 'pikachu', id: 25, imageUrl: 'x', types: ['electric'] })
    await flushPromises()
    expect(wrapper.text()).not.toContain('No has marcado ningún Pokémon como favorito')
    expect(wrapper.find('.pokemon-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pikachu')
  })
})
