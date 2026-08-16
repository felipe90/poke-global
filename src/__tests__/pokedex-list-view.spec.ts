import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import type { PokemonListResponse, PokemonSummary } from '@/types/pokemon'

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

type ListCtx = { mod: MockedPokeapi; store: ReturnType<typeof import('@/stores/pokemon')['usePokemonStore']> }

function page(offset: number, names: string[], next: string | null): PokemonListResponse {
  return {
    count: names.length,
    next,
    previous: offset === 0 ? null : `${BASE}/pokemon?limit=24&offset=${offset - 24}`,
    results: names.map((name) => ({ name, url: `${BASE}/pokemon/${name}/` })),
  }
}

function summaries(names: string[]): PokemonSummary[] {
  return names.map((name) => ({ name, url: `${BASE}/pokemon/${name}/` }))
}

function pagedNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `poke${i}`)
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

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

let originalIO: typeof IntersectionObserver | undefined

beforeEach(() => {
  setActivePinia(createPinia())
  originalIO = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  globalThis.IntersectionObserver = originalIO as typeof IntersectionObserver
})

async function mountList(setup?: (ctx: ListCtx) => void) {
  vi.resetModules()
  setActivePinia(createPinia())
  const mod = (await import('@/services/pokeapi')) as unknown as MockedPokeapi
  mod.fetchPokemonPage.mockReset()
  mod.fetchTypeCatalog.mockReset()
  mod.fetchPokemonDetail.mockReset()
  mod.fetchPokemonSpecies.mockReset()
  const { default: router, flowComplete } = await import('@/router')
  flowComplete.value = true
  const { default: PokedexListView } = await import('@/views/PokedexListView.vue')
  const { usePokemonStore } = await import('@/stores/pokemon')
  const store = usePokemonStore()
  setup?.({ mod, store })
  const wrapper = mount(PokedexListView, { global: { plugins: [router] } })
  await router.isReady()
  return { wrapper, store, mod, router }
}

