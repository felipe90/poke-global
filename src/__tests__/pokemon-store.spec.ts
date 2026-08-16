import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { fetchPokemonDetail, fetchPokemonPage, fetchPokemonSpecies, fetchTypeCatalog } from '@/services/pokeapi'
import { usePokemonStore } from '@/stores/pokemon'
import { PAGE_SIZE, STORAGE_KEY } from '@/types/pokemon'
import type {
  FavoritePokemon,
  PokemonDetail,
  PokemonListResponse,
  PokemonSpecies,
  PokemonSummary,
  TypeCatalogResponse,
  TypeName,
} from '@/types/pokemon'

vi.mock('@/services/pokeapi', () => ({
  fetchPokemonPage: vi.fn<(offset: number) => Promise<PokemonListResponse>>(),
  fetchTypeCatalog: vi.fn<(type: TypeName) => Promise<TypeCatalogResponse>>(),
  fetchPokemonDetail: vi.fn<(name: string) => Promise<PokemonDetail>>(),
  fetchPokemonSpecies: vi.fn<(id: number) => Promise<PokemonSpecies>>(),
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

function makeCatalog(names: string[], weaknesses: string[] = []): TypeCatalogResponse {
  return {
    damage_relations: { double_damage_from: weaknesses.map((name) => ({ name })) },
    names: [{ language: { name: 'es' }, name: names[0] ?? '' }],
    pokemon: names.map((name) => ({ slot: 1, pokemon: { name, url: `${BASE}/pokemon/${name}/` } })),
  }
}

/** Populate the store's type catalog cache via the preload path (API truth). */
async function preloadWith(weaknessByType: Record<string, string[]>): Promise<void> {
  vi.mocked(fetchTypeCatalog).mockImplementation((type: TypeName) =>
    Promise.resolve(makeCatalog([type], weaknessByType[type] ?? [])),
  )
  await usePokemonStore().preloadTypes()
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

// ------------------------------------------------------------------ fixtures
const artwork = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

function makeDetail(
  name: string,
  id: number,
  types: PokemonDetail['types'],
  ability: string,
  weight = 69,
  height = 7,
): PokemonDetail {
  return {
    id,
    name,
    height,
    weight,
    types,
    stats: [
      { base_stat: 35, stat: { name: 'hp' } },
      { base_stat: 55, stat: { name: 'attack' } },
      { base_stat: 40, stat: { name: 'defense' } },
      { base_stat: 50, stat: { name: 'special-attack' } },
      { base_stat: 50, stat: { name: 'special-defense' } },
      { base_stat: 90, stat: { name: 'speed' } },
    ],
    abilities: [{ slot: 1, ability: { name: ability } }],
    sprites: {
      front_default: artwork(id),
      other: { 'official-artwork': { front_default: artwork(id) } },
    },
    species: { url: `${BASE}/pokemon-species/${id}/` },
  }
}

const pikachuDetail = makeDetail('pikachu', 25, [{ slot: 1, type: { name: 'electric' } }], 'static')
const bulbasaurDetail = makeDetail(
  'bulbasaur',
  1,
  [
    { slot: 1, type: { name: 'grass' } },
    { slot: 2, type: { name: 'poison' } },
  ],
  'overgrow',
)

const pikachuSpecies: PokemonSpecies = {
  flavor_text_entries: [
    {
      flavor_text: 'Cuando se enfada,\nlanza descargas\f eléctricas.',
      language: { name: 'es' },
      version: { name: 'yellow' },
    },
    {
      flavor_text: 'Cuanto más potente es la energía\f que genera, más blandas y elásticas se vuelven las bolsas de sus mejillas.',
      language: { name: 'es' },
      version: { name: 'sword' },
    },
  ],
  genera: [{ genus: 'Pokémon Ratón', language: { name: 'es' } }],
  gender_rate: 4,
}

const bulbasaurSpecies: PokemonSpecies = {
  flavor_text_entries: [
    {
      flavor_text: 'A Bulbasaur le nace un bulbo en el lomo desde el día en que nace.',
      language: { name: 'es' },
      version: { name: 'red' },
    },
  ],
  genera: [{ genus: 'Pokémon Semilla', language: { name: 'es' } }],
  gender_rate: 1,
}

const enOnlySpecies: PokemonSpecies = {
  flavor_text_entries: [{ flavor_text: 'Some English text.', language: { name: 'en' }, version: { name: 'red' } }],
  genera: [{ genus: 'Seed Pokémon', language: { name: 'en' } }],
  gender_rate: -1,
}

const noLangSpecies: PokemonSpecies = {
  flavor_text_entries: [{ flavor_text: '...', language: { name: 'ja' }, version: { name: 'red' } }],
  genera: [{ genus: '???', language: { name: 'ja' } }],
  gender_rate: -1,
}

const pikachuFavoriteInput = { name: 'pikachu', id: 25, imageUrl: artwork(25), types: ['electric'] as TypeName[] }
const bulbasaurFavoriteInput = { name: 'bulbasaur', id: 1, imageUrl: artwork(1), types: ['grass', 'poison'] as TypeName[] }

const pikachuFavorite: FavoritePokemon = { ...pikachuFavoriteInput, addedAt: '2026-08-15T10:00:00.000Z' }
const bulbasaurFavorite: FavoritePokemon = { ...bulbasaurFavoriteInput, addedAt: '2026-08-15T10:05:00.000Z' }

async function flushPromises(times = 3): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve()
}

function dispatchStorageEvent(newValue: string | null, key = STORAGE_KEY): void {
  const event = new Event('storage')
  Object.defineProperty(event, 'key', { value: key })
  Object.defineProperty(event, 'newValue', { value: newValue })
  window.dispatchEvent(event)
}

describe('pokemon store — detail + species slice (2.4)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    vi.mocked(fetchPokemonDetail).mockReset()
    vi.mocked(fetchPokemonSpecies).mockReset()
    store = usePokemonStore()
  })

  it('openDetail fetches the detail and derives the species fields non-blocking', async () => {
    await preloadWith({ electric: ['ground'] })
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    vi.mocked(fetchPokemonSpecies).mockResolvedValueOnce(pikachuSpecies)

    await store.openDetail('pikachu')
    await flushPromises()

    expect(fetchPokemonDetail).toHaveBeenCalledWith('pikachu')
    expect(fetchPokemonSpecies).toHaveBeenCalledWith(25)
    expect(store.selectedDetail?.name).toBe('pikachu')
    expect(store.selectedSpecies).toEqual({
      peso: '6,9 kg',
      altura: '0,7 m',
      categoria: 'Pokémon Ratón',
      descripcion:
        'Cuanto más potente es la energía que genera, más blandas y elásticas se vuelven las bolsas de sus mejillas.',
      genero: '50% / 50%',
      habilidad: 'Static',
      debilidades: ['ground'],
    })
  })

  it('guards against duplicate concurrent fetches of the same name', async () => {
    vi.mocked(fetchPokemonSpecies).mockResolvedValue(pikachuSpecies)
    const gate = deferred<PokemonDetail>()
    vi.mocked(fetchPokemonDetail).mockReturnValueOnce(gate.promise)

    const first = store.openDetail('pikachu')
    const second = store.openDetail('pikachu')
    gate.resolve(pikachuDetail)
    await Promise.all([first, second])

    expect(fetchPokemonDetail).toHaveBeenCalledTimes(1)
    expect(store.selectedDetail?.name).toBe('pikachu')
  })

  it('cached visit skips the detail and species re-requests', async () => {
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    vi.mocked(fetchPokemonSpecies).mockResolvedValueOnce(pikachuSpecies)

    await store.openDetail('pikachu')
    await flushPromises()
    await store.openDetail('pikachu')
    await flushPromises()

    expect(fetchPokemonDetail).toHaveBeenCalledTimes(1)
    expect(fetchPokemonSpecies).toHaveBeenCalledTimes(1)
    expect(store.selectedDetail?.id).toBe(25)
  })

  it('failed/404 detail is not cached: detailError set and the next visit re-fetches', async () => {
    vi.mocked(fetchPokemonSpecies).mockResolvedValue(pikachuSpecies)
    vi.mocked(fetchPokemonDetail).mockRejectedValueOnce(new Error('404 not found'))

    await store.openDetail('missing')

    expect(store.detailError).toBe('missing')
    expect(store.selectedDetail).toBeNull()

    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    await store.openDetail('missing')

    expect(fetchPokemonDetail).toHaveBeenCalledTimes(2)
    expect(store.detailError).toBeNull()
    expect(store.selectedDetail?.id).toBe(25)
  })

  it('species failure degrades categoria/descripcion/genero to — but keeps detail fields', async () => {
    await preloadWith({ electric: ['ground'] })
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    vi.mocked(fetchPokemonSpecies).mockRejectedValueOnce(new Error('down'))

    await store.openDetail('pikachu')
    await flushPromises()

    expect(store.selectedSpecies?.categoria).toBe('—')
    expect(store.selectedSpecies?.descripcion).toBe('—')
    expect(store.selectedSpecies?.genero).toBe('—')
    expect(store.selectedSpecies?.habilidad).toBe('Static')
    expect(store.selectedSpecies?.debilidades).toEqual(['ground'])
    expect(store.selectedSpecies?.peso).toBe('6,9 kg')
  })

  it('renders gendered percentages male first (bulbasaur rate 1 → 87,5% / 12,5%)', async () => {
    await preloadWith({
      grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
      poison: ['ground', 'psychic'],
    })
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(bulbasaurDetail)
    vi.mocked(fetchPokemonSpecies).mockResolvedValueOnce(bulbasaurSpecies)

    await store.openDetail('bulbasaur')
    await flushPromises()

    expect(store.selectedSpecies?.genero).toBe('87,5% / 12,5%')
    expect(store.selectedSpecies?.categoria).toBe('Pokémon Semilla')
    expect(store.selectedSpecies?.habilidad).toBe('Overgrow')
    expect(store.selectedSpecies?.debilidades).toEqual(['fire', 'ice', 'poison', 'flying', 'bug', 'ground', 'psychic'])
  })

  it('renders genderless pokemon and falls back to English genus/flavor', async () => {
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    vi.mocked(fetchPokemonSpecies).mockResolvedValueOnce(enOnlySpecies)

    await store.openDetail('pikachu')
    await flushPromises()

    expect(store.selectedSpecies?.genero).toBe('Sin género')
    expect(store.selectedSpecies?.categoria).toBe('Seed Pokémon')
    expect(store.selectedSpecies?.descripcion).toBe('Some English text.')
  })

  it('degrades categoria/descripcion to — when no es/en entry exists', async () => {
    vi.mocked(fetchPokemonDetail).mockResolvedValueOnce(pikachuDetail)
    vi.mocked(fetchPokemonSpecies).mockResolvedValueOnce(noLangSpecies)

    await store.openDetail('pikachu')
    await flushPromises()

    expect(store.selectedSpecies?.categoria).toBe('—')
    expect(store.selectedSpecies?.descripcion).toBe('—')
    expect(store.selectedSpecies?.genero).toBe('Sin género')
  })
})

