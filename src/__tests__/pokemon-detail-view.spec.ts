import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'

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

const BASE = 'https://pokeapi.co/api/v2'

type MockedPokeapi = {
  fetchPokemonPage: Mock
  fetchTypeCatalog: Mock
  fetchPokemonDetail: Mock
  fetchPokemonSpecies: Mock
}

type DetailCtx = { mod: MockedPokeapi; store: ReturnType<typeof import('@/stores/pokemon')['usePokemonStore']> }

function makeDetail(name: string, id: number): PokemonDetail {
  return {
    id,
    name,
    height: 7,
    weight: 69,
    types: [
      { slot: 1, type: { name: 'grass' } },
      { slot: 2, type: { name: 'poison' } },
    ],
    stats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } },
      { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } },
      { base_stat: 45, stat: { name: 'speed' } },
    ],
    abilities: [{ slot: 1, ability: { name: 'overgrow', url: 'https://pokeapi.co/api/v2/ability/1/' } }],
    sprites: {
      front_default: null,
      other: {
        'official-artwork': { front_default: 'art.png' },
        showdown: { front_default: 'art.gif' },
      },
    },
    species: { url: `${BASE}/pokemon-species/${id}/` },
  }
}

function makeSpecies(_id: number): PokemonSpecies {
  return {
    flavor_text_entries: [{ flavor_text: 'Texto ES', language: { name: 'es' }, version: { name: 'red' } }],
    genera: [{ genus: 'Pokémon Semilla', language: { name: 'es' } }],
    gender_rate: 1,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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

async function mountDetail(
  name: string,
  setup?: (ctx: DetailCtx) => void,
  attachTo?: boolean,
) {
  vi.resetModules()
  setActivePinia(createPinia())
  const mod = (await import('@/services/pokeapi')) as unknown as MockedPokeapi
  mod.fetchPokemonPage.mockReset()
  mod.fetchTypeCatalog.mockReset()
  mod.fetchPokemonDetail.mockReset()
  mod.fetchPokemonSpecies.mockReset()
  const { default: router, flowComplete } = await import('@/router')
  flowComplete.value = true
  const { default: PokemonDetailView } = await import('@/views/PokemonDetailView.vue')
  const { usePokemonStore } = await import('@/stores/pokemon')
  const store = usePokemonStore()
  setup?.({ mod, store })
  await router.push(`/pokemon/${name}`)
  await router.isReady()
  const wrapper = mount(PokemonDetailView, {
    attachTo: attachTo ? document.body : undefined,
    global: { plugins: [router] },
  })
  return { wrapper, store, mod, router }
}

describe('PokemonDetailView (4.4)', () => {
  it('route.params.name drives openDetail: loader shows while fetching, panel after', async () => {
    const pending = deferred<PokemonDetail>()
    const { wrapper, mod } = await mountDetail('bulbasaur', ({ mod }) => {
      mod.fetchPokemonDetail.mockReturnValue(pending.promise)
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(1))
    })
    await nextTick()
    expect(mod.fetchPokemonDetail).toHaveBeenCalledWith('bulbasaur')
    expect(wrapper.find('.pokeball-loader').exists()).toBe(true)
    expect(wrapper.find('.detail-panel').exists()).toBe(false)

    pending.resolve(makeDetail('bulbasaur', 1))
    await flushPromises()
    expect(wrapper.find('.pokeball-loader').exists()).toBe(false)
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nº001')
    expect(wrapper.text()).toContain('Bulbasaur')
  })

  it('a cached visit issues no new detail request', async () => {
    const { wrapper, mod, router } = await mountDetail('bulbasaur', ({ mod }) => {
      mod.fetchPokemonDetail.mockImplementation((name: string) =>
        Promise.resolve(makeDetail(name, name === 'bulbasaur' ? 1 : 25)),
      )
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(1))
    })
    await flushPromises()
    expect(mod.fetchPokemonDetail).toHaveBeenCalledTimes(1)

    await router.push('/pokemon/pikachu')
    await flushPromises()
    expect(mod.fetchPokemonDetail).toHaveBeenCalledTimes(2)

    await router.push('/pokemon/bulbasaur')
    await flushPromises()
    expect(mod.fetchPokemonDetail).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Bulbasaur')
  })

  it('species failure degrades species fields to — without blocking the panel', async () => {
    const { wrapper } = await mountDetail('bulbasaur', ({ mod }) => {
      mod.fetchPokemonDetail.mockResolvedValue(makeDetail('bulbasaur', 1))
      mod.fetchPokemonSpecies.mockRejectedValue(new Error('species fail'))
    })
    await flushPromises()
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('Peso')
    expect(wrapper.text()).toContain('6,9 kg')
    expect(wrapper.text()).toContain('—')
  })

  it('renders no Próximo/Anterior nav (not part of the Figma detail)', async () => {
    const { wrapper } = await mountDetail('ivysaur', ({ mod, store }) => {
      mod.fetchPokemonDetail.mockResolvedValue(makeDetail('ivysaur', 2))
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(2))
      store.setNavContext(['bulbasaur', 'ivysaur', 'venusaur'])
    })
    await flushPromises()
    expect(wrapper.find('.detail-nav').exists()).toBe(false)
    expect(wrapper.find('.nav-prev').exists()).toBe(false)
    expect(wrapper.find('.nav-next').exists()).toBe(false)
  })

  it('renders no stats section (not part of the Figma detail)', async () => {
    const { wrapper } = await mountDetail('pikachu', ({ mod }) => {
      mod.fetchPokemonDetail.mockResolvedValue(makeDetail('pikachu', 25))
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(25))
    })
    await flushPromises()
    expect(wrapper.find('.detail-stats').exists()).toBe(false)
  })

  it('the header back arrow returns to the previous route', async () => {
    const { wrapper, router } = await mountDetail('bulbasaur', ({ mod }) => {
      mod.fetchPokemonDetail.mockResolvedValue(makeDetail('bulbasaur', 1))
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(1))
    })
    await flushPromises()
    await wrapper.get('.detail-header__back').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })

  it('fetch failure renders ErrorState and Reintentar re-issues the request', async () => {
    const { wrapper, mod } = await mountDetail('pikachu', ({ mod }) => {
      mod.fetchPokemonDetail
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(makeDetail('pikachu', 25))
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(25))
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Algo salió mal...')
    await wrapper.get('.app-button').trigger('click')
    await flushPromises()
    expect(mod.fetchPokemonDetail).toHaveBeenNthCalledWith(2, 'pikachu')
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
  })

  it('404 renders a not-found state with a link back to the list', async () => {
    const { wrapper, router } = await mountDetail('missingmon', ({ mod }) => {
      mod.fetchPokemonDetail.mockRejectedValue(new Error('Request failed with status code 404'))
      mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(0))
    })
    await flushPromises()
    expect(wrapper.find('.not-found').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pokémon no encontrado')
    await wrapper.get('.not-found .app-button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('moves focus to the heading when the detail loads', async () => {
    const { wrapper, router } = await mountDetail(
      'ivysaur',
      ({ mod }) => {
        mod.fetchPokemonDetail.mockResolvedValue(makeDetail('ivysaur', 2))
        mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(2))
      },
      true,
    )
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.find('.detail-heading').element)
    router.push('/')
    wrapper.unmount()
  })

  it('renders inside the shell with TabBar visible and Pokedex active at /pokemon/:name', async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const mod = (await import('@/services/pokeapi')) as unknown as MockedPokeapi
    mod.fetchPokemonDetail.mockResolvedValue(makeDetail('pikachu', 25))
    mod.fetchPokemonSpecies.mockResolvedValue(makeSpecies(25))
    const { default: router, flowComplete } = await import('@/router')
    flowComplete.value = true
    const { default: App } = await import('@/App.vue')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    await router.push('/pokemon/pikachu')
    await flushPromises()
    expect(wrapper.find('nav').exists()).toBe(true)
    const pokedex = wrapper.findAll('nav a').find((a) => a.text() === 'Pokedex')
    expect(pokedex?.attributes('aria-current')).toBe('page')
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
    wrapper.unmount()
  })
})
