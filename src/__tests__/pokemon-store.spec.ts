import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { fetchPokemonPage, fetchTypeCatalog } from '@/services/pokeapi'
import { usePokemonStore } from '@/stores/pokemon'
import { PAGE_SIZE } from '@/types/pokemon'
import type { PokemonListResponse, PokemonSummary, TypeCatalogResponse, TypeName } from '@/types/pokemon'

vi.mock('@/services/pokeapi', () => ({
  fetchPokemonPage: vi.fn(),
  fetchTypeCatalog: vi.fn(),
}))

const BASE = 'https://pokeapi.co/api/v2'

function page(offset: number, names: string[], next: string | null): PokemonListResponse {
  return {
    count: names.length,
    next,
    previous: offset === 0 ? null : `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${offset - PAGE_SIZE}`,
    results: names.map((name) => ({ name, url: `${BASE}/pokemon/${name}/` })),
  }
}

function makeCatalog(names: string[]): TypeCatalogResponse {
  return {
    damage_relations: { double_damage_from: [] },
    pokemon: names.map((name) => ({ slot: 1, pokemon: { name, url: `${BASE}/pokemon/${name}/` } })),
  }
}

function summaryNames(items: PokemonSummary[]): string[] {
  return items.map((item) => item.name)
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

describe('pokemon store — catalog slice (2.1)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    store = usePokemonStore()
  })

  it('loadFirstPage fetches offset 0 and populates the list with nextUrl', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(
      page(0, ['bulbasaur', 'ivysaur', 'venusaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`),
    )

    await store.loadFirstPage()

    expect(fetchPokemonPage).toHaveBeenCalledWith(0)
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur', 'ivysaur', 'venusaur'])
    expect(store.nextUrl).toBe(`${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`)
    expect(store.loadingFirst).toBe(false)
  })

  it('loadFirstPage is a no-op when items are already loaded', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
    await store.loadFirstPage()

    vi.mocked(fetchPokemonPage).mockResolvedValue(page(0, ['charmander'], null))
    await store.loadFirstPage()

    expect(fetchPokemonPage).toHaveBeenCalledTimes(1)
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur'])
  })

  it('loadMore merges the next page deduped by name, in order', async () => {
    vi.mocked(fetchPokemonPage)
      .mockResolvedValueOnce(page(0, ['bulbasaur', 'ivysaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
      .mockResolvedValueOnce(page(PAGE_SIZE, ['ivysaur', 'charmander'], null))

    await store.loadFirstPage()
    await store.loadMore()

    expect(fetchPokemonPage).toHaveBeenLastCalledWith(PAGE_SIZE)
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur', 'ivysaur', 'charmander'])
    expect(store.nextUrl).toBeNull()
  })

  it('never issues a concurrent loadMore while a page is in flight', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
    await store.loadFirstPage()

    const gate = deferred<PokemonListResponse>()
    vi.mocked(fetchPokemonPage).mockReturnValueOnce(gate.promise)

    const first = store.loadMore()
    const second = store.loadMore()
    gate.resolve(page(PAGE_SIZE, ['charmander'], null))
    await Promise.all([first, second])

    expect(fetchPokemonPage).toHaveBeenCalledTimes(2)
  })

  it('does not load more once the catalog is exhausted (next null)', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur'], null))
    await store.loadFirstPage()

    await store.loadMore()

    expect(fetchPokemonPage).toHaveBeenCalledTimes(1)
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur'])
  })

  it('sets pageError on first-page failure and retryPage(0) re-issues only page 0', async () => {
    vi.mocked(fetchPokemonPage).mockRejectedValueOnce(new Error('network down'))
    await store.loadFirstPage()

    expect(store.pageError).toEqual({ offset: 0 })
    expect(store.pokemonList).toHaveLength(0)

    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur'], null))
    await store.retryPage(0)

    expect(fetchPokemonPage).toHaveBeenLastCalledWith(0)
    expect(store.pageError).toBeNull()
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur'])
  })

  it('keeps prior pages when a later page fails and retryPage re-issues only that page', async () => {
    vi.mocked(fetchPokemonPage)
      .mockResolvedValueOnce(page(0, ['bulbasaur', 'ivysaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
      .mockRejectedValueOnce(new Error('network down'))
    await store.loadFirstPage()
    await store.loadMore()

    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur', 'ivysaur'])
    expect(store.pageError).toEqual({ offset: PAGE_SIZE })

    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(PAGE_SIZE, ['ivysaur', 'charmander'], null))
    await store.retryPage(PAGE_SIZE)

    expect(store.pageError).toBeNull()
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur', 'ivysaur', 'charmander'])
  })
})

describe('pokemon store — type filter slice (2.2)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    store = usePokemonStore()
  })

  it('applies a name-deduped union of the selected type catalogs and resets the slice', async () => {
    vi.mocked(fetchTypeCatalog)
      .mockResolvedValueOnce(makeCatalog(['bulbasaur', 'charmander']))
      .mockResolvedValueOnce(makeCatalog(['bulbasaur', 'pikachu']))

    await store.applyTypeFilter(['grass', 'poison'])

    expect(fetchTypeCatalog).toHaveBeenNthCalledWith(1, 'grass')
    expect(fetchTypeCatalog).toHaveBeenNthCalledWith(2, 'poison')
    expect(store.appliedTypes).toEqual(['grass', 'poison'])
    expect(summaryNames(store.filteredSet)).toEqual(['bulbasaur', 'charmander', 'pikachu'])
    expect(store.filterSliceIndex).toBe(0)
    expect(store.filterError).toBeNull()
  })

  it('issues exactly one catalog request per selected type', async () => {
    vi.mocked(fetchTypeCatalog).mockResolvedValue(makeCatalog(['pikachu']))

    await store.applyTypeFilter(['electric', 'fire'])

    expect(fetchTypeCatalog).toHaveBeenCalledTimes(2)
  })

  it('fails atomically: no partial filteredSet and filterError lists only the failed types', async () => {
    vi.mocked(fetchTypeCatalog)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(makeCatalog(['bulbasaur']))

    await store.applyTypeFilter(['grass', 'poison'])

    expect(store.filterError).toEqual({ failedTypes: ['grass'] })
    expect(store.filteredSet).toHaveLength(0)
    expect(store.appliedTypes).toHaveLength(0)
  })

  it('retryFilter re-issues only the failed types and completes the union', async () => {
    vi.mocked(fetchTypeCatalog)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(makeCatalog(['bulbasaur']))
    await store.applyTypeFilter(['grass', 'poison'])

    vi.mocked(fetchTypeCatalog).mockResolvedValueOnce(makeCatalog(['bulbasaur', 'charmander']))
    await store.retryFilter()

    expect(fetchTypeCatalog).toHaveBeenCalledTimes(3)
    expect(fetchTypeCatalog).toHaveBeenLastCalledWith('grass')
    expect(store.filterError).toBeNull()
    expect(store.appliedTypes).toEqual(['grass', 'poison'])
    expect(summaryNames(store.filteredSet)).toEqual(['bulbasaur', 'charmander'])
  })

  it('visibleFiltered renders only the current 24-item slice', async () => {
    const names = Array.from({ length: 60 }, (_, i) => `pokemon-${i}`)
    vi.mocked(fetchTypeCatalog).mockResolvedValueOnce(makeCatalog(names))

    await store.applyTypeFilter(['electric'])

    expect(store.visibleFiltered).toHaveLength(24)
    expect(store.visibleFiltered[0]?.name).toBe('pokemon-0')
  })

  it('incrementFilterSlice advances one slice while more of the filtered set remains, then stops', async () => {
    const names = Array.from({ length: 60 }, (_, i) => `pokemon-${i}`)
    vi.mocked(fetchTypeCatalog).mockResolvedValueOnce(makeCatalog(names))
    await store.applyTypeFilter(['electric'])

    store.incrementFilterSlice()
    expect(store.visibleFiltered).toHaveLength(48)

    store.incrementFilterSlice()
    expect(store.visibleFiltered).toHaveLength(60)

    store.incrementFilterSlice()
    expect(store.visibleFiltered).toHaveLength(60)
  })

  it('clearFilter resets types, search, and filter pagination while keeping loaded catalog pages', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
    await store.loadFirstPage()

    const names = Array.from({ length: 50 }, (_, i) => `pokemon-${i}`)
    vi.mocked(fetchTypeCatalog).mockResolvedValueOnce(makeCatalog(names))
    await store.applyTypeFilter(['electric'])
    store.incrementFilterSlice()
    store.searchFilter = 'pokemon'

    store.clearFilter()

    expect(store.appliedTypes).toHaveLength(0)
    expect(store.filteredSet).toHaveLength(0)
    expect(store.filterSliceIndex).toBe(0)
    expect(store.filterError).toBeNull()
    expect(store.searchFilter).toBe('')
    expect(summaryNames(store.pokemonList)).toEqual(['bulbasaur'])
  })
})