describe('pokemon store — favorites slice (2.5)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    vi.mocked(fetchPokemonDetail).mockReset()
    vi.mocked(fetchPokemonSpecies).mockReset()
    window.localStorage.clear()
    store = usePokemonStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('toggleFavorite adds a snapshot with name, id, imageUrl, types, and an ISO addedAt', () => {
    store.toggleFavorite(pikachuFavoriteInput)

    expect(store.isFavorite('pikachu')).toBe(true)
    expect(store.favorites).toHaveLength(1)
    expect(store.favorites[0]).toMatchObject({
      name: 'pikachu',
      id: 25,
      imageUrl: artwork(25),
      types: ['electric'],
    })
    expect(store.favorites[0]?.addedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('toggleFavorite removes an existing favorite (toggle off)', () => {
    store.toggleFavorite(pikachuFavoriteInput)
    store.toggleFavorite(pikachuFavoriteInput)

    expect(store.isFavorite('pikachu')).toBe(false)
    expect(store.favorites).toHaveLength(0)
  })

  it('removeFavorite removes only the target, keeping other favorites', () => {
    store.toggleFavorite(pikachuFavoriteInput)
    store.toggleFavorite(bulbasaurFavoriteInput)

    store.removeFavorite('pikachu')

    expect(store.isFavorite('pikachu')).toBe(false)
    expect(store.isFavorite('bulbasaur')).toBe(true)
    expect(store.favorites.map((favorite) => favorite.name)).toEqual(['bulbasaur'])
  })

  it('persists the full array on every mutation', () => {
    store.toggleFavorite(pikachuFavoriteInput)
    const afterAdd = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoritePokemon[]
    expect(afterAdd).toHaveLength(1)
    expect(afterAdd[0]?.name).toBe('pikachu')

    store.toggleFavorite(bulbasaurFavoriteInput)
    const afterSecond = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoritePokemon[]
    expect(afterSecond).toHaveLength(2)

    store.removeFavorite('pikachu')
    const afterRemove = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoritePokemon[]
    expect(afterRemove).toHaveLength(1)
    expect(afterRemove[0]?.name).toBe('bulbasaur')
  })

  it('rehydrates from localStorage on init', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([pikachuFavorite, bulbasaurFavorite]))

    setActivePinia(createPinia())
    const fresh = usePokemonStore()

    expect(fresh.favorites).toEqual([pikachuFavorite, bulbasaurFavorite])
  })

  it('keeps toggling when localStorage throws (in-memory fallback)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })

    expect(() => store.toggleFavorite(pikachuFavoriteInput)).not.toThrow()
    expect(store.isFavorite('pikachu')).toBe(true)
    expect(store.favorites).toHaveLength(1)

    store.toggleFavorite(pikachuFavoriteInput)
    expect(store.isFavorite('pikachu')).toBe(false)
  })

  it('syncs from a cross-tab storage event (full-array, last-write-wins)', () => {
    store.toggleFavorite(pikachuFavoriteInput)

    dispatchStorageEvent(JSON.stringify([bulbasaurFavorite]))

    expect(store.favorites).toEqual([bulbasaurFavorite])
  })

  it('clears favorites when a cross-tab event carries a null newValue', () => {
    store.toggleFavorite(pikachuFavoriteInput)

    dispatchStorageEvent(null)

    expect(store.favorites).toEqual([])
  })

  it('ignores storage events for other keys', () => {
    store.toggleFavorite(pikachuFavoriteInput)

    dispatchStorageEvent(JSON.stringify([bulbasaurFavorite]), 'other-key')

    expect(store.favorites).toHaveLength(1)
    expect(store.favorites[0]?.name).toBe('pikachu')
  })
})