describe('PokedexListView (4.3)', () => {
  it('mount triggers loadFirstPage with aria-busy + LoadingSpinner while fetching', async () => {
    const pending = deferred<PokemonListResponse>()
    const { wrapper, mod } = await mountList(({ mod }) => mod.fetchPokemonPage.mockReturnValue(pending.promise))
    await nextTick()
    expect(mod.fetchPokemonPage).toHaveBeenCalledWith(0)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)

    pending.resolve(page(0, ['bulbasaur', 'ivysaur'], null))
    await flushPromises()
    expect(wrapper.attributes('aria-busy')).toBe('false')
    expect(wrapper.find('.loading-spinner').exists()).toBe(false)
    expect(wrapper.text()).toContain('Bulbasaur')
  })

  it('the scroll sentinel triggers the next catalog page (nextUrl mode)', async () => {
    const { wrapper, mod } = await mountList(({ mod }) =>
      mod.fetchPokemonPage
        .mockResolvedValueOnce(page(0, pagedNames(24), `${BASE}/pokemon?limit=24&offset=24`))
        .mockResolvedValueOnce(page(24, ['raichu'], null)),
    )
    await flushPromises()
    expect(mod.fetchPokemonPage).toHaveBeenNthCalledWith(1, 0)
    expect(mod.fetchPokemonPage).toHaveBeenNthCalledWith(2, 24)
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(25)
  })

  it('with a filter active the sentinel increments the client slice with no API request', async () => {
    const filtered = summaries(Array.from({ length: 48 }, (_, i) => `mon${i}`))
    const { wrapper, mod, store } = await mountList(({ mod, store }) => {
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['bulbasaur'], null))
      store.pokemonList = summaries(['bulbasaur'])
      store.appliedTypes = ['grass']
      store.filteredSet = filtered
      store.filterSliceIndex = 0
    })
    await flushPromises()
    expect(mod.fetchPokemonPage).not.toHaveBeenCalled()
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(48)
    expect(store.filterSliceIndex).toBe(1)
  })

  it('renders SearchBar and shows the singular/plural search count over matches', async () => {
    const { wrapper, store } = await mountList(({ mod }) =>
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['pikachu', 'pidgey', 'pichu', 'bulbasaur'], null)),
    )
    await flushPromises()
    expect(wrapper.findComponent({ name: 'SearchBar' }).exists()).toBe(true)

    store.searchFilter = 'pika'
    await nextTick()
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Se ha encontrado 1 resultado')

    store.searchFilter = 'pi'
    await nextTick()
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('Se han encontrado 3 resultados')
  })

  it('shows the joined-size count when a filter is active', async () => {
    const { wrapper } = await mountList(({ mod, store }) => {
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['bulbasaur'], null))
      store.pokemonList = summaries(['bulbasaur'])
      store.appliedTypes = ['grass']
      store.filteredSet = summaries(['bulbasaur', 'ivysaur', 'venusaur'])
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Se han encontrado 3 resultados')
  })

  it('the filter control opens the TypeFilterSheet dialog', async () => {
    const { wrapper } = await mountList(({ mod }) =>
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['bulbasaur'], null)),
    )
    await flushPromises()
    await wrapper.get('.filter-control').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Filtra por tus preferencias')
  })

  it('Borrar filtro clears types + search + pagination', async () => {
    const { wrapper, store } = await mountList(({ mod, store }) => {
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['bulbasaur'], null))
      store.pokemonList = summaries(['bulbasaur'])
      store.appliedTypes = ['grass']
      store.filteredSet = summaries(['bulbasaur'])
      store.filterSliceIndex = 2
      store.searchFilter = 'bulba'
    })
    await flushPromises()
    expect(wrapper.find('.clear-filter').exists()).toBe(true)
    await wrapper.get('.clear-filter').trigger('click')
    await nextTick()
    expect(store.appliedTypes).toEqual([])
    expect(store.searchFilter).toBe('')
    expect(store.filteredSet).toEqual([])
    expect(store.filterSliceIndex).toBe(0)
  })

  it('first-page error renders ErrorState and Reintentar re-issues page 0', async () => {
    const { wrapper, mod } = await mountList(({ mod }) =>
      mod.fetchPokemonPage
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(page(0, ['bulbasaur'], null)),
    )
    await flushPromises()
    expect(wrapper.text()).toContain('Algo salió mal...')
    expect(wrapper.text()).toContain('No pudimos cargar la información')
    await wrapper.get('.state .app-button').trigger('click')
    await flushPromises()
    expect(mod.fetchPokemonPage).toHaveBeenNthCalledWith(2, 0)
    expect(wrapper.text()).toContain('Bulbasaur')
  })

  it('later-page error keeps prior pages and shows an inline sentinel error with Retry', async () => {
    const { wrapper, mod } = await mountList(({ mod }) =>
      mod.fetchPokemonPage
        .mockResolvedValueOnce(page(0, pagedNames(24), `${BASE}/pokemon?limit=24&offset=24`))
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(page(24, ['raichu'], null)),
    )
    await flushPromises()
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(24)
    expect(wrapper.find('.sentinel-error').exists()).toBe(true)
    expect(wrapper.find('.sentinel-error').text()).toContain('Algo salió mal...')
    await wrapper.get('.sentinel-error button').trigger('click')
    await flushPromises()
    expect(mod.fetchPokemonPage).toHaveBeenNthCalledWith(3, 24)
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(25)
    expect(wrapper.find('.sentinel-error').exists()).toBe(false)
  })

  it('activating a card navigates to /pokemon/{name} and sets the nav context', async () => {
    const { wrapper, store, router } = await mountList(({ mod }) =>
      mod.fetchPokemonPage.mockResolvedValue(page(0, ['bulbasaur', 'ivysaur'], null)),
    )
    await flushPromises()
    await wrapper.findAll('.pokemon-card')[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/pokemon/bulbasaur')
    expect(store.contextNames).toEqual(['bulbasaur', 'ivysaur'])
  })

  it('keeps list state across tab switches with no refetch (KeepAlive)', async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const mod = (await import('@/services/pokeapi')) as unknown as MockedPokeapi
    mod.fetchPokemonPage.mockReset()
    mod.fetchTypeCatalog.mockReset()
    mod.fetchPokemonDetail.mockReset()
    mod.fetchPokemonSpecies.mockReset()
    mod.fetchPokemonPage.mockResolvedValue(page(0, pagedNames(24), null))
    const { default: router, flowComplete } = await import('@/router')
    flowComplete.value = true
    const { default: App } = await import('@/App.vue')
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    const loadFirstPage = vi.spyOn(store, 'loadFirstPage')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    await flushPromises()
    expect(loadFirstPage).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(24)

    await router.push('/favorites')
    await flushPromises()
    await router.push('/')
    await flushPromises()
    expect(loadFirstPage).toHaveBeenCalledTimes(1)
    expect(mod.fetchPokemonPage).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('.pokemon-card')).toHaveLength(24)
    wrapper.unmount()
  })
})