describe('pokemon store — search slice (2.3)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    store = usePokemonStore()
  })

  it('filteredList returns every loaded catalog item when the search is empty', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur', 'pikachu'], null))
    await store.loadFirstPage()

    expect(summaryNames(store.filteredList)).toEqual(['bulbasaur', 'pikachu'])
  })

  it('filteredList filters by trimmed, case-insensitive substring', async () => {
    vi.mocked(fetchPokemonPage).mockResolvedValueOnce(page(0, ['bulbasaur', 'ivysaur', 'venusaur'], null))
    await store.loadFirstPage()

    store.searchFilter = '  IVY  '
    expect(summaryNames(store.filteredList)).toEqual(['ivysaur'])

    store.searchFilter = 'bulba'
    expect(summaryNames(store.filteredList)).toEqual(['bulbasaur'])
  })

  it('filteredList searches over all loaded catalog pages', async () => {
    vi.mocked(fetchPokemonPage)
      .mockResolvedValueOnce(page(0, ['bulbasaur'], `${BASE}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`))
      .mockResolvedValueOnce(page(PAGE_SIZE, ['charmander', 'charizard'], null))
    await store.loadFirstPage()
    await store.loadMore()

    store.searchFilter = 'char'
    expect(summaryNames(store.filteredList)).toEqual(['charmander', 'charizard'])
  })

  it('filteredList searches within the visible filtered slices when a type filter is active', async () => {
    const names = Array.from({ length: 60 }, (_, i) => `pokemon-${i}`)
    vi.mocked(fetchTypeCatalog).mockResolvedValueOnce(makeCatalog(names))
    await store.applyTypeFilter(['electric'])

    store.searchFilter = 'pokemon-3'
    expect(summaryNames(store.filteredList)).toEqual(['pokemon-3'])
  })
})

describe('pokemon store — nav context slice (2.3)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    store = usePokemonStore()
  })

  it('navIndexOf returns the index in the set context order', () => {
    store.setNavContext(['bulbasaur', 'ivysaur', 'venusaur'])

    expect(store.navIndexOf('ivysaur')).toBe(1)
    expect(store.navIndexOf('charmander')).toBe(-1)
  })

  it('prevName and nextName return the ordered neighbors', () => {
    store.setNavContext(['bulbasaur', 'ivysaur', 'venusaur'])

    expect(store.prevName('ivysaur')).toBe('bulbasaur')
    expect(store.nextName('ivysaur')).toBe('venusaur')
  })

  it('prevName is undefined at the first bound and nextName at the last', () => {
    store.setNavContext(['bulbasaur', 'ivysaur'])

    expect(store.prevName('bulbasaur')).toBeUndefined()
    expect(store.nextName('ivysaur')).toBeUndefined()
  })

  it('both prevName and nextName are null without a nav context (deep link)', () => {
    expect(store.navIndexOf('pikachu')).toBe(-1)
    expect(store.prevName('pikachu')).toBeNull()
    expect(store.nextName('pikachu')).toBeNull()
  })
})
