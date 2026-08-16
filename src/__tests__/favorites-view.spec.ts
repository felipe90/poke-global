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

  it('per-item trash (#cd3131) removes the favorite and persists immediately', async () => {
    const { wrapper, store } = await mountFavorites(({ store }) => {
      store.favorites = [favorite('pikachu', 25), favorite('bulbasaur', 1)]
    })
    await flushPromises()
    const trash = wrapper.findAll('.favorite-trash')[0]!
    expect(trash.attributes('style')).toContain('rgb(205, 49, 49)')

    await trash.trigger('click')
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