describe('pokemon store — type preload slice (2.9)', () => {
  let store: ReturnType<typeof usePokemonStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchPokemonPage).mockReset()
    vi.mocked(fetchTypeCatalog).mockReset()
    vi.mocked(fetchPokemonDetail).mockReset()
    vi.mocked(fetchPokemonSpecies).mockReset()
    store = usePokemonStore()
  })

  it('preloads each of the 18 type catalogs exactly once', async () => {
    vi.mocked(fetchTypeCatalog).mockResolvedValue(makeCatalog(['poke-a', 'poke-b']))

    await store.preloadTypes()
    await store.preloadTypes()

    expect(fetchTypeCatalog).toHaveBeenCalledTimes(18)
    expect(store.typePreloaded).toBe(true)
    expect(store.typePreloadError).toBeNull()
  })

  it('builds nameToTypes with 1–2 types per pokemon in canonical type order', async () => {
    vi.mocked(fetchTypeCatalog).mockImplementation(async (type: TypeName) => {
      const perType: Partial<Record<TypeName, string[]>> = {
        electric: ['pikachu', 'raichu'],
        grass: ['bulbasaur', 'pikachu'],
        fire: ['charmander'],
      }
      return makeCatalog(perType[type] ?? [])
    })

    await store.preloadTypes()

    expect(store.nameToTypes.get('pikachu')).toEqual(['grass', 'electric'])
    expect(store.nameToTypes.get('raichu')).toEqual(['electric'])
    expect(store.nameToTypes.get('bulbasaur')).toEqual(['grass'])
    expect(store.nameToTypes.get('charmander')).toEqual(['fire'])
  })

  it('keeps at most 6 type requests in flight', async () => {
    const inFlight = { count: 0, max: 0 }
    const gates = new Map<TypeName, ReturnType<typeof deferred<TypeCatalogResponse>>>()
    vi.mocked(fetchTypeCatalog).mockImplementation((type: TypeName) => {
      inFlight.count++
      inFlight.max = Math.max(inFlight.max, inFlight.count)
      const gate = deferred<TypeCatalogResponse>()
      gates.set(type, gate)
      gate.promise.finally(() => {
        inFlight.count--
      })
      return gate.promise
    })

    const preload = store.preloadTypes()
    await flushPromises()
    expect(inFlight.max).toBeLessThanOrEqual(6)

    let safety = 0
    while (inFlight.count > 0 && safety < 30) {
      for (const gate of gates.values()) gate.resolve(makeCatalog([]))
      await flushPromises(5)
      safety++
    }
    await preload

    expect(fetchTypeCatalog).toHaveBeenCalledTimes(18)
    expect(inFlight.max).toBeLessThanOrEqual(6)
  })

  it('records failed types in typePreloadError, retryable without blocking the rest', async () => {
    vi.mocked(fetchTypeCatalog).mockImplementation(async (type: TypeName) => {
      if (type === 'fire') throw new Error('down')
      return makeCatalog([`${type}-one`])
    })

    await store.preloadTypes()

    expect(store.typePreloaded).toBe(true)
    expect(store.typePreloadError).toEqual(['fire'])
    expect(store.nameToTypes.get('fire-one')).toBeUndefined()
    expect(store.nameToTypes.get('electric-one')).toEqual(['electric'])

    vi.mocked(fetchTypeCatalog).mockImplementation(async (type: TypeName) => makeCatalog([`${type}-one`]))
    await store.retryPreload()

    expect(store.typePreloadError).toBeNull()
    expect(store.nameToTypes.get('fire-one')).toEqual(['fire'])
  })

  it('applyTypeFilter uses the preloaded catalogs with zero network on apply', async () => {
    vi.mocked(fetchTypeCatalog).mockImplementation(async (type: TypeName) => makeCatalog([`${type}-poke`]))

    await store.preloadTypes()
    expect(fetchTypeCatalog).toHaveBeenCalledTimes(18)

    await store.applyTypeFilter(['electric', 'fire'])

    expect(fetchTypeCatalog).toHaveBeenCalledTimes(18)
    expect(store.appliedTypes).toEqual(['electric', 'fire'])
    expect(summaryNames(store.filteredSet)).toEqual(['electric-poke', 'fire-poke'])
  })
})
